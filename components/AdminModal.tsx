import React, { useState, useEffect } from 'react';
import { ADMIN_PASSWORD } from '../constants';
import { useStore } from '../StoreContext';
import { ViewState } from '../types';
import { Lock, AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const { setView } = useStore();

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setView(ViewState.ADMIN_DASHBOARD);
      onClose();
    } else {
      setError(true);
      setTimeout(() => setError(false), 820); // Reset after animation
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className={`bg-slate-900 border border-slate-700 w-full max-w-md p-8 rounded-2xl shadow-2xl ${error ? 'animate-shake' : ''}`}>
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="text-red-500" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-white">Admin Access</h2>
          <p className="text-slate-400 text-sm mt-1">Restricted Area. Authorized personnel only.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Enter Access Key"
              autoFocus
            />
          </div>
          
          {error && (
            <div className="flex items-center text-red-400 text-sm">
              <AlertCircle size={16} className="mr-2" />
              <span>Access Denied: Invalid Password</span>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <Button type="button" variant="ghost" className="flex-1 text-slate-400 hover:text-white" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" className="flex-1">
              Enter Dashboard
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
