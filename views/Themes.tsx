import React, { useState } from 'react';
import { useStore } from '../StoreContext';
import { Button } from '../components/Button';
import { Search, Zap } from 'lucide-react';

export const Themes: React.FC = () => {
  const { themes, selectTheme } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredThemes = themes.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Browse Themes</h1>
          <p className="text-slate-500 mt-1">Explore our collection of high-quality templates.</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search themes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredThemes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-dashed border-slate-300">
          <p className="text-slate-500 text-lg">No themes found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredThemes.map(theme => (
            <div key={theme.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow border border-slate-100 overflow-hidden flex flex-col">
              <div className="relative aspect-[4/3] bg-slate-200 overflow-hidden">
                <iframe 
                  srcDoc={theme.previewHtml} 
                  title={theme.title}
                  className="absolute inset-0 w-[400%] h-[400%] border-0 pointer-events-none bg-white"
                  style={{ transform: 'scale(0.25)', transformOrigin: 'top left' }}
                  tabIndex={-1}
                />
                <div className="absolute inset-0 bg-transparent" />
                <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm z-10">
                   Free
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-900">{theme.title}</h3>
                </div>
                <div className="flex items-center text-xs text-slate-500 mb-4">
                   <Zap size={14} className="text-yellow-500 mr-1" />
                   <span>{theme.clickPrice} fills required</span>
                </div>
                <div className="mt-auto grid grid-cols-2 gap-2">
                  <Button variant="secondary" size="sm" onClick={() => selectTheme(theme.id)}>Preview</Button>
                  <Button variant="primary" size="sm" onClick={() => selectTheme(theme.id)}>Get Free</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};