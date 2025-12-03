import React, { useState } from 'react';
import { useStore } from '../StoreContext';
import { ViewState } from '../types';
import { Button } from '../components/Button';
import { AlertCircle } from 'lucide-react';

interface AuthProps {
  mode: 'LOGIN' | 'SIGNUP';
}

export const Auth: React.FC<AuthProps> = ({ mode }) => {
  const { login, signup, setView } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'LOGIN') {
        await login(email, password);
      } else {
        await signup(email, password, name);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError("Invalid email or password.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("Email is already registered.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">{mode === 'LOGIN' ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="text-slate-500 mt-2">
            {mode === 'LOGIN' ? 'Enter your details to access your themes.' : 'Join Klug FreeWeb today.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center">
            <AlertCircle size={16} className="mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'SIGNUP' && (
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                  placeholder="John Doe"
                  required
                />
             </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" className="w-full text-lg mt-4" disabled={loading}>
            {loading ? 'Processing...' : (mode === 'LOGIN' ? 'Sign In' : 'Sign Up')}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          {mode === 'LOGIN' ? (
            <>Don't have an account? <button onClick={() => setView(ViewState.SIGNUP)} className="text-blue-600 font-bold hover:underline">Sign up</button></>
          ) : (
             <>Already have an account? <button onClick={() => setView(ViewState.LOGIN)} className="text-blue-600 font-bold hover:underline">Log in</button></>
          )}
        </div>
      </div>
    </div>
  );
};