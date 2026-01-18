import React from 'react';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <div className="min-h-screen flex flex-col font-sans text-civic-text w-full">
      <Header />
      <main className="flex-grow flex flex-col">
        <LandingPage />
      </main>

      <footer className="py-6 text-center text-sm text-stone-500/80">
        &copy; {new Date().getFullYear()} CitiAssist. All rights reserved.
      </footer>
    </div>
  );
}

export default App;
