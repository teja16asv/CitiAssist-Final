import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';
import UserProfileModal from './UserProfileModal';

const Header = ({ isSeniorMode, toggleSeniorMode }) => {
    const { t, i18n } = useTranslation();
    const { currentUser, logout } = useAuth();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const cycleLanguage = () => {
        const langs = ['en', 'te', 'hi'];
        const current = langs.indexOf(i18n.resolvedLanguage);
        const next = (current + 1) % langs.length;
        i18n.changeLanguage(langs[next]);
    };

    const getLangLabel = () => {
        switch (i18n.resolvedLanguage) {
            case 'te': return 'TE';
            case 'hi': return 'HI';
            default: return 'EN';
        }
    };

    return (
        <header className="flex justify-between items-center py-4 px-4 md:py-6 md:px-8 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-3">
                <Logo className="w-8 h-8 md:w-10 md:h-10 shadow-sm rounded-xl" />
                <h1 className="text-2xl font-bold tracking-tight text-stone-800">
                    {t('appTitle')}
                </h1>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSeniorMode}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-bold transition-all rounded-full border border-stone-300 ${isSeniorMode ? 'bg-amber-400 text-stone-900 shadow-md scale-105' : 'bg-transparent text-stone-500 hover:bg-stone-100'}`}
                    title={isSeniorMode ? "Senior Mode ON" : "Enable Senior Mode"}
                >
                    {isSeniorMode ? (
                        <span className="flex items-center gap-1">👴 <span className="hidden sm:inline">Senior Mode ON</span></span>
                    ) : (
                        <span className="flex items-center gap-1">👓 <span className="hidden sm:inline">Senior Mode</span></span>
                    )}
                </button>

                <button
                    onClick={cycleLanguage}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors rounded-full hover:bg-white/50"
                    aria-label="Change Language"
                >
                    <span>{getLangLabel()}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S12 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S12 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m-15.686 0A8.959 8.959 0 013 12c0-.778.099-1.533.284-2.253m0 0A11.953 11.953 0 0112 10.5c2.998 0 5.74-1.1 7.843-2.918" />
                    </svg>
                </button>

                {/* Authentication UI */}
                {currentUser ? (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsProfileModalOpen(true)}
                            className="hover:ring-2 hover:ring-amber-400 rounded-full transition-all focus:outline-none"
                            title="View Profile"
                        >
                            {currentUser.photoURL ? (
                                <img src={currentUser.photoURL} alt="Profile" className="w-8 h-8 rounded-full shadow-sm border border-stone-200" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shadow-sm text-sm border border-emerald-600">
                                    {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                                </div>
                            )}
                        </button>
                        <button
                            onClick={logout}
                            className="text-xs text-stone-500 hover:text-stone-800 font-medium ml-1 hidden sm:inline"
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsLoginModalOpen(true)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-full text-white shadow-sm bg-stone-800 hover:bg-stone-700`}
                    >
                        Sign In
                    </button>
                )}
            </div>

            {/* Render Login Modal if triggered from Header manually */}
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                isSeniorMode={isSeniorMode}
            />

            {/* Render User Profile Modal */}
            <UserProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />

            {/* Profile Completion Alert Banner */}
            {currentUser && !currentUser.emergencyContact && (
                <div className="absolute top-[80px] md:top-[90px] left-0 w-full z-40 px-4 flex justify-center animate-fade-in-up">
                    <div className="bg-amber-100 border border-amber-300 text-amber-900 px-4 py-2 rounded-xl shadow-lg flex items-center gap-3 text-sm font-medium w-full max-w-4xl cursor-pointer hover:bg-amber-200 transition-colors" onClick={() => setIsProfileModalOpen(true)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="flex-grow">
                            ⚠️ Action Required: Add an Emergency Contact to enable SOS features.
                        </span>
                        <span className="hidden sm:inline bg-white px-3 py-1 text-amber-800 rounded-lg shadow-sm border border-amber-200 font-bold hover:bg-stone-50">
                            Complete Profile
                        </span>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
