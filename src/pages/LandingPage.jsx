import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';

const LandingPage = () => {
    const { t, i18n } = useTranslation();
    const [query, setQuery] = useState('');
    const [chatResponse, setChatResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [browserSupportsSpeech, setBrowserSupportsSpeech] = useState(false);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            setBrowserSupportsSpeech(true);
        }
    }, []);

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

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setChatResponse('');

        try {
            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: query }),
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

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 w-full">
            <div className="w-full max-w-3xl text-center space-y-8 animate-fade-in-up">
                <h2 className="text-4xl md:text-5xl font-bold text-stone-800 tracking-tight">
                    {t('heroTitle')}
                </h2>

                <form onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto">
                    <div className="relative group">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={isListening ? t('listening') : t('searchPlaceholder')}
                            className={`w-full h-16 pl-6 pr-24 rounded-3xl border-0 shadow-lg shadow-stone-300/40 focus:ring-2 focus:ring-stone-400 focus:shadow-xl bg-white/80 backdrop-blur-sm text-lg placeholder:text-stone-400 text-stone-800 transition-all duration-300 outline-none ${isListening ? 'ring-2 ring-red-400 animate-pulse' : ''}`}
                        />

                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                            {browserSupportsSpeech && (
                                <button
                                    type="button"
                                    onClick={startListening}
                                    className={`p-3 rounded-full transition-transform active:scale-95 flex items-center justify-center ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-transparent text-stone-500 hover:bg-stone-100'}`}
                                    aria-label="Voice Search"
                                    title="Voice Search"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                                        <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                                    </svg>
                                </button>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="p-3 bg-stone-800 text-white rounded-full hover:bg-stone-700 transition-transform active:scale-95 shadow-md flex items-center justify-center disabled:opacity-50"
                                aria-label="Search"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </form>

                {chatResponse && (
                    <div className="w-full max-w-2xl mx-auto mt-6 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-xl text-left animate-fade-in border border-white/50">
                        <div className="prose prose-stone max-w-none prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800">
                            <ReactMarkdown>{chatResponse}</ReactMarkdown>
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap justify-center gap-4 pt-4">
                    {Object.values(t('quickLinks', { returnObjects: true })).map((item) => (
                        <button key={item}
                            onClick={() => setQuery(item)}
                            className="px-5 py-2 rounded-full bg-white/40 hover:bg-white/70 border border-white/50 text-stone-700 text-sm font-medium transition-all backdrop-blur-sm shadow-sm hover:shadow-md"
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
