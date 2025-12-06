
import React, { useState, useEffect } from 'react';
import { Button } from './Button';

interface AuthScreenProps {
  onLogin: (username: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [customLogo, setCustomLogo] = useState<string | null>(null);

  useEffect(() => {
    const savedLogo = localStorage.getItem('RUGBY_TRACKER_LOGO');
    if (savedLogo) {
      setCustomLogo(savedLogo);
    }
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCustomLogo(result);
        localStorage.setItem('RUGBY_TRACKER_LOGO', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    const usersStr = localStorage.getItem('RUGBY_TRACKER_USERS');
    const users = usersStr ? JSON.parse(usersStr) : {};

    if (isLogin) {
      if (users[username] === password) {
        onLogin(username);
      } else {
        setError('Invalid username or password.');
      }
    } else {
      if (users[username]) {
        setError('Username already exists. Please try another.');
        return;
      }
      users[username] = password;
      localStorage.setItem('RUGBY_TRACKER_USERS', JSON.stringify(users));
      onLogin(username);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setUsername('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row font-sans selection:bg-red-500/30">
      {/* Left Panel: Branding (Apple-inspired Dark Mode) */}
      <div className="lg:w-5/12 bg-slate-950 relative overflow-hidden flex flex-col justify-between p-12 lg:p-16 text-white">
        
        {/* Soft Red Gradient Mesh */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-red-900/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none mix-blend-screen"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

        {/* Content Layer */}
        <div className="relative z-10 flex flex-col h-full justify-between">
          
          {/* Top Brand Label & Logo Input */}
          <div className="flex flex-col items-start space-y-6">
             {/* Logo Upload Area */}
             <div className="relative group cursor-pointer">
               <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoUpload} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  title="Click to upload your team logo"
               />
               
               {customLogo ? (
                 <div className="relative">
                    <img 
                      src={customLogo} 
                      alt="Club Logo" 
                      className="w-20 h-20 object-contain drop-shadow-2xl transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                 </div>
               ) : (
                 <div className="w-20 h-20 border-2 border-dashed border-slate-700 bg-slate-900/50 rounded-xl flex flex-col items-center justify-center text-slate-500 group-hover:border-red-500 group-hover:text-red-400 transition-colors">
                    <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[9px] uppercase font-bold tracking-wider">Logo</span>
                 </div>
               )}
             </div>

             <div className="h-px w-12 bg-red-600/50"></div>

             <span className="text-sm font-medium tracking-[0.2em] uppercase text-slate-400">
               Ince Rose Bridge Sports & Community Club
             </span>
          </div>

          {/* Main Typography */}
          <div className="mb-12">
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter text-white mb-6 leading-[1.05]">
              Rugby League<br/>
              Stat Tracker.
            </h1>
            <p className="text-lg lg:text-xl text-slate-400 font-light max-w-md leading-relaxed border-l-2 border-slate-800 pl-6">
              Empowering the game at every level. Professional-grade analysis for grassroots teams, from juniors to open age.
            </p>
          </div>

          {/* Footer Metadata */}
          <div className="flex items-center space-x-3 text-slate-600 text-xs font-semibold tracking-wide uppercase">
             <span className="text-red-500">Club Edition</span>
             <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
             <span>v2.5.0</span>
          </div>
        </div>
      </div>

      {/* Right Panel: Form (Clean Minimalist) */}
      <div className="lg:w-7/12 bg-white flex items-center justify-center p-8 lg:p-24">
        <div className="w-full max-w-md space-y-10">
          
          <div className="text-center lg:text-left">
            <h2 className="text-4xl font-bold text-slate-900 tracking-tight">
              {isLogin ? 'Welcome back' : 'Join the club'}
            </h2>
            <p className="mt-3 text-lg text-slate-500 font-light">
              {isLogin 
                ? 'Enter your credentials to access the statistics dashboard.' 
                : 'Create a coach profile to start tracking your team.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 mt-8">
            <div className="space-y-5">
              <div>
                <label htmlFor="username" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-lg text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  placeholder="e.g. coach_smith"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-lg text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 p-4 flex items-center animate-pulse">
                <svg className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm text-red-700 font-medium">{error}</span>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full py-4 bg-[#E02020] hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all hover:shadow-red-500/30 transform active:scale-[0.99] text-base"
            >
              {isLogin ? 'Sign In' : 'Create Profile'}
            </Button>
          </form>

          <div className="pt-2 text-center border-t border-gray-100">
            <p className="text-sm text-slate-500 mt-6">
              {isLogin ? "New to the platform?" : "Already have an account?"}
              <button
                onClick={toggleMode}
                className="ml-2 font-bold text-slate-900 hover:text-red-600 transition-colors"
              >
                {isLogin ? 'Create profile' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
