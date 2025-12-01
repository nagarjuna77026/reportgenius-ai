

import React, { useState } from 'react';
import { authService } from '../services/authService';
import { User } from '../types';
import { Activity, Mail, Lock, User as UserIcon, ArrowRight, Github, Chrome, ShieldCheck, Eye, EyeOff, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [resetSent, setResetSent] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const calculateStrength = (pwd: string) => {
      let strength = 0;
      if (pwd.length > 7) strength += 1;
      if (/[A-Z]/.test(pwd)) strength += 1;
      if (/[0-9]/.test(pwd)) strength += 1;
      if (/[^A-Za-z0-9]/.test(pwd)) strength += 1;
      return strength;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setPassword(val);
      setPasswordStrength(calculateStrength(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
        setError("Please enter a valid email address.");
        return;
    }

    if (view === 'signup' && passwordStrength < 3) {
        setError("Password is too weak. Include numbers, symbols, and uppercase letters.");
        return;
    }

    setLoading(true);

    try {
      let session;
      if (view === 'login') {
        session = await authService.login(email, password);
      } else {
        if (!name) throw new Error('Name is required');
        session = await authService.signup(email, password, name);
      }
      onAuthSuccess(session.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      if (!validateEmail(email)) {
          setError("Please enter a valid email address.");
          return;
      }
      
      setLoading(true);
      // Simulate API call for password reset
      setTimeout(() => {
          setLoading(false);
          setResetSent(true);
      }, 1500);
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
      setLoading(true);
      try {
          const session = await authService.socialLogin(provider);
          onAuthSuccess(session.user);
      } catch (e) {
          setError("Social login failed.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-accent/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-brand-surface w-full max-w-md p-8 rounded-2xl shadow-2xl border border-gray-800 relative z-10 animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-accent/20 rounded-xl mb-4 shadow-[0_0_15px_rgba(0,188,212,0.3)]">
            <Activity className="text-brand-accent" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">ReportGenius AI</h1>
          <p className="text-gray-400 mt-2 text-sm">Enterprise Intelligence Platform</p>
        </div>

        {view !== 'forgot' && (
            <div className="flex bg-gray-800/50 p-1 rounded-lg mb-6">
            <button
                onClick={() => { setView('login'); setError(''); }}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                view === 'login' ? 'bg-brand-accent text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
            >
                Login
            </button>
            <button
                onClick={() => { setView('signup'); setError(''); }}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                view === 'signup' ? 'bg-brand-accent text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
            >
                Sign Up
            </button>
            </div>
        )}

        {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-xs font-medium flex items-center gap-2 animate-in slide-in-from-top-2">
                <AlertCircle size={14} className="shrink-0"/> {error}
            </div>
        )}

        {view === 'forgot' ? (
            <div className="animate-in slide-in-from-right-4">
                <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => { setView('login'); setResetSent(false); setError(''); }} className="p-1 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft size={18}/>
                    </button>
                    <h3 className="text-lg font-bold text-white">Reset Password</h3>
                </div>
                
                {resetSent ? (
                    <div className="text-center py-8 space-y-4">
                        <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                            <CheckCircle2 size={32} />
                        </div>
                        <h4 className="text-white font-bold">Check your email</h4>
                        <p className="text-gray-400 text-sm">We've sent a password reset link to <br/> <span className="text-white font-medium">{email}</span></p>
                        <button 
                            onClick={() => setView('login')}
                            className="w-full mt-4 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-all"
                        >
                            Return to Login
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleForgotSubmit} className="space-y-4">
                        <p className="text-sm text-gray-400 mb-2">Enter your email address and we'll send you a link to reset your password.</p>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email Address</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 pl-10 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors"
                                    placeholder="name@company.com"
                                    autoFocus
                                />
                                <Mail size={18} className="absolute left-3 top-3.5 text-gray-500" />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-accent hover:bg-brand-accentHover text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                            ) : (
                                'Send Reset Link'
                            )}
                        </button>
                    </form>
                )}
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-4 animate-in slide-in-from-left-4">
                {view === 'signup' && (
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Full Name</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 pl-10 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors"
                                placeholder="John Doe"
                            />
                            <UserIcon size={18} className="absolute left-3 top-3.5 text-gray-500" />
                        </div>
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email Address</label>
                    <div className="relative">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full bg-gray-900/50 border rounded-xl px-4 py-3 pl-10 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors ${
                                email && !validateEmail(email) ? 'border-red-500/50' : 'border-gray-700'
                            }`}
                            placeholder="name@company.com"
                        />
                        <Mail size={18} className="absolute left-3 top-3.5 text-gray-500" />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={handlePasswordChange}
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 pl-10 pr-10 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors"
                            placeholder="••••••••"
                        />
                        <Lock size={18} className="absolute left-3 top-3.5 text-gray-500" />
                        <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3.5 text-gray-500 hover:text-white transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {view === 'signup' && password.length > 0 && (
                        <div className="flex gap-1 mt-2 h-1 px-1">
                            <div className={`flex-1 rounded-full ${passwordStrength > 0 ? 'bg-red-500' : 'bg-gray-800'}`}></div>
                            <div className={`flex-1 rounded-full ${passwordStrength > 1 ? 'bg-yellow-500' : 'bg-gray-800'}`}></div>
                            <div className={`flex-1 rounded-full ${passwordStrength > 2 ? 'bg-green-500' : 'bg-gray-800'}`}></div>
                            <div className={`flex-1 rounded-full ${passwordStrength > 3 ? 'bg-brand-accent' : 'bg-gray-800'}`}></div>
                        </div>
                    )}
                    {view === 'login' && (
                        <div className="text-right">
                            <button 
                                type="button"
                                onClick={() => setView('forgot')}
                                className="text-xs text-brand-accent hover:underline focus:outline-none"
                            >
                                Forgot password?
                            </button>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-brand-accent to-brand-accentHover text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-brand-accent/20 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                            <span>{view === 'login' ? 'Signing in...' : 'Creating Account...'}</span>
                        </>
                    ) : (
                        <>
                            {view === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={18} />
                        </>
                    )}
                </button>
            </form>
        )}

        <div className="my-6 flex items-center gap-3">
            <div className="h-px bg-gray-800 flex-1"></div>
            <span className="text-xs text-gray-500 font-medium">OR CONTINUE WITH</span>
            <div className="h-px bg-gray-800 flex-1"></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
            <button 
                onClick={() => handleSocialLogin('google')}
                className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-white py-2.5 rounded-xl transition-all"
            >
                <Chrome size={18} /> <span className="text-sm font-medium">Google</span>
            </button>
            <button 
                onClick={() => handleSocialLogin('github')}
                className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-white py-2.5 rounded-xl transition-all"
            >
                <Github size={18} /> <span className="text-sm font-medium">Github</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;