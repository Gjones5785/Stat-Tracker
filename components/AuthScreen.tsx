
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
  const [defaultLogoFailed, setDefaultLogoFailed] = useState(false);
  const [clubName, setClubName] = useState('');

  useEffect(() => {
    const savedLogo = localStorage.getItem('RUGBY_TRACKER_LOGO');
    if (savedLogo) {
      setCustomLogo(savedLogo);
    }
    const savedClubName = localStorage.getItem('RUGBY_TRACKER_CLUB_NAME');
    if (savedClubName) {
      setClubName(savedClubName);
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
        setDefaultLogoFailed(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClubNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setClubName(val);
    localStorage.setItem('RUGBY_TRACKER_CLUB_NAME', val);
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

  const activeLogoSrc = customLogo || 'logo.png';
  const showImage = !!customLogo || !defaultLogoFailed;

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row font-sans">
      {/* Left Panel: LeagueLens Dark Mode */}
      <div className="lg:w-5/12 bg-[#0F0F10] relative overflow-hidden flex flex-col justify-between p-12 lg:p-16 text-white">
        
        {/* Subtle Radial Gradient */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-[#1F1F22] via-[#0F0F10] to-[#0F0F10] opacity-80"></div>

        {/* Content Layer */}
        <div className="relative z-10 flex flex-col h-full justify-between">
          
          {/* Top: Logo & Upload */}
          <div className="flex flex-col items-start space-y-6">
             {/* Logo Upload Button - Dark Rounded Square with Glow */}
             <div className="relative group cursor-pointer transition-transform duration-300 hover:scale-[1.02]">
               <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoUpload} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  title="Upload Club Logo"
               />
               
               {showImage ? (
                 <div className="relative w-20 h-20 bg-[#1A1A1C] rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.05)] border border-white/10 flex items-center justify-center overflow-hidden">
                    <img 
                      src={activeLogoSrc} 
                      alt="Club Logo" 
                      className="w-full h-full object-contain p-2"
                      onError={(e) => {
                        if (!customLogo) {
                          setDefaultLogoFailed(true);
                          e.currentTarget.style.display = 'none';
                        }
                      }}
                    />
                 </div>
               ) : (
                 <div className="w-20 h-20 bg-[#1A1A1C] rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.03)] border border-white/5 flex flex-col items-center justify-center text-white/50 group-hover:text-white group-hover:border-white/20 transition-all duration-300">
                    {/* Landscape Icon */}
                    <svg className="w-6 h-6 mb-1 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[9px] font-medium tracking-widest uppercase">UPLOAD</span>
                 </div>
               )}
             </div>

             <div className="flex flex-col w-full">
               <input 
                 type="text"
                 value={clubName}
                 onChange={handleClubNameChange}
                 placeholder="ENTER TEAM NAME"
                 className="bg-transparent border-none p-0 text-sm font-heading font-medium tracking-[0.2em] uppercase text-white/40 placeholder:text-white/20 focus:text-white focus:outline-none focus:ring-0 transition-colors w-full cursor-text hover:text-white/60"
                 aria-label="Club Name"
               />
             </div>
          </div>

          {/* Center: Main Title */}
          <div className="mb-12">
            <h1 className="text-6xl lg:text-7xl font-heading font-bold tracking-tighter text-white mb-6 leading-none">
              LeagueLens<span className="text-red-600">.</span>
            </h1>
            <p className="text-lg text-white/40 font-light max-w-sm leading-relaxed">
              Empowering the game at every level. Professional-grade analysis for grassroots teams, from juniors to open age.
            </p>
          </div>

          {/* Footer: Version */}
          <div className="flex items-center space-x-2 text-white/20 text-[10px] font-heading font-bold tracking-[0.2em] uppercase">
             <span>Club Edition</span>
             <span className="w-1 h-1 bg-white/20 rounded-full"></span>
             <span>v2.5.0</span>
          </div>
        </div>
      </div>

      {/* Right Panel: Clean Form */}
      <div className="lg:w-7/12 bg-[#F5F5F7] flex items-center justify-center p-8 lg:p-24 relative">
        <div className="w-full max-w-md">
          
          <div className="mb-12">
            <h2 className="text-4xl font-heading font-bold text-slate-900 tracking-tight mb-2">
              {isLogin ? 'Welcome back' : 'Create profile'}
            </h2>
            <p className="text-base text-slate-500 font-medium">
              {isLogin 
                ? 'Enter your credentials to access the statistics dashboard.' 
                : 'Join the platform to start tracking your team.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div>
                <label htmlFor="username" className="block text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-2.5 ml-1">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-slate-900 font-medium placeholder-gray-300 shadow-sm focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all"
                  placeholder="e.g. coach_smith"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-2.5 ml-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-slate-900 font-medium placeholder-gray-300 shadow-sm focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-4 text-center">
                <span className="text-sm text-red-600 font-medium">{error}</span>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full py-4 bg-[#E02020] hover:bg-red-700 text-white font-heading font-bold rounded-2xl shadow-[0_10px_30px_rgba(224,32,32,0.2)] hover:shadow-[0_15px_35px_rgba(224,32,32,0.3)] transition-all transform active:scale-[0.99] text-lg tracking-wide mt-4"
            >
              {isLogin ? 'Sign In' : 'Create Profile'}
            </Button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm text-slate-400 font-medium">
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
