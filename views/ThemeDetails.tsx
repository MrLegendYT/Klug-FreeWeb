import React, { useState, useEffect } from 'react';
import { useStore } from '../StoreContext';
import { ViewState } from '../types';
import { Button } from '../components/Button';
import { ArrowLeft, Monitor, Download, Clock, CheckCircle, ExternalLink, Edit } from 'lucide-react';

export const ThemeDetails: React.FC = () => {
  const { themes, selectedThemeId, setView, unlockTheme, openEditor, user, currentView } = useStore();
  const [showMeterModal, setShowMeterModal] = useState(false);
  const [meterProgress, setMeterProgress] = useState(0);
  const [isReferralMode, setIsReferralMode] = useState(false);
  
  const theme = themes.find(t => t.id === selectedThemeId);

  if (!theme) return <div>Theme not found</div>;

  const isUnlocked = user?.unlockedThemeIds.includes(theme.id);

  const handleAction = () => {
    if (isUnlocked) {
      openEditor(theme.id);
      return;
    }
    
    // Reset state
    setMeterProgress(0);
    setIsReferralMode(false);
    setShowMeterModal(true);

    if (theme.clickPrice > 10) {
      setIsReferralMode(true);
    }
  };

  const handleFillClick = () => {
    // Open Monetag link
    const link = theme.monetagLink || '#';
    window.open(link, '_blank');
    
    // Simulate return and increment
    setTimeout(() => {
        setMeterProgress(prev => {
            const newProgress = prev + 1;
            if (newProgress >= theme.clickPrice) {
                // Done!
                setTimeout(() => {
                    unlockTheme(theme.id);
                    setShowMeterModal(false);
                    // Stay on page so they can click Open Editor
                }, 1000);
            }
            return newProgress;
        });
    }, 2000); 
  };

  const handleReferralSignup = () => {
      // Open Referral Link
      const link = theme.referralLink || theme.monetagLink || '#';
      window.open(link, '_blank');
      
      // Start 2 min timer simulation (fast forwarded for demo)
      let progress = 0;
      const interval = setInterval(() => {
          progress += 5; // Faster for demo
          setMeterProgress(progress); 
          if (progress >= 100) {
              clearInterval(interval);
              unlockTheme(theme.id);
              setShowMeterModal(false);
              // Stay on page
          }
      }, 500);
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Top Bar */}
      <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 bg-white z-20">
        <Button variant="ghost" onClick={() => setView(ViewState.THEMES)} className="flex items-center">
          <ArrowLeft size={18} className="mr-2" /> Back to Browse
        </Button>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setView(ViewState.LIVE_PREVIEW)}>
            <Monitor size={18} className="mr-2" /> Live Preview
          </Button>
          <Button variant="primary" onClick={handleAction} className={isUnlocked ? "bg-green-600 hover:bg-green-700" : ""}>
            {isUnlocked ? <><Edit size={18} className="mr-2"/> Open AI Editor</> : 'Get For Free'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="rounded-xl overflow-hidden shadow-lg border border-slate-100 bg-slate-50 aspect-video mb-8 relative">
            <iframe 
              srcDoc={theme.previewHtml} 
              title={theme.title}
              className="w-full h-full border-0 bg-white"
              sandbox="allow-scripts"
            />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">{theme.title}</h1>
          <p className="text-lg text-slate-600 leading-relaxed mb-8">{theme.description}</p>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 sticky top-24">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Unlock Requirements</h3>
            
            <div className="flex items-center justify-between mb-4 p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-500">Price</span>
              <span className="font-bold text-green-600">FREE</span>
            </div>

            <div className="flex items-center justify-between mb-6 p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-500">Click Meter</span>
              <span className="font-bold text-blue-600">{theme.clickPrice} Fills Required</span>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-800 mb-6">
              <p className="mb-2 font-semibold">How it works:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Click "Get For Free"</li>
                <li>Complete the required number of ad views (fills)</li>
                <li>Instantly unlock the theme for customization and download</li>
              </ul>
            </div>

            <Button className={`w-full py-4 text-lg ${isUnlocked ? 'bg-green-600 hover:bg-green-700' : ''}`} onClick={handleAction}>
              {isUnlocked ? 'Open AI Editor' : 'Start Unlocking'}
            </Button>
          </div>
          
          {/* Ad Placeholder */}
           <div className="mt-8 h-64 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400">
             Sidebar Ad
           </div>
        </div>
      </div>

      {/* Unlock Modal */}
      {showMeterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
            <div className="bg-blue-600 p-6 text-white text-center">
              <h2 className="text-2xl font-bold">Fill To Unlock</h2>
              <p className="opacity-90 mt-1">{theme.title}</p>
            </div>
            
            <div className="p-8">
              {isReferralMode ? (
                <div className="text-center">
                   <div className="mb-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-yellow-800">
                     <p className="font-bold mb-1">Premium Theme Detected</p>
                     <p className="text-sm">To unlock this high-value theme, please complete a quick signup.</p>
                   </div>
                   
                   {meterProgress > 0 ? (
                       <div className="space-y-4">
                           <p className="text-slate-600 font-medium">Verifying Signup...</p>
                           <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                             <div className="bg-green-500 h-full transition-all duration-300" style={{ width: `${meterProgress}%` }}></div>
                           </div>
                           <p className="text-xs text-slate-400">Please do not close this window.</p>
                       </div>
                   ) : (
                       <>
                        <div className="flex items-center justify-center mb-6 text-slate-400">
                            <Clock size={48} />
                        </div>
                        <Button className="w-full mb-3" onClick={handleReferralSignup}>
                            Open Signup Link <ExternalLink size={16} className="ml-2"/>
                        </Button>
                        <p className="text-xs text-slate-400">Verification usually takes 2 minutes.</p>
                       </>
                   )}
                </div>
              ) : (
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                            <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={377} strokeDashoffset={377 - (377 * meterProgress) / theme.clickPrice} className="text-blue-600 transition-all duration-500 ease-out" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-slate-800">{meterProgress} / {theme.clickPrice}</span>
                            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Fills</span>
                        </div>
                    </div>
                  </div>
                  
                  <p className="text-slate-600 mb-6">Click the button below to add a fill. The meter updates automatically.</p>
                  
                  <Button size="lg" className="w-full shadow-lg hover:shadow-xl transform transition-transform active:scale-95" onClick={handleFillClick}>
                    Fill Meter (+1)
                  </Button>
                </div>
              )}
            </div>
            
            <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                <button onClick={() => setShowMeterModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-medium">Cancel Unlock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};