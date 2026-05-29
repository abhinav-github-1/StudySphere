import React from 'react';
import Navbar from '../components/Navbar';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-primary-500/30 selection:text-white">
      {/* Premium background layout grids and blur blobs */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary-600/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-accent-violet/5 rounded-full blur-[120px]"></div>
      </div>

      {/* Header Navigation */}
      <Navbar />

      {/* Main Content Body */}
      <main className="flex-grow w-full relative z-10">
        {children}
      </main>
    </div>
  );
}
