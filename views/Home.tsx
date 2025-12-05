import React from 'react';
import { useStore } from '../StoreContext';
import { ViewState } from '../types';
import { Button } from '../components/Button';
import { ArrowRight, Star, Zap } from 'lucide-react';

export const Home: React.FC = () => {
  const { themes, selectTheme, setView } = useStore();
  const featuredThemes = themes.slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-white pt-20 pb-24 px-4 sm:px-6 lg:px-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
            Build your dream site <br />
            <span className="text-blue-600">without spending a dime.</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10">
            Klug WebSpark offers premium, professional website themes unlocked by our unique community click system. Customize with AI, download instantly.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" onClick={() => setView(ViewState.THEMES)}>
              Browse Themes <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="secondary" onClick={() => setView(ViewState.SIGNUP)}>
              Get Started
            </Button>
          </div>
        </div>
      </section>

      {/* Placeholder Ad Spot */}
      <div className="w-full bg-slate-100 py-8 border-b border-slate-200">
        <div className="max-w-4xl mx-auto h-24 bg-slate-200 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400">
          <span>Ad Spot (Responsive Banner)</span>
        </div>
      </div>

      {/* Featured Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Featured Themes</h2>
            <p className="text-slate-500 mt-2">Hand-picked by our design team.</p>
          </div>
          <Button variant="ghost" onClick={() => setView(ViewState.THEMES)}>View All</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredThemes.map(theme => (
            <div key={theme.id} className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100 flex flex-col">
              <div className="relative aspect-video overflow-hidden bg-slate-200">
                <iframe 
                  srcDoc={theme.previewHtml}
                  className="absolute inset-0 w-[400%] h-[400%] border-0 pointer-events-none bg-white"
                  style={{ transform: 'scale(0.25)', transformOrigin: 'top left' }}
                  tabIndex={-1}
                  title={theme.title}
                />
                <div className="absolute inset-0 bg-transparent" />
                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-md flex items-center z-10">
                  <Zap size={12} className="mr-1 text-yellow-400" />
                  {theme.clickPrice} Fills
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-slate-900 mb-2">{theme.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-1">{theme.description}</p>
                <div className="mt-auto flex gap-3">
                  <Button variant="primary" className="flex-1" onClick={() => selectTheme(theme.id)}>
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};