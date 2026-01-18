import React, { useState } from 'react';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';

function App() {
  const [isSeniorMode, setIsSeniorMode] = useState(false);

  return (
    <div className={`min-h-screen flex flex-col font-sans text-civic-text w-full transition-all duration-300 ${isSeniorMode ? 'text-xl' : ''}`}>
      <Header isSeniorMode={isSeniorMode} toggleSeniorMode={() => setIsSeniorMode(!isSeniorMode)} />
      <main className="flex-grow flex flex-col">
        <LandingPage isSeniorMode={isSeniorMode} />
      </main>

      <footer className="py-6 text-center text-sm text-stone-500/80">
        &copy; {new Date().getFullYear()} CitiAssist. All rights reserved.
      </footer>
    </div>
  );
}

export default App;
