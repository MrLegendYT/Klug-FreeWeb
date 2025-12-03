import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../StoreContext';
import { Button } from '../components/Button';
import { ChatMessage, ViewState } from '../types';
import { editThemeCode } from '../services/geminiService';
import { ArrowLeft, Save, Download, Send, RotateCcw, Wand2, Monitor, Code, Sparkles, MousePointer2, Type, X, Check } from 'lucide-react';

// Helper to inject unique IDs and the interaction script
const prepareHtmlForEditor = (html: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // 1. Add unique IDs to all significant elements if they don't have one
  let counter = 0;
  const seed = Date.now();
  doc.body.querySelectorAll('*').forEach((el) => {
    if (!el.getAttribute('data-aid-id')) {
        el.setAttribute('data-aid-id', `aid-${seed}-${counter++}`);
    }
  });

  // 2. Inject Editor Script
  const scriptId = 'aid-editor-script';
  if (!doc.getElementById(scriptId)) {
    const script = doc.createElement('script');
    script.id = scriptId;
    script.textContent = `
      window.selectionMode = false;
      
      document.body.addEventListener('mouseover', (e) => {
        if (!window.selectionMode) return;
        e.stopPropagation();
        e.target.style.outline = '2px solid #3b82f6';
        e.target.style.cursor = 'crosshair';
      });

      document.body.addEventListener('mouseout', (e) => {
        if (!window.selectionMode) return;
        e.stopPropagation();
        e.target.style.outline = '';
        e.target.style.cursor = '';
      });

      document.body.addEventListener('click', (e) => {
        if (!window.selectionMode) return;
        e.preventDefault();
        e.stopPropagation();
        
        // Remove outline immediately
        e.target.style.outline = '';
        
        const id = e.target.getAttribute('data-aid-id');
        const text = e.target.innerText;
        const tagName = e.target.tagName;
        
        window.parent.postMessage({ 
            type: 'ELEMENT_SELECTED', 
            payload: { id, text, tagName } 
        }, '*');
      }, true);

      window.addEventListener('message', (e) => {
         if (e.data.type === 'TOGGLE_SELECTION_MODE') {
             window.selectionMode = e.data.active;
             document.body.style.userSelect = e.data.active ? 'none' : 'auto';
         }
         if (e.data.type === 'SCROLL_INTO_VIEW') {
             const el = document.querySelector('[data-aid-id="' + e.data.id + '"]');
             if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
         }
      });
    `;
    doc.body.appendChild(script);
  }

  // Ensure DOCTYPE is present for correct rendering standards
  return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
};

// Helper to clean HTML for download
const cleanHtmlForExport = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Remove our script
    const script = doc.getElementById('aid-editor-script');
    if (script) script.remove();

    // Remove our attributes
    doc.body.querySelectorAll('*').forEach((el) => {
        el.removeAttribute('data-aid-id');
        if (el instanceof HTMLElement) {
            el.style.outline = '';
            el.style.cursor = '';
        }
    });

    return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
};

interface SelectedElement {
    id: string;
    text: string;
    tagName: string;
}

export const AIEditor: React.FC = () => {
  const { themes, userThemes, selectedThemeId, setView, saveUserTheme } = useStore();
  
  // Find Original Theme
  const originalTheme = themes.find(t => t.id === selectedThemeId);
  // Find User's Fork (if exists)
  const userTheme = userThemes.find(t => t.originalThemeId === selectedThemeId);

  // Use user's saved HTML if available, otherwise original
  const initialHtmlSource = userTheme ? userTheme.previewHtml : (originalTheme?.previewHtml || '');
  const displayTitle = userTheme ? userTheme.title : originalTheme?.title;

  // Editor State
  const [currentHtml, setCurrentHtml] = useState(() => {
    return initialHtmlSource ? prepareHtmlForEditor(initialHtmlSource) : '';
  });

  const [viewMode, setViewMode] = useState<'PREVIEW' | 'CODE'>('PREVIEW');
  const [sidebarTab, setSidebarTab] = useState<'CHAT' | 'INSPECTOR'>('CHAT');
  
  // Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [manualEditText, setManualEditText] = useState('');

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hello! I am your AI web designer. Any changes you make here will be saved to your personal library.' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync if theme changes (e.g. initial load latency)
  useEffect(() => {
    if (!currentHtml && initialHtmlSource) {
        setCurrentHtml(prepareHtmlForEditor(initialHtmlSource));
    }
  }, [initialHtmlSource]);

  // Handle messages from iframe
  useEffect(() => {
      const handleMessage = (e: MessageEvent) => {
          if (e.data.type === 'ELEMENT_SELECTED') {
              const el = e.data.payload as SelectedElement;
              setSelectedElement(el);
              setManualEditText(el.text); 
              setSidebarTab('INSPECTOR'); 
              setIsSelectionMode(false); 
          }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Sync selection mode with iframe
  useEffect(() => {
      if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage({ 
              type: 'TOGGLE_SELECTION_MODE', 
              active: isSelectionMode 
          }, '*');
      }
  }, [isSelectionMode, currentHtml]);

  // Auto-scroll chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, sidebarTab]);

  if (!originalTheme && !userTheme) return <div className="p-10 text-center text-white">Theme not found</div>;

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    if (!selectedThemeId) return;

    const userMsg: ChatMessage = { role: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      setViewMode('PREVIEW');
      
      let context = "";
      if (selectedElement) {
          context = `The user has specifically selected the HTML element with ID "${selectedElement.id}", which is a <${selectedElement.tagName}> containing the text: "${selectedElement.text}". Focus your changes on or relative to this element if relevant.`;
      }

      const prompt = context ? `${userMsg.text}\n\n[System Context]: ${context}` : userMsg.text;

      // Call Gemini API
      const newRawHtml = await editThemeCode(currentHtml, prompt);
      
      // Re-inject scripts/IDs
      const rePreparedHtml = prepareHtmlForEditor(newRawHtml);
      
      setCurrentHtml(rePreparedHtml);
      setMessages(prev => [...prev, { role: 'model', text: 'I have updated the design and saved it to your themes.' }]);
      
      // Save to User Theme
      await saveUserTheme(selectedThemeId, rePreparedHtml);
      
      setSelectedElement(null); 
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'Error connecting to AI. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualTextUpdate = async () => {
      if (!selectedElement || !selectedThemeId) return;

      const parser = new DOMParser();
      const doc = parser.parseFromString(currentHtml, 'text/html');
      
      const el = doc.querySelector(`[data-aid-id="${selectedElement.id}"]`);
      if (el) {
          el.textContent = manualEditText;
          const newHtml = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
          setCurrentHtml(newHtml);
          setSelectedElement(prev => prev ? ({...prev, text: manualEditText}) : null);
          
          // Save to User Theme
          await saveUserTheme(selectedThemeId, newHtml);
      }
  };

  const handleDownload = () => {
    const cleanHtml = cleanHtmlForExport(currentHtml);
    const blob = new Blob([cleanHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(displayTitle || 'theme').replace(/\s+/g, '-').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Editor Header */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-20 shadow-lg">
        <div className="flex items-center gap-4">
          <button onClick={() => setView(ViewState.MY_THEMES)} className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-tight">{displayTitle}</span>
                {userTheme ? (
                   <span className="text-[10px] uppercase font-bold tracking-wider bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20">My Edited Version</span>
                ) : (
                   <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">Original</span>
                )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
             {/* View Toggles */}
            <div className="bg-slate-800/50 p-1 rounded-lg flex gap-1 border border-slate-700">
                <button 
                    onClick={() => setViewMode('PREVIEW')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center transition-all ${viewMode === 'PREVIEW' ? 'bg-slate-700 text-white shadow-sm ring-1 ring-slate-600' : 'text-slate-400 hover:text-white'}`}
                >
                    <Monitor size={14} className="mr-2" /> Preview
                </button>
                <button 
                    onClick={() => setViewMode('CODE')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center transition-all ${viewMode === 'CODE' ? 'bg-slate-700 text-white shadow-sm ring-1 ring-slate-600' : 'text-slate-400 hover:text-white'}`}
                >
                    <Code size={14} className="mr-2" /> Code
                </button>
            </div>

            <div className="h-6 w-px bg-slate-800 mx-1"></div>

            <Button variant="ghost" size="sm" onClick={() => setCurrentHtml(prepareHtmlForEditor(initialHtmlSource))} className="text-slate-400 hover:text-white" title="Reset to Last Saved">
                <RotateCcw size={18} />
            </Button>
            <Button variant="primary" size="sm" onClick={handleDownload} className="bg-green-600 hover:bg-green-700 border-green-600 shadow-lg shadow-green-900/20">
                <Download size={16} className="mr-2"/> Export
            </Button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Sidebar */}
        <div className="w-80 lg:w-96 bg-slate-900 border-r border-slate-800 flex flex-col z-10 shadow-2xl">
            
            {/* Sidebar Tabs */}
            <div className="flex border-b border-slate-800">
                <button 
                    onClick={() => setSidebarTab('CHAT')}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${sidebarTab === 'CHAT' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                    AI Assistant
                </button>
                <button 
                    onClick={() => setSidebarTab('INSPECTOR')}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${sidebarTab === 'INSPECTOR' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                    Inspector
                </button>
            </div>

            {/* Content: Chat */}
            {sidebarTab === 'CHAT' && (
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-slate-900">
                        {messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`flex items-end gap-2 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                {msg.role === 'model' && (
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20">
                                        <Sparkles size={12} className="text-white" />
                                    </div>
                                )}
                                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                                msg.role === 'user' 
                                    ? 'bg-blue-600 text-white rounded-br-sm' 
                                    : 'bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700/50'
                                }`}>
                                {msg.text}
                                </div>
                            </div>
                        </div>
                        ))}
                        
                        {isLoading && (
                            <div className="flex items-center gap-2 text-slate-500 text-sm ml-2">
                                <Wand2 size={14} className="animate-spin" /> AI is working...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 bg-slate-900 border-t border-slate-800">
                        {selectedElement && (
                             <div className="mb-2 px-3 py-2 bg-blue-900/20 border border-blue-500/30 rounded-lg flex justify-between items-center text-xs">
                                <span className="text-blue-200 truncate max-w-[200px]">Context: {selectedElement.tagName.toLowerCase()} "{selectedElement.text.substring(0, 15)}..."</span>
                                <button onClick={() => setSelectedElement(null)} className="text-blue-400 hover:text-white"><X size={12}/></button>
                             </div>
                        )}
                        <div className="relative shadow-sm">
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder={selectedElement ? "Ask AI to change this element..." : "Describe your changes..."}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none h-14 custom-scrollbar text-sm transition-all focus:bg-slate-800"
                                disabled={isLoading}
                            />
                            <button 
                                onClick={handleSendMessage}
                                disabled={isLoading || !inputText.trim()}
                                className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg disabled:opacity-50 disabled:bg-slate-700 transition-colors flex items-center justify-center w-10 shadow-lg shadow-blue-900/20"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content: Inspector */}
            {sidebarTab === 'INSPECTOR' && (
                <div className="flex-1 p-6 flex flex-col bg-slate-900">
                    {selectedElement ? (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Selected Element</h3>
                                <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex items-center justify-between">
                                    <code className="text-blue-400 font-mono text-sm">&lt;{selectedElement.tagName.toLowerCase()}&gt;</code>
                                    <span className="text-slate-500 text-xs font-mono">{selectedElement.id.split('-').pop()}</span>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Text Content</h3>
                                <textarea
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:outline-none min-h-[120px] text-sm leading-relaxed"
                                    value={manualEditText}
                                    onChange={(e) => setManualEditText(e.target.value)}
                                />
                                <div className="flex gap-2 mt-3">
                                    <Button size="sm" variant="primary" onClick={handleManualTextUpdate} className="flex-1">
                                        <Check size={14} className="mr-2" /> Apply Text
                                    </Button>
                                    <Button size="sm" variant="secondary" onClick={() => setManualEditText(selectedElement.text)}>
                                        Reset
                                    </Button>
                                </div>
                            </div>

                            <div className="border-t border-slate-800 pt-6">
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">AI Actions</h3>
                                <div className="space-y-2">
                                    <Button 
                                        variant="secondary" 
                                        className="w-full justify-start text-sm"
                                        onClick={() => {
                                            setSidebarTab('CHAT');
                                            setInputText(`Change the background color of this ${selectedElement.tagName.toLowerCase()} to...`);
                                        }}
                                    >
                                        <Wand2 size={14} className="mr-2 text-purple-400"/> Style with AI
                                    </Button>
                                    <Button 
                                        variant="secondary" 
                                        className="w-full justify-start text-sm"
                                        onClick={() => {
                                            setSidebarTab('CHAT');
                                            setInputText(`Rewrite the text of this element to be more professional.`);
                                            handleSendMessage(); 
                                        }}
                                    >
                                        <Type size={14} className="mr-2 text-green-400"/> Rewrite Content
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 space-y-4">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                                <MousePointer2 size={32} className="opacity-50"/>
                            </div>
                            <div>
                                <p className="font-medium text-slate-300">No element selected</p>
                                <p className="text-sm mt-1">Use the "Select Element" tool in the toolbar to pick something to edit.</p>
                            </div>
                            <Button variant="secondary" onClick={() => setIsSelectionMode(true)}>
                                Activate Selector
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Right Panel: Viewport */}
        <div className="flex-1 bg-slate-950 relative flex flex-col">
            
          {/* Toolbar overlay for the preview area */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-2 bg-slate-800/90 backdrop-blur border border-slate-600/50 p-1.5 rounded-full shadow-xl">
             <button 
                onClick={() => setIsSelectionMode(!isSelectionMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isSelectionMode 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                title="Click to select an element on the page"
             >
                <MousePointer2 size={16} />
                {isSelectionMode ? 'Click an element to edit' : 'Select Element'}
             </button>
             {isSelectionMode && (
                 <button onClick={() => setIsSelectionMode(false)} className="p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white">
                     <X size={16} />
                 </button>
             )}
          </div>

          {viewMode === 'PREVIEW' ? (
             <div className="flex-1 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-slate-900 flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden relative">
                {isLoading && (
                    <div className="absolute inset-0 z-20 bg-black/20 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-300">
                        <div className="bg-slate-900/90 border border-slate-700/50 p-4 rounded-xl shadow-2xl flex flex-col items-center backdrop-blur-md">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
                            <span className="text-sm font-medium text-slate-300">Generating Code...</span>
                        </div>
                    </div>
                )}
                {/* Browser Window Simulation */}
                <div className="w-full h-full max-w-[1400px] bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-700/50 ring-1 ring-slate-800 relative flex flex-col">
                    <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                        </div>
                        <div className="flex-1 bg-white rounded-md border border-slate-200 h-6 mx-4 text-[10px] text-slate-400 flex items-center px-2 font-mono truncate">
                            about:blank
                        </div>
                    </div>
                    <iframe 
                        ref={iframeRef}
                        srcDoc={currentHtml}
                        className="flex-1 w-full border-0"
                        title="Preview"
                        sandbox="allow-scripts allow-same-origin allow-modals"
                    />
                </div>
             </div>
          ) : (
              <div className="flex-1 relative bg-[#1e1e1e]">
                  <textarea 
                    className="w-full h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono p-6 resize-none focus:outline-none text-sm leading-relaxed custom-scrollbar"
                    value={currentHtml}
                    onChange={(e) => setCurrentHtml(e.target.value)}
                    spellCheck={false}
                    style={{ fontFamily: '"Fira Code", "Consolas", monospace' }}
                  />
                  <div className="absolute bottom-4 right-4 bg-slate-800/80 backdrop-blur text-slate-400 text-xs px-3 py-1 rounded border border-slate-700 pointer-events-none select-none">
                    Raw HTML (Contains Editor IDs)
                  </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};