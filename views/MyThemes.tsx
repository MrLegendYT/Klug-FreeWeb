import React from 'react';
import { useStore } from '../StoreContext';
import { Button } from '../components/Button';
import { ViewState } from '../types';
import { Edit, Download, Trash2, GitFork } from 'lucide-react';

export const MyThemes: React.FC = () => {
  const { user, themes, userThemes, selectTheme, openEditor, deleteTheme, setView } = useStore();

  // Logic: 
  // 1. Get all theme IDs the user has unlocked.
  // 2. For each ID, check if there is a 'UserTheme' (fork) that matches the originalThemeId.
  // 3. If yes, use the UserTheme. If no, use the Global Theme.
  
  if (!user) return <div className="p-10 text-center">Please login to view your themes.</div>;

  const displayItems = user.unlockedThemeIds.map(themeId => {
      // Check for user fork
      const userFork = userThemes.find(ut => ut.originalThemeId === themeId);
      const original = themes.find(t => t.id === themeId);
      
      if (userFork) {
          return {
              ...userFork,
              isFork: true,
              originalId: themeId,
              // UserThemes have their own ID, but for navigation we often use the original ID to trigger the editor correctly
              // However, the OpenEditor function takes an ID. 
              // We will pass the ORIGINAL ID to openEditor, and let AIEditor resolve the fork.
              navId: themeId 
          };
      } else if (original) {
          return {
              ...original,
              isFork: false,
              originalId: themeId,
              navId: themeId
          };
      }
      return null;
  }).filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">My Themes</h1>
      
      {displayItems.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <p className="text-lg text-slate-500 mb-4">You haven't unlocked any themes yet.</p>
          <Button onClick={() => setView(ViewState.THEMES)}>Browse Store</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayItems.map((theme: any) => (
            <div key={theme.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="aspect-video bg-slate-200 relative overflow-hidden">
                <iframe 
                  srcDoc={theme.previewHtml} 
                  className="absolute inset-0 w-[400%] h-[400%] border-0 pointer-events-none bg-white"
                  style={{ transform: 'scale(0.25)', transformOrigin: 'top left' }}
                  tabIndex={-1}
                  title={theme.title}
                />
                {theme.isFork && (
                    <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm z-10 flex items-center">
                        <GitFork size={12} className="mr-1"/> Edited
                    </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg mb-1">{theme.title}</h3>
                <p className="text-xs text-slate-500 mb-4">
                    {theme.isFork ? 'Customized Version' : 'Original Version'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="primary" onClick={() => openEditor(theme.navId)}>
                    <Edit size={16} className="mr-2" /> Editor
                  </Button>
                  <Button variant="secondary" onClick={() => {
                       const blob = new Blob([theme.previewHtml], { type: 'text/html' });
                       const url = URL.createObjectURL(blob);
                       const a = document.createElement('a');
                       a.href = url;
                       a.download = `${theme.title.replace(/\s+/g, '-').toLowerCase()}.html`;
                       a.click();
                  }}>
                    <Download size={16} className="mr-2" /> Get
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};