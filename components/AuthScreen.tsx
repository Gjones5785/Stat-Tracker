import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthScreenProps {
  onLogin: (user: any) => void;
}

type AuthMode = 'signin' | 'signup' | 'reset';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [defaultLogoFailed, setDefaultLogoFailed] = useState(false);
  const [clubName, setClubName] = useState('');

  useEffect(() => {
    const savedLogo = localStorage.getItem('RUGBY_TRACKER_LOGO');
    if (savedLogo) setCustomLogo(savedLogo);
    const savedClubName = localStorage.getItem('RUGBY_TRACKER_CLUB_NAME');
    if (savedClubName) setClubName(savedClubName);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (authMode === 'reset') {
        if (!email.trim()) throw new Error('Please enter your email address.');
        await sendPasswordResetEmail(auth, email);
        setSuccessMessage('Password reset link sent! Please check your email inbox.');
        setLoading(false);
        return;
      }

      if (!email.trim() || !password.trim()) throw new Error('Please enter both email and password.');

      let userCredential;
      if (authMode === 'signin') {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (!username.trim()) throw new Error('Please enter a username.');
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (userCredential.user) {
          await updateProfile(userCredential.user, { displayName: username });
          await setDoc(doc(db, 'users', userCredential.user.uid), {
             username: username,
             clubName: clubName,
             logo: customLogo
          }, { merge: true });
        }
      }
    } catch (err: any) {
      let msg = 'Authentication failed.';
      if (err.message.includes('Please enter')) msg = err.message;
      else if (authMode === 'reset' && (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email')) msg = 'No account found with this email address.';
      else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') msg = 'Invalid email or password. Please check your credentials.';
      else if (err.code === 'auth/email-already-in-use') msg = 'Email already registered. Try signing in.';
      else if (err.code === 'auth/weak-password') msg = 'Password should be at least 6 characters.';
      else if (err.code === 'auth/invalid-email') msg = 'Invalid email address format.';
      else if (err.code === 'auth/too-many-requests') msg = 'Too many failed attempts. Please try again later.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const activeLogoSrc = customLogo || 'logo.png';
  const showImage = !!customLogo || !defaultLogoFailed;

  let title = 'Welcome back';
  let subtitle = 'Enter your credentials to access the statistics dashboard.';
  let buttonText = 'Sign In';

  if (authMode === 'signup') {
    title = 'Create profile';
    subtitle = 'Join the platform to start tracking your team.';
    buttonText = 'Create Profile';
  } else if (authMode === 'reset') {
    title = 'Reset Password';
    subtitle = 'Enter your email to receive a password reset link.';
    buttonText = 'Send Reset Link';
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row font-sans">
      <div className="lg:w-5/12 bg-[#0F0F10] relative overflow-hidden flex flex-col justify-between p-12 lg:p-16 text-white">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-[#1F1F22] via-[#0F0F10] to-[#0F0F10] opacity-80"></div>
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex flex-col items-start space-y-6">
             <div className="relative group cursor-pointer transition-transform duration-300 hover:scale-[1.02]">
               <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" title="Upload Club Logo"/>
               {showImage ? (
                 <div className="relative w-20 h-20 bg-[#1A1A1C] rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.05)] border border-white/10 flex items-center justify-center overflow-hidden">
                    <img src={activeLogoSrc} alt="Club Logo" className="w-full h-full object-contain p-2" onError={(e) => { if (!customLogo) { setDefaultLogoFailed(true); e.currentTarget.style.display = 'none'; }}}/>
                 </div>
               ) : (
                 <div className="w-20 h-20 bg-[#1A1A1C] rounded-2xl border border-white/5 flex flex-col items-center justify-center text-white/50 group-hover:text-white transition-all duration-300">
                    <svg className="w-6 h-6 mb-1 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-[9px] font-medium tracking-widest uppercase">UPLOAD</span>
                 </div>
               )}
             </div>
             <div className="flex flex-col w-full">
               <input type="text" value={clubName} onChange={handleClubNameChange} placeholder="ENTER TEAM NAME" className="bg-transparent border-none p-0 text-sm font-heading font-medium tracking-[0.2em] uppercase text-white/40 placeholder:text-white/20 focus:text-white focus:outline-none focus:ring-0 transition-colors w-full cursor-text hover:text-white/60" aria-label="Club Name"/>
             </div>
          </div>
          <div className="mb-12">
            <h1 className="text-6xl lg:text-7xl font-heading font-bold tracking-tighter text-white mb-6 leading-none">
              LeagueLens<span className="text-red-600">.</span>
            </h1>
            <p className="text-lg text-white/40 font-light max-w-sm leading-relaxed">
              Empowering the game at every level. Professional-grade analysis for grassroots teams, from juniors to open age.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-white/20 text-[10px] font-heading font-bold tracking-[0.2em] uppercase">
             <span>Club Edition</span>
             <span className="w-1 h-1 bg-white/20 rounded-full"></span>
             <span>v2.5.0</span>
          </div>
        </div>
      </div>
      <div className="lg:w-7/12 bg-[#F5F5F7] flex items-center justify-center p-8 lg:p-24 relative">
        <div className="w-full max-w-md">
          <div className="mb-12">
            <h2 className="text-4xl font-heading font-bold text-slate-900 tracking-tight mb-2">{title}</h2>
            <p className="text-base text-slate-500 font-medium">{subtitle}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              {authMode === 'signup' && (
                <div>
                  <label htmlFor="username" className="block text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-2.5 ml-1">Username</label>
                  <input id="username" name="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="block w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-slate-900 font-medium placeholder-gray-300 shadow-sm focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all" placeholder="Coach Smith"/>
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-xs font-heading font-bold uppercase tracking-widest text-slate-400 mb-2.5 ml-1">Email Address</label>
                <input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-slate-900 font-medium placeholder-gray-300 shadow-sm focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all" placeholder="coach@club.com"/>
              </div>
              {authMode !== 'reset' && (
                <div>
                  <div className="flex justify-between items-center mb-2.5 ml-1">
                    <label htmlFor="password" className="block text-xs font-heading font-bold uppercase tracking-widest text-slate-400">Password</label>
                    {authMode === 'signin' && (
                      <button type="button" onClick={() => { setAuthMode('reset'); setError(''); setSuccessMessage(''); }} className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors">Forgot Password?</button>
                    )}
                  </div>
                  <input id="password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-slate-900 font-medium placeholder-gray-300 shadow-sm focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all" placeholder="••••••••"/>
                </div>
              )}
            </div>
            {error && (
              <div className="rounded-xl bg-red-50 p-4 text-center border border-red-100 animate-in fade-in slide-in-from-top-2">
                <span className="text-sm text-red-600 font-medium">{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="rounded-xl bg-green-50 p-4 text-center border border-green-100 animate-in fade-in slide-in-from-top-2">
                <span className="text-sm text-green-700 font-medium">{successMessage}</span>
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full py-4 bg-[#E02020] hover:bg-red-700 text-white font-heading font-bold rounded-2xl shadow-[0_10px_30px_rgba(224,32,32,0.2)] hover:shadow-[0_15px_35px_rgba(224,32,32,0.3)] transition-all transform active:scale-[0.99] text-lg tracking-wide mt-4 disabled:opacity-70">
              {loading ? 'Processing...' : buttonText}
            </Button>
          </form>
          <div className="mt-10 text-center">
            {authMode === 'signin' && (
              <p className="text-sm text-slate-400 font-medium">New to the platform? <button type="button" onClick={() => { setAuthMode('signup'); setError(''); setSuccessMessage(''); }} className="ml-2 font-bold text-slate-900 hover:text-red-600 transition-colors">Create profile</button></p>
            )}
            {authMode === 'signup' && (
              <p className="text-sm text-slate-400 font-medium">Already have an account? <button type="button" onClick={() => { setAuthMode('signin'); setError(''); setSuccessMessage(''); }} className="ml-2 font-bold text-slate-900 hover:text-red-600 transition-colors">Sign in</button></p>
            )}
            {authMode === 'reset' && (
              <button type="button" onClick={() => { setAuthMode('signin'); setError(''); setSuccessMessage(''); }} className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">← Back to Sign In</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
