import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 w-full p-8 z-50 flex justify-between items-start pointer-events-none mix-blend-difference">
      <div className="pointer-events-auto">
        <h1 className="text-gray-400 text-sm font-medium leading-relaxed font-mono tracking-wide">
          Everything I've built, written, and learned.
          <br />
          <span className="text-white font-bold">Archived in time.</span>
        </h1>
      </div>
      
      <div className="pointer-events-auto">
         <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-full p-2 transition-colors text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-volume-2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
         </button>
      </div>
    </header>
  );
};
