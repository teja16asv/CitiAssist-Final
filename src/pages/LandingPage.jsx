import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';

const LandingPage = ({ isSeniorMode }) => {
    let API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    if (API_BASE_URL && !API_BASE_URL.startsWith('http')) {
        API_BASE_URL = `https://${API_BASE_URL}`;
    }
    const { t, i18n } = useTranslation();
    const [query, setQuery] = useState('');
    const [chatResponse, setChatResponse] = useState('');
    const [displayedResponse, setDisplayedResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [browserSupportsSpeech, setBrowserSupportsSpeech] = useState(false);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [emailData, setEmailData] = useState(null);
    const [locationInput, setLocationInput] = useState('');
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    // --- FORM WIZARD STATE ---
    const [wizardActive, setWizardActive] = useState(false);
    const [wizardFields, setWizardFields] = useState([]); // Array of fields from API
    const [currentWizardIndex, setCurrentWizardIndex] = useState(0);
    const [wizardAnswers, setWizardAnswers] = useState({}); // { field_name: { answer, box_2d } }
    const [wizardSessionId, setWizardSessionId] = useState('');
    const [wizardReviewMode, setWizardReviewMode] = useState(false);
    const [filledFormImage, setFilledFormImage] = useState(null);
    const formInputRef = useRef(null);

    // Auth context for restricting specific actions
    const { currentUser } = useAuth();

    const fileInputRef = useRef(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            setBrowserSupportsSpeech(true);
        }
    }, []);

    // Text-to-Speech Effect
    useEffect(() => {
        if (isSeniorMode && chatResponse) {
            // Cancel any previous speech
            window.speechSynthesis.cancel();

            // Strip Markdown links: [Text](url) -> Text
            let cleanText = chatResponse.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
            // Remove remaining markdown symbols (*, #, _, `, etc.)
            cleanText = cleanText.replace(/[*#_`]/g, '');

            const utterance = new SpeechSynthesisUtterance(cleanText);
            // Set language based on current app language
            utterance.lang = i18n.resolvedLanguage === 'te' ? 'te-IN' :
                i18n.resolvedLanguage === 'hi' ? 'hi-IN' : 'en-US';

            // Slow down slightly for senior mode
            utterance.rate = 0.9;

            window.speechSynthesis.speak(utterance);
        } else {
            // Cancel speech if mode is turned off or response cleared
            window.speechSynthesis.cancel();
        }
    }, [chatResponse, isSeniorMode, i18n.resolvedLanguage]);

    // Typewriter Effect
    useEffect(() => {
        if (!chatResponse) {
            setDisplayedResponse('');
            return;
        }

        // If it's an error message (starts with "Error" or "Network error"), show instantly
        if (chatResponse.startsWith("Error") || chatResponse.startsWith("Network")) {
            setDisplayedResponse(chatResponse);
            return;
        }

        setDisplayedResponse('');
        let index = -1;
        const intervalId = setInterval(() => {
            index++;
            if (index < chatResponse.length) {
                setDisplayedResponse((prev) => prev + chatResponse.charAt(index));
            } else {
                clearInterval(intervalId);
            }
        }, 15); // Adjust speed here (lower is faster)

        return () => clearInterval(intervalId);
    }, [chatResponse]);

    const startListening = () => {
        if (!browserSupportsSpeech) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        const langMap = {
            'en': 'en-US',
            'te': 'te-IN',
            'hi': 'hi-IN'
        };
        recognition.lang = langMap[i18n.resolvedLanguage] || 'en-US';

        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setQuery(transcript);
            setIsListening(false);
        };

        recognition.onerror = (event) => {
            console.error(event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };



    const handleQuickLink = async (key, label) => {
        // Just set basic query first so UI feels responsive
        setQuery(label);

        // Smart "Near Me" logic for quick links (adding coordinates if relevant)
        // We reuse the logic: if the label or key implies location, we fetch it.
        // The original code had a list of keys. We can simplify by just checking "near me" or keeping the specific keys.
        // Let's keep the specific keys as they are buttons that imply "Near Me" even if the text doesn't say it explicitly? 
        // Actually, let's standardize. If the quick link label has "near me" or if it is in the list, we fetch location.

        const locationKeys = ['hospitals', 'metro', 'electricity'];
        const needsLocation = locationKeys.includes(key) || label.toLowerCase().includes('near me');

        if (needsLocation) {
            setIsLoading(true);
            window.speechSynthesis.cancel();

            try {
                if ('geolocation' in navigator) {
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            timeout: 5000
                        });
                    });

                    const { latitude, longitude } = position.coords;
                    const locationQuery = `${label} near ${latitude}, ${longitude}`;
                    await executeSearch(locationQuery);
                } else if (currentUser?.location) {
                    const { lat, lng } = currentUser.location;
                    const locationQuery = `${label} near ${lat}, ${lng}`;
                    await executeSearch(locationQuery);
                } else {
                    await executeSearch(label);
                }
            } catch (error) {
                console.warn("Location access denied or error:", error);

                // Fallback to saved profile location if available
                if (currentUser?.location) {
                    const { lat, lng } = currentUser.location;
                    const locationQuery = `${label} near ${lat}, ${lng}`;
                    await executeSearch(locationQuery);
                } else {
                    await executeSearch(label);
                }
            } finally {
                // executeSearch handles isLoading(false) but we set it true here.
                // If executeSearch is called, it sets loading true then false. 
                // If we error before calling it, we need to turn it off? 
                // executeSearch handles it. 
            }
        } else {
            await executeSearch(label);
        }
    };

    const executeSearch = async (searchQuery) => {
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        setChatResponse('');
        setUploadedImage(null); // Clear previous image on new search
        setEmailData(null);     // Clear previous email data
        setLocationInput('');   // Clear location input
        window.speechSynthesis.cancel();

        // Reset Wizard
        setWizardActive(false);
        setWizardFields([]);
        setWizardAnswers({});
        setWizardReviewMode(false);
        setFilledFormImage(null);

        const offlineSurvivalData = `
# 🚨 OFFLINE CONNECTION DETECTED

> **Don't Panic.** Your device is disconnected, but *CitiAssist* has loaded critical emergency data directly from its local memory.

---

### 🚑 Immediate Medical & Rescue
*   **All-In-One Emergency:** \`112\`
*   **Ambulance Services:** \`108\`
*   **Fire Department:** \`101\`
*   **Police Control Room:** \`100\`

### 🛡️ Safety & Security
*   **Women's Helpline (SHE Teams):** \`181\` | \`100\`
*   **Cyber Crime Support:** \`1930\`
*   **Traffic Police Helpline:** \`9010203626\`

### ⚡ Civic Utilities (GHMC & TSSPDCL)
*   **GHMC (Civic/Potholes/Garbage):** \`040-21111111\`
*   **Electricity Control Room:** \`1912\`

---
*Please keep this screen open or take a screenshot if you are in an area with poor network reception.*
`;

        if (!navigator.onLine) {
            setChatResponse(offlineSurvivalData);
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: searchQuery }),
            });

            const data = await response.json();
            console.log('Backend response:', data);

            if (data.response) {
                setChatResponse(data.response);
            } else if (data.reply) {
                setChatResponse(data.reply);
            } else if (data.error) {
                setChatResponse(`Error: ${data.error} ${data.details || ''}`);
            } else {
                setChatResponse('Error: Unexpected response format from server.');
                console.error("Full response:", data);
            }
        } catch (error) {
            console.error('Error fetching chat response:', error);
            // If it's a network error (like CORS failure due to offline, or backend down)
            setChatResponse(offlineSurvivalData);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();

        // --- WIZARD INTERCEPTOR ---
        if (wizardActive && !wizardReviewMode) {
            if (!query.trim()) return;

            const currentField = wizardFields[currentWizardIndex];

            // Save answer
            setWizardAnswers(prev => ({
                ...prev,
                [currentField.field_name]: {
                    answer: query,
                    box_2d: currentField.box_2d
                }
            }));

            setQuery('');

            // Move to next question or enter Review Mode
            if (currentWizardIndex < wizardFields.length - 1) {
                const nextField = wizardFields[currentWizardIndex + 1];
                setCurrentWizardIndex(currentWizardIndex + 1);
                setChatResponse(nextField.question);
            } else {
                setWizardReviewMode(true);
                setChatResponse("✅ All questions answered! Please review your details below. Tap any answer to edit it before we generate your final PDF.");
            }
            return;
        }

        // Smart "Near Me" Detection
        if (query.toLowerCase().includes('near me')) {
            if ('geolocation' in navigator) {
                setIsLoading(true);
                try {
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            timeout: 5000
                        });
                    });

                    const { latitude, longitude } = position.coords;
                    const locationQuery = `${query} (Current Location: ${latitude}, ${longitude})`;
                    await executeSearch(locationQuery);
                    return;
                } catch (error) {
                    console.warn("Location access denied or timed out:", error);
                    // Fallback to saved location
                    if (currentUser?.location) {
                        const { lat, lng } = currentUser.location;
                        const locationQuery = `${query} (Current Location: ${lat}, ${lng})`;
                        await executeSearch(locationQuery);
                        return;
                    }
                }
            } else if (currentUser?.location) {
                // Browser doesn't support geolocation, but we have auth context
                setIsLoading(true);
                const { lat, lng } = currentUser.location;
                const locationQuery = `${query} (Current Location: ${lat}, ${lng})`;
                await executeSearch(locationQuery);
                return;
            } else {
                console.warn("Geolocation not supported and no profile location saved.");
            }
        }

        // Normal search (or fallback)
        await executeSearch(query);
    };

    // Guard functions for Auth-required actions
    const triggerImageUpload = () => {
        if (!currentUser) {
            setIsLoginModalOpen(true);
        } else {
            fileInputRef.current?.click();
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Create preview URL
        const imageUrl = URL.createObjectURL(file);
        setUploadedImage(imageUrl);
        setEmailData(null); // Reset email data for new upload
        setLocationInput(''); // Reset location for new upload

        setIsLoading(true);
        setChatResponse('');
        setQuery('Analyzing image... 📸');
        window.speechSynthesis.cancel();

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(`${API_BASE_URL}/api/report-issue`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            // Handle new JSON structure with email details
            if (data.recipient_email || data.body) {
                setEmailData({
                    recipient_email: data.recipient_email,
                    subject: data.subject,
                    body: data.body
                });
            }

            if (data.response) {
                setChatResponse(data.response);
            } else if (data.error) {
                setChatResponse(`Error: ${data.error} ${data.details || ''}`);
            } else {
                setChatResponse('Error analyzing image.');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            setChatResponse('Network error: Unable to upload image.');
        } finally {
            setIsLoading(false);
            setQuery('');
            // Reset input so same file can be selected again
            e.target.value = null;
        }
    };

    // --- ADVANCED FORM FILLER LOGIC ---
    const triggerFormUpload = () => {
        if (!currentUser) {
            setIsLoginModalOpen(true);
        } else {
            formInputRef.current?.click();
        }
    };

    const handleFormUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const imageUrl = URL.createObjectURL(file);
        setUploadedImage(imageUrl);
        setChatResponse('');
        setFilledFormImage(null);
        setWizardReviewMode(false);
        setIsLoading(true);
        setQuery('Scanning blank document for fields... 🔍');
        window.speechSynthesis.cancel();

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(`${API_BASE_URL}/api/start-form-fill`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.fields && data.fields.length > 0) {
                setWizardActive(true);
                setWizardFields(data.fields);
                setCurrentWizardIndex(0);
                setWizardSessionId(data.session_id);
                setWizardAnswers({});
                setChatResponse(`Document analyzed! I found ${data.fields.length} blank fields. Let's fill them out together.\n\n**${data.fields[0].question}**`);
            } else if (data.error) {
                setChatResponse(`Error: ${data.error}`);
            } else {
                setChatResponse('Could not detect any blank lines to fill on this document.');
            }
        } catch (error) {
            console.error('Error starting form filler:', error);
            setChatResponse('Network error: Unable to analyze document.');
        } finally {
            setIsLoading(false);
            setQuery('');
            e.target.value = null; // Reset
        }
    };

    const generateFilledForm = async () => {
        setIsLoading(true);
        setChatResponse('Printing your answers onto the official document... 🖨️');

        try {
            const response = await fetch(`${API_BASE_URL}/api/fill-form`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: wizardSessionId,
                    answers: wizardAnswers
                })
            });

            const data = await response.json();

            if (data.filled_image_base64) {
                setWizardActive(false); // End wizard
                setWizardReviewMode(false);
                setFilledFormImage(data.filled_image_base64);
                setChatResponse("✅ **Success!** Your document has been perfectly filled out. Click the button below the image to download it.");
            } else {
                setChatResponse(`Error generating form: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error generating form:', error);
            setChatResponse('Network error while generating the final document.');
        } finally {
            setIsLoading(false);
        }
    };

    // Allow user to manually fix an answer in the Review Card
    const editWizardAnswer = (fieldName) => {
        const newValue = prompt(`Edit answer for ${fieldName}:`, wizardAnswers[fieldName]?.answer || "");
        if (newValue !== null) {
            setWizardAnswers(prev => ({
                ...prev,
                [fieldName]: {
                    ...prev[fieldName],
                    answer: newValue
                }
            }));
        }
    };

    // Dynamic Classes based on Senior Mode
    const containerClasses = isSeniorMode ? "space-y-8 py-6 md:py-10" : "space-y-6 md:space-y-8";
    const titleClasses = isSeniorMode ? "text-3xl md:text-5xl md:text-7xl leading-tight" : "text-3xl md:text-4xl md:text-5xl tracking-tight";
    const inputClasses = isSeniorMode ? "h-20 text-xl pl-6" : "h-14 md:h-16 text-base md:text-lg pl-5 md:pl-6";
    const buttonClasses = isSeniorMode ? "p-4" : "p-2.5 md:p-3";
    const iconSize = isSeniorMode ? "w-8 h-8" : "w-5 h-5";
    const responseTextClasses = isSeniorMode ? "text-2xl leading-relaxed font-medium" : "";

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 w-full" >
            <div className={`w-full max-w-3xl text-center animate-fade-in-up ${containerClasses}`}>
                <h2 className={`${titleClasses} font-bold text-stone-800`}>
                    {t('heroTitle')}
                </h2>

                <form onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto">
                    <div className="relative group flex flex-col lg:block gap-4">
                        <div className="relative w-full">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={isListening ? t('listening') : t('searchPlaceholder')}
                                className={`w-full ${inputClasses} ${isSeniorMode ? 'pr-20' : 'pr-14 lg:pr-40'} rounded-3xl border-0 shadow-lg shadow-stone-300/40 focus:ring-2 focus:ring-stone-400 focus:shadow-xl bg-white/80 backdrop-blur-sm placeholder:text-stone-400 text-stone-800 transition-all duration-300 outline-none ${isListening ? 'ring-2 ring-red-400 animate-pulse' : ''}`}
                            />

                            {/* Standard Search Button (Inside Input) */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`${buttonClasses} bg-stone-800 text-white rounded-full hover:bg-stone-700 transition-transform active:scale-95 shadow-md flex items-center justify-center disabled:opacity-50`}
                                    aria-label="Search"
                                >
                                    {isLoading ? (
                                        <div className={`${iconSize} border-2 border-white/30 border-t-white rounded-full animate-spin`}></div>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={iconSize}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons: 
                            - Mobile: Integrated row below input with backdrop
                            - Desktop: Absolute inside input
                        */}
                        <div className={`flex justify-center gap-3 transition-all duration-300
                            ${isSeniorMode
                                ? 'flex-row mt-4 scale-100'
                                : 'mt-3 lg:mt-0 lg:absolute lg:right-16 lg:top-1/2 lg:-translate-y-1/2'
                            } ${!isSeniorMode && 'p-1.5 rounded-2xl bg-white/40 backdrop-blur-sm border border-white/40 lg:bg-transparent lg:border-0 lg:backdrop-blur-none lg:p-0'}`}>

                            <button
                                type="button"
                                onClick={triggerFormUpload}
                                className={`${buttonClasses} rounded-full transition-transform active:scale-95 flex items-center justify-center bg-white/50 backdrop-blur-md border border-white/60 text-stone-600 hover:bg-white hover:text-stone-900 shadow-sm group/btn relative`}
                                title="Auto-Fill Document Wizard"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconSize}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                            </button>

                            {/* Hidden File Inputs */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="hidden"
                            />
                            <input
                                type="file"
                                ref={formInputRef}
                                onChange={handleFormUpload}
                                accept="image/*"
                                className="hidden"
                            />

                            <button
                                type="button"
                                onClick={triggerImageUpload}
                                className={`${buttonClasses} rounded-full transition-transform active:scale-95 flex items-center justify-center bg-white/50 backdrop-blur-md border border-white/60 text-stone-600 hover:bg-white hover:text-stone-900 shadow-sm`}
                                aria-label="Snap & Solve"
                                title="Snap & Solve (Requires Login)"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconSize}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                                </svg>
                            </button>
                            {browserSupportsSpeech && (
                                <button
                                    type="button"
                                    onClick={startListening}
                                    className={`${buttonClasses} rounded-full transition-transform active:scale-95 flex items-center justify-center shadow-sm ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white/50 backdrop-blur-md border border-white/60 text-stone-600 hover:bg-white hover:text-stone-900'}`}
                                    aria-label="Voice Search"
                                    title="Voice Search"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={iconSize}>
                                        <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                                        <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </form>

                {(chatResponse || uploadedImage || wizardActive || filledFormImage) && (
                    <div className="w-full max-w-2xl mx-auto mt-6 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-xl text-left animate-fade-in border border-white/50">
                        {uploadedImage && (
                            <div className="mb-6 flex justify-center">
                                <img
                                    src={uploadedImage}
                                    alt="Uploaded"
                                    className="max-w-full h-auto max-h-64 rounded-xl shadow-md border border-stone-200"
                                />
                            </div>
                        )}

                        {chatResponse && (
                            <div className="w-full max-w-4xl mx-auto text-left mt-8 mb-12 animate-fade-in-up">
                                <div className="bg-white/90 backdrop-blur border border-stone-200 shadow-xl rounded-3xl p-6 md:p-8 flex items-start gap-4">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0 shadow-inner">
                                        <span className="text-xl md:text-2xl">🤖</span>
                                    </div>
                                    <div className={`flex-1 w-full overflow-hidden prose prose-stone max-w-none text-stone-700 font-medium whitespace-pre-wrap ${responseTextClasses}`}>
                                        <ReactMarkdown
                                            components={{
                                                img: ({ node, ...props }) => (
                                                    <img {...props} className="max-w-full h-auto rounded-xl shadow-md my-4" />
                                                ),
                                                a: ({ node, ...props }) => (
                                                    <a {...props} className="text-blue-600 hover:text-blue-800 underline decoration-blue-300 underline-offset-4" target="_blank" rel="noopener noreferrer" />
                                                ),
                                                ul: ({ node, ...props }) => <ul className="space-y-4 my-4 list-none pl-0" {...props} />,
                                                li: ({ node, ...props }) => (
                                                    <li className="flex gap-3 items-start p-3 bg-white/50 rounded-lg border border-white/60" {...props}>
                                                        <span className={`mt-2 rounded-full bg-stone-400 flex-shrink-0 ${isSeniorMode ? "w-3 h-3" : "w-2 h-2"}`} />
                                                        <div className="flex-1 text-stone-700 leading-relaxed">{props.children}</div>
                                                    </li>
                                                ),
                                                h3: ({ node, ...props }) => <h3 className={`${isSeniorMode ? "text-3xl mt-10 mb-6" : "text-xl mt-8 mb-4"} font-bold text-stone-800 border-b border-stone-200 pb-2`} {...props} />,
                                                strong: ({ node, ...props }) => <strong className="font-bold text-stone-900" {...props} />,
                                                p: ({ node, ...props }) => <p className="mb-4 text-stone-700 leading-relaxed" {...props} />,
                                            }}
                                        >
                                            {displayedResponse}
                                        </ReactMarkdown>

                                        {/* WIZARD INLINE CHAT INPUT */}
                                        {wizardActive && !wizardReviewMode && !isLoading && (
                                            <form onSubmit={handleSearch} className="mt-8 flex flex-col sm:flex-row gap-3 animate-fade-in-up border-t border-stone-200 pt-6">
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    value={query}
                                                    onChange={(e) => setQuery(e.target.value)}
                                                    placeholder={isListening ? t('listening') : "Type your answer here..."}
                                                    className={`flex-1 px-5 py-3 rounded-2xl border ${isListening ? 'border-red-400 ring-2 ring-red-400/50 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse' : 'border-stone-300'} shadow-inner focus:ring-2 focus:ring-stone-400 focus:border-transparent outline-none transition-all ${isSeniorMode ? 'text-xl h-14' : 'text-base'}`}
                                                />
                                                <div className="flex gap-2 w-full sm:w-auto">
                                                    {browserSupportsSpeech && (
                                                        <button
                                                            type="button"
                                                            onClick={startListening}
                                                            className={`px-4 py-3 rounded-2xl transition active:scale-95 flex items-center justify-center shadow-md ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white border border-stone-300 text-stone-600 hover:bg-stone-50'}`}
                                                            aria-label="Dictate Answer"
                                                            title="Dictate Answer"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                                                <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                                                                <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    <button
                                                        type="submit"
                                                        disabled={!query.trim()}
                                                        className="flex-1 sm:flex-none px-6 py-3 bg-stone-800 text-white font-medium rounded-2xl hover:bg-stone-700 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                                                    >
                                                        Send
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* WIZARD REVIEW MODE CARD */}
                        {wizardReviewMode && !filledFormImage && (
                            <div className="w-full max-w-4xl mx-auto text-left mt-6 animate-fade-in-up">
                                <div className="bg-white/95 backdrop-blur border-2 border-green-200 shadow-xl rounded-3xl p-6 md:p-8">
                                    <h3 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-green-600">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Review Your Answers
                                    </h3>

                                    <div className="space-y-4 mb-8">
                                        {wizardFields.map((field) => (
                                            <div key={field.field_name} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-200 hover:bg-stone-100 transition-colors cursor-pointer group" onClick={() => editWizardAnswer(field.field_name)}>
                                                <div>
                                                    <p className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-1 flex items-center gap-2">
                                                        {field.field_name.replace(/_/g, ' ')}
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                                        </svg>
                                                    </p>
                                                    <p className="text-lg font-medium text-stone-800">
                                                        {wizardAnswers[field.field_name]?.answer || <span className="text-red-500 italic">Missing</span>}
                                                    </p>
                                                </div>
                                                <button className="mt-2 md:mt-0 px-4 py-2 text-sm font-medium text-stone-600 bg-white border border-stone-300 rounded-lg shadow-sm hover:bg-stone-50 transition-colors">
                                                    Tap to Edit
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={generateFilledForm}
                                        disabled={isLoading}
                                        className="w-full py-4 bg-green-600 hover:bg-green-700 text-white text-xl font-bold rounded-xl shadow-lg shadow-green-600/30 transform transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {isLoading ? (
                                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                Confirm & Generate PDF
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                                </svg>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* WIZARD FINAL FILLED FORM DISPLAY */}
                        {filledFormImage && (
                            <div className="w-full max-w-4xl mx-auto text-left mt-6 animate-fade-in-up">
                                <div className="bg-white/95 backdrop-blur border border-stone-200 shadow-xl rounded-3xl p-6 md:p-8 flex flex-col items-center">
                                    <h3 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-green-600">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Your Filled Document is Ready
                                    </h3>
                                    <img
                                        src={`data:image/jpeg;base64,${filledFormImage}`}
                                        alt="Filled Form"
                                        className="max-w-full h-auto max-h-[600px] border border-stone-300 rounded-xl shadow-lg mb-6"
                                    />
                                    <a
                                        href={`data:image/jpeg;base64,${filledFormImage}`}
                                        download="Filled_Document.jpg"
                                        className="px-8 py-4 bg-stone-800 hover:bg-stone-700 text-white text-xl font-bold rounded-xl shadow-lg shadow-stone-800/20 transform transition-transform active:scale-95 flex items-center justify-center gap-3 w-full md:w-auto"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                        </svg>
                                        Download Final PDF
                                    </a>
                                </div>
                            </div>
                        )}

                        {emailData && emailData.recipient_email && (
                            <div className="mt-6 pt-4 border-t border-stone-200 w-full max-w-2xl mx-auto">
                                <div className="mb-4">
                                    <label htmlFor="location" className="block text-sm font-medium text-stone-700 mb-1">
                                        Location of Issue (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        id="location"
                                        value={locationInput}
                                        onChange={(e) => setLocationInput(e.target.value)}
                                        placeholder="e.g. Jubilee Hills Road No. 10"
                                        className={`w-full px-4 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-stone-400 focus:border-transparent outline-none transition-all ${isSeniorMode ? 'text-xl h-14' : 'text-base'}`}
                                    />
                                </div>

                                {(() => {
                                    const finalSubject = emailData.subject.replace('[Location]', locationInput || 'Hyderabad');

                                    let finalBody = emailData.body.replace('[Date]', new Date().toLocaleDateString());
                                    if (finalBody.includes('[Location]')) {
                                        finalBody = finalBody.replace('[Location]', locationInput || '[Location]');
                                    } else if (locationInput) {
                                        // Fallback: Append location if placeholder is missing
                                        finalBody += `\n\nLocation of Issue: ${locationInput}`;
                                    }

                                    return (
                                        <a
                                            href={`mailto:${emailData.recipient_email}?subject=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(finalBody)}`}
                                            className={`inline-flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-white font-medium rounded-xl shadow-md transform transition-transform active:scale-95 ${isSeniorMode ? 'px-6 py-4 text-xl w-full justify-center' : 'px-4 py-2 text-base'}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={isSeniorMode ? "w-6 h-6" : "w-5 h-5"}>
                                                <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                                                <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                                            </svg>
                                            Draft Email to Official
                                        </a>
                                    );
                                })()}
                                <p className="mt-2 text-sm text-stone-500 italic">
                                    *Please attach a photo manually as browsers block automatic attachments.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-wrap justify-center gap-4 pt-4">
                    {/* Hardcoded Transit Route Demo Button */}
                    <button
                        onClick={() => {
                            setQuery("Route: Secunderabad to Hitech City");
                            handleSearch({ preventDefault: () => { } });
                        }}
                        className={`rounded-full bg-white/40 hover:bg-white/70 border border-white/50 text-stone-700 font-medium transition-all backdrop-blur-sm shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2 ${isSeniorMode ? 'px-6 py-3 text-lg' : 'px-4 py-2 text-xs md:text-sm'}`}
                        title="Demo Multi-Modal Transit Routing"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={isSeniorMode ? "w-6 h-6 text-stone-600" : "w-4 h-4 text-stone-600"}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                        </svg>
                        Route: Secunderabad to Hitech City
                    </button>

                    {/* Dynamic Language Quick Links */}
                    {Object.values(t('quickLinks', { returnObjects: true })).map((item) => (
                        <button key={item}
                            onClick={() => {
                                setQuery(item);
                                handleSearch({ preventDefault: () => { } });
                            }}
                            className={`rounded-full bg-white/40 hover:bg-white/70 border border-white/50 text-stone-700 font-medium transition-all backdrop-blur-sm shadow-sm hover:shadow-md active:scale-95 ${isSeniorMode ? 'px-6 py-3 text-lg' : 'px-4 py-2 text-xs md:text-sm'}`}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </div>

            {/* Global Login Modal for action interceptions */}
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                isSeniorMode={isSeniorMode}
            />
        </div >
    );
};

export default LandingPage;
