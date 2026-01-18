import React from 'react';
import { useTranslation } from 'react-i18next';

const Header = () => {
    const { t, i18n } = useTranslation();

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
        <header className="flex justify-between items-center py-6 px-8 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-stone-800">
                    {t('appTitle')}
                </h1>
            </div>

            <div className="flex items-center">
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
            </div>
        </header>
    );
};

export default Header;
