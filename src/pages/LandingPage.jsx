import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';

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

                    // Update query visually (optional, or keep label) - let's keep label in input but send locationQuery
                    // setQuery(locationQuery); // Actually, user might want to see what happened.

                    await executeSearch(locationQuery);
                } else {
                    await executeSearch(label);
                }
            } catch (error) {
                console.warn("Location access denied or error:", error);
                await executeSearch(label);
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
        setIsLoading(true);
        setChatResponse('');
        setUploadedImage(null); // Clear previous image on new search
        setEmailData(null);     // Clear previous email data
        setLocationInput('');   // Clear location input
        window.speechSynthesis.cancel();

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
            setChatResponse('Network error: Unable to reach the backend server. Is python main.py running?');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();

        // Smart "Near Me" Detection
        if (query.toLowerCase().includes('near me')) {
            if ('geolocation' in navigator) {
                setIsLoading(true); // Show loading while fetching location
                try {
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            timeout: 5000
                        });
                    });

                    const { latitude, longitude } = position.coords;
                    // Append location to the query
                    const locationQuery = `${query} (Current Location: ${latitude}, ${longitude})`;
                    await executeSearch(locationQuery);
                    return; // Stop here, executeSearch was called
                } catch (error) {
                    console.warn("Location access denied or timed out:", error);
                    // Fallback to normal search if location fails
                }
            } else {
                console.warn("Geolocation not supported");
            }
        }

        // Normal search (or fallback)
        await executeSearch(query);
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
    const containerClasses = isSeniorMode ? "space-y-12 py-10" : "space-y-8";
    const titleClasses = isSeniorMode ? "text-5xl md:text-7xl leading-tight" : "text-4xl md:text-5xl tracking-tight";
    const inputClasses = isSeniorMode ? "h-24 text-2xl pl-8" : "h-16 text-lg pl-6";
    const buttonClasses = isSeniorMode ? "p-5" : "p-3";
    const iconSize = isSeniorMode ? "w-8 h-8" : "w-5 h-5";
    const responseTextClasses = isSeniorMode ? "text-2xl leading-relaxed font-medium" : "";

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 w-full">
            <div className={`w-full max-w-3xl text-center animate-fade-in-up ${containerClasses}`}>
                <h2 className={`${titleClasses} font-bold text-stone-800`}>
                    {t('heroTitle')}
                </h2>

                <form onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto">
                    <div className="relative group">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={isListening ? t('listening') : t('searchPlaceholder')}
                            className={`w-full ${inputClasses} pr-24 rounded-3xl border-0 shadow-lg shadow-stone-300/40 focus:ring-2 focus:ring-stone-400 focus:shadow-xl bg-white/80 backdrop-blur-sm placeholder:text-stone-400 text-stone-800 transition-all duration-300 outline-none ${isListening ? 'ring-2 ring-red-400 animate-pulse' : ''}`}
                        />

                        {/* Hidden File Input */}
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

                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className={`${buttonClasses} rounded-full transition-transform active:scale-95 flex items-center justify-center bg-transparent text-stone-500 hover:bg-stone-100`}
                                aria-label="Snap & Solve"
                                title="Snap & Solve"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconSize}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => docInputRef.current?.click()}
                                className={`${buttonClasses} rounded-full transition-transform active:scale-95 flex items-center justify-center bg-transparent text-stone-500 hover:bg-stone-100`}
                                aria-label="Analyze Document"
                                title="Simplify Paperwork"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconSize}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                            </button>
                            {browserSupportsSpeech && (
                                <button
                                    type="button"
                                    onClick={startListening}
                                    className={`${buttonClasses} rounded-full transition-transform active:scale-95 flex items-center justify-center ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-transparent text-stone-500 hover:bg-stone-100'}`}
                                    aria-label="Voice Search"
                                    title="Voice Search"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={iconSize}>
                                        <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                                        <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                                    </svg>
                                </button>
                            )}

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
                    {Object.values(t('quickLinks', { returnObjects: true })).map((item) => (
                        <button key={item}
                            onClick={() => setQuery(item)}
                            className={`rounded-full bg-white/40 hover:bg-white/70 border border-white/50 text-stone-700 font-medium transition-all backdrop-blur-sm shadow-sm hover:shadow-md ${isSeniorMode ? 'px-8 py-4 text-xl' : 'px-5 py-2 text-sm'}`}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
