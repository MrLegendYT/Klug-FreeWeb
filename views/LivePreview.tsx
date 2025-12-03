import React from 'react';
import { useStore } from '../StoreContext';
import { ViewState } from '../types';
import { Button } from '../components/Button';
import { ArrowLeft } from 'lucide-react';

export const LivePreview: React.FC = () => {
    const { themes, selectedThemeId, setView } = useStore();
    const theme = themes.find(t => t.id === selectedThemeId);

    if (!theme) return <div>Theme not found</div>;

    return (
        <div className="flex flex-col h-screen bg-black">
            <div className="bg-slate-900 text-white p-3 flex justify-between items-center z-10">
                 <Button variant="secondary" size="sm" onClick={() => setView(ViewState.THEME_DETAILS)}>
                    <ArrowLeft size={16} className="mr-2"/> Back to Details
                 </Button>
                 <span className="font-semibold">{theme.title} Preview</span>
                 <div className="w-20"></div> {/* Spacer */}
            </div>
            <div className="flex-1 bg-white">
                <iframe 
                    srcDoc={theme.previewHtml} 
                    className="w-full h-full border-none" 
                    title="Live Preview"
                />
            </div>
        </div>
    )
}
