import React, { useEffect, useState } from 'react';
import Logo from './Logo';

const SplashScreen = () => {
    const [phase, setPhase] = useState('enter'); // enter, hold, exit

    useEffect(() => {
        // Phase 1: Enter (0ms - 800ms)

        // Phase 2: Hold/Pulse (800ms - 2000ms)
        const holdTimer = setTimeout(() => {
            setPhase('exit');
        }, 2200);

        return () => clearTimeout(holdTimer);
    }, []);

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden transition-all duration-700 ease-in-out
            ${phase === 'exit' ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'}
            bg-gradient-to-br from-stone-100 via-white to-stone-200
        `}>
            {/* Background Rings Animation */}
            <div className={`absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none`}>
                <div className={`absolute border-2 border-stone-300 rounded-full w-[100vw] h-[100vw] animate-[ping_3s_ease-out_infinite]`} style={{ animationDelay: '0s' }}></div>
                <div className={`absolute border-2 border-stone-300 rounded-full w-[80vw] h-[80vw] animate-[ping_3s_ease-out_infinite]`} style={{ animationDelay: '0.4s' }}></div>
                <div className={`absolute border-2 border-stone-300 rounded-full w-[60vw] h-[60vw] animate-[ping_3s_ease-out_infinite]`} style={{ animationDelay: '0.8s' }}></div>
            </div>

            <div className={`relative flex flex-col items-center z-10 transform transition-all duration-1000 cubic-bezier(0.34, 1.56, 0.64, 1)
                ${phase === 'enter' ? 'translate-y-0 opacity-100 blur-0' : ''}
                ${phase === 'exit' ? '-translate-y-10 opacity-0 blur-sm' : ''}
            `}>
                {/* Logo Icon */}
                <div className="mb-6 relative">
                    <div className="w-24 h-24 rounded-2xl rotate-3 shadow-2xl flex items-center justify-center animate-[bounce_2s_infinite]">
                        <Logo className="w-full h-full drop-shadow-2xl" />
                    </div>
                    <div className="absolute -inset-4 bg-stone-400/20 blur-xl rounded-full -z-10 animate-pulse"></div>
                </div>

                {/* Text */}
                <h1 className="text-5xl md:text-8xl font-black text-stone-800 tracking-tighter drop-shadow-sm">
                    Citi<span className="text-transparent bg-clip-text bg-gradient-to-r from-stone-600 to-stone-400">Assist</span>
                </h1>

                <div className="mt-4 flex items-center gap-3">
                    <div className="h-[1px] w-8 md:w-16 bg-stone-400"></div>
                    <p className="text-sm md:text-lg font-medium text-stone-500 uppercase tracking-[0.2em] md:tracking-[0.3em] whitespace-nowrap">Smart City Companion</p>
                    <div className="h-[1px] w-8 md:w-16 bg-stone-400"></div>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
