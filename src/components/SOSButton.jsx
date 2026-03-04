import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const SOSButton = ({ isSeniorMode }) => {
    const { currentUser } = useAuth();

    // States
    const [isHolding, setIsHolding] = useState(false);
    const [holdProgress, setHoldProgress] = useState(0);
    const [isCountingDown, setIsCountingDown] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [isLocating, setIsLocating] = useState(false);
    const [voiceListening, setVoiceListening] = useState(false);

    // Refs for timers
    const holdTimerRef = useRef(null);
    const countdownTimerRef = useRef(null);
    const recognitionRef = useRef(null);
    const sequenceActiveRef = useRef(false);

    // --- Voice Recognition Setup ---
    useEffect(() => {
        // We now want it active for everyone, but we might want to ensure it only runs 
        // if they have an emergency contact configured, or just run it generally.
        // For safety, we just run it generally.
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            // Native speech recognition may need a specific language, but setting it to '' 
            // sometimes helps it recognize multiple if the OS supports it. 
            // We'll stick to a primary or just let it auto-detect if possible.
            // i18next could be used here, but for safety, we'll listen generally.
            recognition.lang = 'en-IN';

            recognition.onresult = (event) => {
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript.toLowerCase().trim();
                    // Check for our SOS keywords
                    if (
                        transcript.includes('help') ||
                        transcript.includes('సహాయం') ||
                        transcript.includes('sahayam') ||
                        transcript.includes('मदद') ||
                        transcript.includes('madad')
                    ) {
                        console.log("SOS Voice Trigger Detected:", transcript);
                        triggerSOSSequence();
                    }
                }
            };

            // Restart it to maintain continuous listening
            recognition.onend = () => {
                if (!isCountingDown) {
                    try {
                        recognition.start();
                    } catch (e) {
                        console.warn("Speech recognition restart error", e);
                    }
                }
            };

            recognition.onerror = (event) => {
                console.warn("Speech recognition error", event.error);
            };

            recognitionRef.current = recognition;

            try {
                recognition.start();
                setVoiceListening(true);
            } catch (e) {
                console.error("Failed to start voice recognition", e);
            }
        }

        return () => {
            stopVoiceRecognition();
        };
    }, [isCountingDown]);

    const stopVoiceRecognition = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setVoiceListening(false);
        }
    };


    // --- Physical Hold-to-Trigger Logic ---
    const holdDurationMs = 2000;
    const intervalMs = 50;

    const handlePointerDown = (e) => {
        // Prevent default touch features like text selection
        if (e) e.preventDefault();
        if (isCountingDown) return;

        setIsHolding(true);
        setHoldProgress(0);

        let elapsed = 0;
        holdTimerRef.current = setInterval(() => {
            elapsed += intervalMs;
            setHoldProgress(Math.min((elapsed / holdDurationMs) * 100, 100));

            if (elapsed >= holdDurationMs) {
                clearInterval(holdTimerRef.current);
                triggerSOSSequence();
            }
        }, intervalMs);
    };

    const handlePointerUp = () => {
        if (!isCountingDown) {
            setIsHolding(false);
            setHoldProgress(0);
            if (holdTimerRef.current) clearInterval(holdTimerRef.current);
        }
    };

    // --- Sequence Handlers ---
    const triggerSOSSequence = () => {
        // Prevent multiple simultaneous triggers from rapid voice API events
        if (sequenceActiveRef.current) return;
        sequenceActiveRef.current = true;

        // Stop holding logic
        setIsHolding(false);
        setHoldProgress(0);
        if (holdTimerRef.current) clearInterval(holdTimerRef.current);

        // Pause voice listening during countdown so it doesn't trigger again
        stopVoiceRecognition();

        // Start countdown
        setIsCountingDown(true);
        setCountdown(5);

        countdownTimerRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownTimerRef.current);
                    countdownTimerRef.current = null;
                    executeEmergencyDispatch();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const cancelSOSSequence = () => {
        sequenceActiveRef.current = false;
        setIsCountingDown(false);
        if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
        }
        setCountdown(5);

        // Restart voice listening
        if (recognitionRef.current) {
            try {
                recognitionRef.current.start();
            } catch (e) { }
        }
    };

    const executeEmergencyDispatch = async () => {
        setIsCountingDown(false);
        setIsLocating(true);

        const contactNumber = currentUser?.emergencyContact || "911"; // Fallback if not configured
        const userName = currentUser?.displayName || "A CitiAssist User";

        try {
            // Get precise location
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });

            const { latitude, longitude } = position.coords;
            const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

            // Construct WhatsApp Message
            const message = `🚨 EMERGENCY SOS 🚨\n\nThis is an automated alert. ${userName} has triggered an SOS and needs immediate assistance.\n\n📍 Live Location:\n${mapsLink}\n\nPlease contact them immediately.`;

            // Format phone number (remove spaces, etc). Ensure country code.
            let cleanPhone = contactNumber.replace(/\D/g, '');
            // Simple assumption: if Indian number and missing 91, add it.
            if (cleanPhone.length === 10) {
                cleanPhone = `91${cleanPhone}`;
            }

            const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

            // Open WhatsApp in a new tab
            window.open(waUrl, '_blank');

        } catch (error) {
            console.error("SOS Location Failed:", error);
            alert("Location access denied or failed. Unable to append location to SOS message.");

            // Still try to send message without location
            const message = `🚨 EMERGENCY SOS 🚨\n\nThis is an automated alert. ${userName} has triggered an SOS and needs immediate assistance.\n\n(Location data was unavailable).`;
            let cleanPhone = contactNumber.replace(/\D/g, '');
            if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;
            window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
        } finally {
            setIsLocating(false);
            // Allow the sequence to be triggered again in the future
            sequenceActiveRef.current = false;
        }
    };

    // Auto-cleanup intervals
    useEffect(() => {
        return () => {
            if (holdTimerRef.current) clearInterval(holdTimerRef.current);
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        };
    }, []);

    // Only render if a user is logged in
    if (!currentUser) return null;

    return (
        <>
            {/* The Floating SOS Button */}
            <div className="fixed bottom-6 right-6 z-40 animate-fade-in-up">
                <button
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    className={`relative flex items-center justify-center w-20 h-20 rounded-full shadow-2xl overflow-hidden transition-transform ${isHolding ? 'scale-95' : 'hover:scale-105'} ${isLocating ? 'bg-amber-500' : 'bg-red-600'}`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    aria-label="Emergency SOS Button"
                >
                    {/* The shrinking/filling circle for Hold effect */}
                    <div
                        className="absolute bottom-0 left-0 w-full bg-red-800 opacity-50 z-0 transition-all duration-75"
                        style={{ height: `${holdProgress}%` }}
                    />

                    {/* Content */}
                    <div className="z-10 flex flex-col items-center justify-center">
                        {isLocating ? (
                            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <>
                                <span className="text-white font-black text-2xl tracking-wider">SOS</span>
                                <span className={`text-white/80 font-bold text-[10px] mt-1 uppercase ${isHolding ? 'opacity-100' : 'opacity-0'} transition-opacity`}>Hold</span>
                            </>
                        )}
                    </div>
                </button>
            </div>

            {/* The Abort Countdown Modal */}
            {isCountingDown && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/90 backdrop-blur-md px-4 animate-fade-in">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl mt-[-10vh]">

                        <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <h2 className="text-3xl font-black text-stone-900 mb-2">SENDING SOS IN</h2>
                        <div className="text-8xl font-black text-red-600 mb-6 drop-shadow-md">
                            {countdown}
                        </div>

                        <p className="text-stone-600 text-lg mb-8 font-medium">
                            Sharing live location with<br />
                            <span className="font-bold text-stone-900">{currentUser?.emergencyContact || "Emergency Contact"}</span>
                        </p>

                        <button
                            onClick={cancelSOSSequence}
                            className="w-full bg-stone-900 hover:bg-stone-800 text-white font-black text-2xl py-6 rounded-2xl shadow-xl transform transition-transform active:scale-95"
                        >
                            CANCEL ALARM
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default SOSButton;
