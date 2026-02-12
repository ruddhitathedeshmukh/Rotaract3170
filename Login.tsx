
import React, { useState } from 'react';
import { UserRole, Club, User } from './types';
import { DistrictAPI } from './api';

interface LoginProps {
  onLogin: (user: User) => void;
  clubs: Club[];
}

const Login: React.FC<LoginProps> = ({ onLogin, clubs }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    try {
      const user = await DistrictAPI.login(username, password);
      
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid username or password.');
      }
    } catch (err) {
      setError('Connection error. Please check your network.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-50 text-pink-600 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">District 3170 Portal</h1>
          <p className="text-slate-500 mt-2">Sign in to manage your club</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg animate-pulse">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              type="text"
              required
              disabled={isLoggingIn}
              className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-pink-500 transition-all disabled:bg-slate-50 disabled:text-slate-400"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              disabled={isLoggingIn}
              className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-pink-500 transition-all disabled:bg-slate-50 disabled:text-slate-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoggingIn}
            className="w-full bg-[#D91B5C] text-white font-semibold py-3 rounded-lg hover:bg-[#b0164a] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Authenticating...
              </>
            ) : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
