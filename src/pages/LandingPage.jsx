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

    // Auth context for restricting specific actions
    const { currentUser } = useAuth();

    const fileInputRef = useRef(null);
    const docInputRef = useRef(null);

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

    const triggerDocUpload = () => {
        if (!currentUser) {
            setIsLoginModalOpen(true);
        } else {
            docInputRef.current?.click();
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

    const handleDocUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsLoading(true);
        setChatResponse('');
        setQuery('Analyzing document... 📄');
        window.speechSynthesis.cancel();

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(`${API_BASE_URL}/api/analyze-document`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.response) {
                setChatResponse(data.response);
            } else if (data.error) {
                setChatResponse(`Error: ${data.error} ${data.details || ''}`);
            } else {
                setChatResponse('Error analyzing document.');
            }
        } catch (error) {
            console.error('Error uploading document:', error);
            setChatResponse('Network error: Unable to upload document.');
        } finally {
            setIsLoading(false);
            setQuery('');
            // Reset input so same file can be selected again
            e.target.value = null;
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
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 w-full">
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
                                ref={docInputRef}
                                onChange={handleDocUpload}
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
                            <button
                                type="button"
                                onClick={triggerDocUpload}
                                className={`${buttonClasses} rounded-full transition-transform active:scale-95 flex items-center justify-center bg-white/50 backdrop-blur-md border border-white/60 text-stone-600 hover:bg-white hover:text-stone-900 shadow-sm`}
                                aria-label="Analyze Document"
                                title="Simplify Paperwork (Requires Login)"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconSize}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
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

                {(chatResponse || uploadedImage) && (
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
                            <div className={`prose prose-stone max-w-none prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800 ${responseTextClasses}`}>
                                <ReactMarkdown
                                    components={{
                                        a: ({ node, ...props }) => (
                                            <a
                                                {...props}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`inline-flex items-center gap-1.5 px-3 py-1 my-1 font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:text-blue-800 transition-colors no-underline ${isSeniorMode ? 'text-xl py-2 px-4' : 'text-sm'}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={isSeniorMode ? "w-6 h-6" : "w-4 h-4"}>
                                                    <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L1.928 4.733a.75.75 0 11.535-1.405l7.26 2.768a20.897 20.897 0 014.854-1.218z" clipRule="evenodd" />
                                                </svg>
                                                {props.children}
                                            </a>
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
                            </div>
                        )}

                        {emailData && emailData.recipient_email && (
                            <div className="mt-6 pt-4 border-t border-stone-200">
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
        </div>
    );
};

export default LandingPage;
