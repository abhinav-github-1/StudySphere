import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-accent-violet/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 flex-grow flex flex-col justify-center relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-900/80 border border-slate-800 text-xs text-accent-indigo mb-8 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-accent-indigo"></span>
            Collaborate, Focus & Learn Together In Realtime
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            The Ultimate Virtual
            <span className="block mt-2 bg-gradient-to-r from-primary-500 via-accent-indigo to-accent-violet bg-clip-text text-transparent animate-glow">
              Collaborative Study Space
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Boost your productivity with global peers. Create customizable study rooms, share live chat, track sessions with focused timers, and unlock immersive shared workspaces.
          </p>

          {/* Interactive CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary-600 to-accent-indigo hover:from-primary-700 hover:to-accent-violet text-white font-semibold rounded-2xl shadow-lg shadow-primary-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              Get Started for Free
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-4 glass-card hover:bg-dark-800/85 text-white font-semibold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border border-slate-700/50"
            >
              Explore Study Rooms
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Card 1 */}
          <div className="glass-card p-8 hover:border-primary-500/50 transition-all duration-300 group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-primary-600/10 border border-primary-500/30 flex items-center justify-center text-primary-500 mb-6 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Realtime Study Rooms</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Create public or private rooms to learn with peers. See live participant updates and collaborate dynamically.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card p-8 hover:border-accent-violet/50 transition-all duration-300 group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-accent-violet/10 border border-accent-violet/30 flex items-center justify-center text-accent-violet mb-6 group-hover:bg-accent-violet group-hover:text-white transition-all duration-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Instant Chat & Sharing</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Chat instantly inside study rooms. Exchange notes, code blocks, web links, and keep resources beautifully organized.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card p-8 hover:border-accent-pink/50 transition-all duration-300 group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-accent-pink/10 border border-accent-pink/30 flex items-center justify-center text-accent-pink mb-6 group-hover:bg-accent-pink group-hover:text-white transition-all duration-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Smart Focused Timers</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Configure Pomodoro or standard stopwatch session timers. Track aggregate metrics and logs in your personal dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <footer className="py-6 border-t border-slate-900 bg-dark-950/40 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} StudySphere. Crafted with style, performance, and collaboration in mind.
      </footer>
    </div>
  );
}
