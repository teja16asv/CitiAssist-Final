import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const LoginModal = ({ isOpen, onClose, isSeniorMode }) => {
    const { loginWithGoogle, saveManualProfile } = useAuth();
    const { t } = useTranslation();

    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [emergencyContact, setEmergencyContact] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('choose'); // 'choose', 'manual', 'verify'
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleGoogleLogin = async () => {
        try {
            setError('');
            setLoading(true);
            await loginWithGoogle();
            onClose(); // Close modal on success
        } catch (err) {
            setError('Failed to log in with Google.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!name.trim() || name.length < 2) {
            return setError('Please enter a valid name.');
        }
        if (!phoneNumber || phoneNumber.length < 10) {
            return setError('Please enter a valid phone number.');
        }

        // Transition to verification step instead of saving
        setStep('verify');
    };

    const handleVerifySubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (otp.length < 4) {
            return setError('Please enter a 4-digit OTP.');
        }

        setLoading(true);

        try {
            // Request Location Permission
            if (!('geolocation' in navigator)) {
                throw new Error("Geolocation is not supported by your browser");
            }

            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 10000,
                    maximumAge: 0
                });
            });

            const locationData = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            // Save to Local Storage via Context
            saveManualProfile(name, phoneNumber, emergencyContact, locationData);
            onClose(); // Close modal on success

        } catch (err) {
            console.warn("Location error:", err);
            // If they deny location, we can either block them or save without it.
            // For a civic app, it's best to explain why we need it.
            if (err.code === 1) { // PERMISSION_DENIED
                setError("Location access was denied. We need your location to accurately report civic issues to your local ward.");
            } else {
                setError("Unable to retrieve location. Please check your device settings.");
            }
        } finally {
            setLoading(false);
        }
    };

    // UI styling based on Senior Mode
    const bgClasses = 'bg-white rounded-3xl shadow-2xl p-6 md:p-8 w-full max-w-md relative animate-fade-in-up';
    const textTitle = isSeniorMode ? 'text-3xl font-bold mb-6' : 'text-2xl font-bold mb-4';
    const textInput = isSeniorMode ? 'text-xl p-4' : 'text-base p-3';
    const btnClass = isSeniorMode ? 'text-xl py-4' : 'text-base py-3';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm px-4">
            <div className={bgClasses}>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-800 rounded-full hover:bg-stone-100 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className={`${textTitle} text-stone-800 text-center`}>
                    Verify Your Identity
                </h2>
                <p className="text-stone-500 text-center mb-6">
                    To report a civic issue, authorities require a verified profile and location.
                </p>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center border border-red-200">
                        {error}
                    </div>
                )}

                {step === 'choose' ? (
                    <>
                        {/* Google Sign In Button */}
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className={`w-full flex items-center justify-center gap-3 bg-white border border-stone-300 text-stone-700 rounded-xl hover:bg-stone-50 transition-colors mb-6 shadow-sm ${btnClass}`}
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span className="font-medium">Continue with Google</span>
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex-1 h-px bg-stone-200"></div>
                            <span className="text-stone-400 text-sm font-medium">OR</span>
                            <div className="flex-1 h-px bg-stone-200"></div>
                        </div>

                        <button
                            onClick={() => setStep('manual')}
                            className={`w-full bg-stone-800 text-white font-medium rounded-xl hover:bg-stone-700 transition-colors shadow-md ${btnClass}`}
                        >
                            Setup Manual Profile
                        </button>
                    </>
                ) : step === 'manual' ? (
                    <form onSubmit={handleManualSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-600 mb-1">Full Name</label>
                            <input
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={`w-full rounded-xl border border-stone-300 focus:ring-2 focus:ring-stone-400 focus:outline-none ${textInput}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-600 mb-1">Phone Number</label>
                            <input
                                type="tel"
                                placeholder="1234567890"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className={`w-full rounded-xl border border-stone-300 focus:ring-2 focus:ring-stone-400 focus:outline-none ${textInput}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-600 mb-1">Emergency Contact (Optional, for SOS)</label>
                            <input
                                type="tel"
                                placeholder="Family Member's Number"
                                value={emergencyContact}
                                onChange={(e) => setEmergencyContact(e.target.value)}
                                className={`w-full rounded-xl border border-stone-300 focus:ring-2 focus:ring-red-400 focus:outline-none ${textInput}`}
                            />
                        </div>

                        <div className="bg-blue-50 text-blue-800 p-3 rounded-xl flex gap-3 items-start border border-blue-100 text-sm mt-4">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <p>We will ask for your current location on the next step to accurately route your civic reports.</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-stone-800 text-white font-medium rounded-xl hover:bg-stone-700 transition-colors shadow-md disabled:opacity-50 mt-6 ${btnClass}`}
                        >
                            Continue
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep('choose')}
                            className="w-full text-stone-500 hover:text-stone-700 text-sm font-medium py-2"
                        >
                            Back to Options
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifySubmit} className="space-y-4 animate-fade-in">
                        <div className="bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-200 text-sm mb-4 text-center">
                            For this review session, you can enter ANY 4-digit code (e.g. 1234).
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-600 mb-1 text-center">
                                Enter OTP sent to +91 {phoneNumber}
                            </label>
                            <input
                                type="text"
                                maxLength={4}
                                placeholder="1234"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                className={`w-full rounded-xl border border-stone-300 focus:ring-2 focus:ring-stone-400 focus:outline-none text-center font-mono tracking-widest ${textInput}`}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-50 mt-6 ${btnClass}`}
                        >
                            {loading ? 'Verifying & Saving...' : 'Verify & Complete Profile'}
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep('manual')}
                            className="w-full text-stone-500 hover:text-stone-700 text-sm font-medium py-2"
                        >
                            Back
                        </button>
                    </form>
                )}

            </div>
        </div>
    );
};

export default LoginModal;
