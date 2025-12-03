import React from 'react';
import { useStore } from '../StoreContext';
import { ViewState } from '../types';
import { Button } from './Button';
import { ShoppingBag, Layout, User as UserIcon, LogOut } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, setView, logout } = useStore();

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          <div 
            className="flex items-center cursor-pointer"
            onClick={() => setView(ViewState.HOME)}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-2">
              <span className="text-white font-bold text-xl">K</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">Klug FreeWeb</span>
          </div>

          <div className="hidden md:flex space-x-8 items-center">
            <button onClick={() => setView(ViewState.HOME)} className="text-slate-600 hover:text-blue-600 font-medium">Home</button>
            <button onClick={() => setView(ViewState.THEMES)} className="text-slate-600 hover:text-blue-600 font-medium">Browse Themes</button>
            {user && (
              <button onClick={() => setView(ViewState.MY_THEMES)} className="text-slate-600 hover:text-blue-600 font-medium">My Themes</button>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-slate-500 hidden sm:block">Hi, {user.name}</span>
                <Button variant="ghost" size="sm" onClick={logout} title="Logout">
                  <LogOut size={18} />
                </Button>
              </div>
            ) : (
              <Button onClick={() => setView(ViewState.LOGIN)}>Login / Signup</Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
