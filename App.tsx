import React, { useState, useEffect } from 'react';
import { analyzeImage } from './services/geminiService';
import { ImageItem, AnalysisResult } from './types';

// EDIT THIS: Change this to your actual name
const DEVELOPER_NAME = "Your Name";

const COLOR_THEMES = ["Dark Theme", "Light Theme", "Cyber Neon", "Golden Hour", "Pastel Dream", "Noir & White", "Vibrant Pop", "Muted Earth"];
const ART_STYLES = ["Cinematic", "Anime", "Oil Painting", "Pencil Sketch", "Cyberpunk", "Surrealism", "Hyper-realistic"];

const App: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<'home' | 'about' | 'how-to' | 'contact'>('home');
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const saveApiKey = (key: string) => {
    localStorage.setItem('gemini_api_key', key);
    setApiKey(key);
    setShowApiKeyModal(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          const newItem: ImageItem = {
            id: Math.random().toString(36).substr(2, 9),
            file,
            preview: URL.createObjectURL(file),
            base64,
            mimeType: file.type,
            status: 'idle',
          };
          setImages(prev => [...prev, newItem]);
        };
        reader.readAsDataURL(file);
      });
    }
    e.target.value = '';
  };

  const processItem = async (id: string) => {
    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }

    const item = images.find(img => img.id === id);
    if (!item || item.status === 'loading') return;

    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, status: 'loading', error: undefined } : img
    ));

    try {
      const data = await analyzeImage(item.base64, item.mimeType, apiKey, item.selectedColor, item.selectedStyle);
      setImages(prev => prev.map(img => 
        img.id === id ? { ...img, status: 'completed', result: data } : img
      ));
    } catch (err: any) {
      console.error("Gemini Error:", err);
      setImages(prev => prev.map(img => 
        img.id === id ? { ...img, status: 'error', error: err.message || 'Failed to analyze' } : img
      ));
    }
  };

  const processAll = async () => {
    const pending = images.filter(img => img.status === 'idle' || img.status === 'error');
    if (pending.length === 0) return;
    
    setGlobalLoading(true);
    await Promise.all(pending.map(img => processItem(img.id)));
    setGlobalLoading(false);
  };

  const removeItem = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      const removed = prev.find(img => img.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return filtered;
    });
  };

  const updateRefinement = (id: string, type: 'color' | 'style', value: string) => {
    setImages(prev => prev.map(img => {
      if (img.id !== id) return img;
      return {
        ...img,
        [type === 'color' ? 'selectedColor' : 'selectedStyle']: img[type === 'color' ? 'selectedColor' : 'selectedStyle'] === value ? undefined : value
      };
    }));
  };

  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(err => {
        console.error("Failed to use Clipboard API:", err);
        fallbackCopyTextToClipboard(text);
      });
    } else {
      fallbackCopyTextToClipboard(text);
    }
  };

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden text-neutral-200">
      {/* Navigation Bar */}
      <nav className="border-b border-brand-muted/20 bg-black/90 backdrop-blur-xl shrink-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-accent flex items-center justify-center text-black font-black">
              <i className="fa-solid fa-camera"></i>
            </div>
            <span className="text-xl font-bold tracking-tight text-brand-white hover:text-brand-accent transition-colors cursor-pointer">
              Lens2Prompt
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => setCurrentRoute('home')}
              className={`text-sm font-semibold transition-colors ${currentRoute === 'home' ? 'text-brand-accent' : 'text-brand-muted hover:text-brand-white'}`}>
              Home
            </button>
            <button 
              onClick={() => setCurrentRoute('about')}
              className={`text-sm font-semibold transition-colors ${currentRoute === 'about' ? 'text-brand-accent' : 'text-brand-muted hover:text-brand-white'}`}>
              About
            </button>
            <button 
              onClick={() => setCurrentRoute('how-to')}
              className={`text-sm font-semibold transition-colors ${currentRoute === 'how-to' ? 'text-brand-accent' : 'text-brand-muted hover:text-brand-white'}`}>
              How to Use
            </button>
            <button 
              onClick={() => setCurrentRoute('contact')}
              className={`text-sm font-semibold transition-colors ${currentRoute === 'contact' ? 'text-brand-accent' : 'text-brand-muted hover:text-brand-white'}`}>
              Contact Us
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowApiKeyModal(true)}
              className="text-[11px] font-bold text-brand-muted hover:text-brand-white transition-colors flex items-center gap-2 bg-brand-muted/10 px-3 py-1.5 rounded-lg border border-brand-muted/20 hover:border-brand-accent/50">
              <i className="fa-solid fa-key text-brand-accent"></i>
              {apiKey ? 'API Key Configured' : 'Set API Key'}
            </button>
          </div>
        </div>
      </nav>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-brand-base/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-brand-surface border border-brand-muted/20 p-8 rounded-3xl max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => setShowApiKeyModal(false)}
              className="absolute top-6 right-6 text-brand-muted/70 hover:text-brand-white transition-colors">
              <i className="fa-solid fa-times text-xl"></i>
            </button>
            <div className="w-12 h-12 rounded-xl bg-brand-accent/20 text-brand-accent flex items-center justify-center text-xl mb-6 border border-brand-accent/50">
              <i className="fa-solid fa-key"></i>
            </div>
            <h3 className="text-2xl font-black text-brand-white mb-2">Configure API Key</h3>
            <p className="text-brand-muted text-sm mb-6">
              Lens2Prompt runs directly in your browser. To generate prompts, you need to provide your own Google Gemini API key. Your key is saved locally and never sent to our servers.
            </p>
            <form onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.elements.namedItem('geminiKey') as HTMLInputElement;
                saveApiKey(input.value);
              }}>
              <input 
                type="password" 
                id="geminiKey"
                name="geminiKey"
                defaultValue={apiKey}
                placeholder="AIzaSy..." 
                className="w-full bg-brand-base/50 border border-brand-muted/20 rounded-xl px-4 py-3 text-brand-white focus:outline-none focus:border-brand-accent transition-colors mb-4 placeholder:text-neutral-600 font-mono text-sm"
              />
              <button 
                type="submit"
                className="w-full bg-brand-accent hover:bg-brand-accent text-brand-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-brand-accent/20">
                Save Key & Continue
              </button>
            </form>
            <div className="mt-6 text-center">
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-brand-accent hover:text-brand-accent font-medium underline underline-offset-2">
                Get a free API key from Google AI Studio
              </a>
            </div>
          </div>
        </div>
      )}

      {currentRoute === 'home' && (
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 flex flex-col min-h-0 overflow-hidden">
        {images.length === 0 && (
          <header className="text-center mb-6 shrink-0 space-y-2">
            <h1 className="text-5xl font-black tracking-tighter">
              <span className="text-transparent bg-clip-text bg-brand-accent">
                Lens2Prompt
              </span>
            </h1>
            <p className="text-brand-muted text-lg font-medium max-w-2xl mx-auto">
              Deconstruct visual aesthetics and <span className="text-brand-accent">re-imagine</span> them with custom styles.
            </p>
          </header>
        )}

        <main className="flex-1 flex flex-col min-h-0 gap-4 relative">
          {/* Dark Upload Zone */}
          <section className={`shrink-0 transition-all duration-500 relative ${images.length > 0 ? 'h-20' : 'flex-1 flex flex-col items-center justify-center'}`}>
            <label className={`group w-full h-full bg-brand-base/60 backdrop-blur-md border border-dashed border-brand-muted/40 hover:border-brand-accent/50 rounded-2xl flex cursor-pointer hover:bg-brand-accent/5 transition-all shadow-lg ${images.length > 0 ? 'flex-row items-center px-6' : 'flex-col items-center justify-center'}`}>
              <div className={`bg-brand-accent/10 rounded-full flex items-center justify-center text-brand-accent transition-all group-hover:scale-110 group-hover:bg-brand-accent/20 ${images.length > 0 ? 'w-10 h-10 text-lg mr-4' : 'w-20 h-20 text-3xl mb-4'}`}>
                <i className="fa-solid fa-cloud-arrow-up"></i>
              </div>
              <div className={`flex flex-col ${images.length > 0 ? 'text-left' : 'text-center'}`}>
                <span className={`${images.length > 0 ? 'text-lg' : 'text-2xl'} font-bold text-slate-200`}>Upload your image</span>
                <span className="text-brand-muted font-medium tracking-wide uppercase text-[10px]">Multi-selection enabled • JPG • PNG • WEBP</span>
              </div>
              <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} />
            </label>
            
            {images.length > 0 && images.some(i => i.status !== 'completed') && (
               <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
                  <button
                    onClick={processAll}
                    disabled={globalLoading}
                    className="bg-brand-accent hover:bg-brand-accent text-brand-white px-6 py-2.5 rounded-xl font-black text-xs flex items-center gap-3 shadow-[0_0_20px_rgba(249,115,22,0.3)] disabled:opacity-30 disabled:shadow-none transition-all hover:scale-[1.02] active:scale-95"
                  >
                    {globalLoading ? <i className="fa-solid fa-sync animate-spin text-sm"></i> : <i className="fa-solid fa-wand-sparkles text-sm"></i>}
                    Synthesize ({images.filter(i => i.status !== 'completed').length})
                  </button>
               </div>
            )}
          </section>

          {/* Workspace Area */}
          {images.length > 0 && (
            <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-2 space-y-4">
              {images.map((item) => (
                <div key={item.id} className="group bg-brand-surface/80 backdrop-blur-2xl rounded-[2rem] border border-brand-muted/20 overflow-hidden flex flex-row h-full max-h-[80vh] shadow-xl">
                  {/* Image Panel */}
                  <div className="w-1/3 shrink-0 relative overflow-hidden bg-brand-base flex items-center justify-center group/img">
                    <img src={item.preview} alt="Input" className="w-full h-full object-cover opacity-80 group-hover/img:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-40"></div>
                    
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="absolute top-4 left-4 w-8 h-8 bg-black/60 backdrop-blur-xl text-brand-white rounded-xl flex items-center justify-center hover:bg-red-500 transition-all hover:rotate-90 z-20 text-xs shadow-lg"
                    >
                      <i className="fa-solid fa-times"></i>
                    </button>

                    {item.status === 'idle' && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 z-10 bg-black/40 backdrop-blur-sm">
                        <button 
                          onClick={() => processItem(item.id)}
                          className="bg-brand-accent text-brand-white px-6 py-3 rounded-xl font-black shadow-xl hover:scale-105 transition-transform text-sm"
                        >
                          Extract Aesthetic
                        </button>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-brand-muted/20 z-10 shadow-lg">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        item.status === 'completed' ? 'bg-brand-accent animate-pulse' : 
                        item.status === 'loading' ? 'bg-amber-400 animate-spin' : 
                        item.status === 'error' ? 'bg-red-400' : 'bg-neutral-500'
                      }`}></div>
                      <span className="text-[9px] uppercase font-black tracking-widest text-brand-muted">
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* Analysis Panel */}
                  <div className="flex-1 p-6 flex flex-col justify-start overflow-y-auto bg-gradient-to-br from-transparent to-white/[0.02]">
                    {item.status === 'loading' && (
                      <div className="flex flex-col items-center justify-center h-full space-y-6 w-full max-w-sm mx-auto">
                        <div className="w-16 h-16 bg-brand-accent/10 rounded-2xl flex items-center justify-center border border-brand-accent/30 shadow-[0_0_20px_rgba(255,163,26,0.2)]">
                          <i className="fa-solid fa-wand-magic-sparkles text-brand-accent text-2xl animate-pulse"></i>
                        </div>
                        
                        <div className="w-full space-y-2">
                          <div className="flex justify-between items-end px-1">
                            <span className="font-black text-brand-white tracking-widest text-[10px] uppercase">Synthesizing</span>
                            <span className="text-brand-accent text-[9px] font-bold animate-pulse tracking-wider">PROCESSING</span>
                          </div>
                          <div className="w-full h-1.5 bg-brand-base rounded-full overflow-hidden border border-brand-muted/20 relative shadow-inner">
                            <div className="absolute top-0 bottom-0 left-0 w-2/3 bg-gradient-to-r from-transparent via-brand-accent to-transparent" 
                                 style={{ animation: 'shimmerSweep 1.5s infinite linear' }}>
                            </div>
                            <style>{`@keyframes shimmerSweep { 0% { transform: translateX(-150%); } 100% { transform: translateX(150%); } }`}</style>
                          </div>
                        </div>
                        <p className="text-brand-muted text-[9px] tracking-widest uppercase text-center mt-2">
                          Analyzing visual semantics...
                        </p>
                      </div>
                    )}

                    {item.status === 'error' && (
                      <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <i className="fa-solid fa-bolt-slash text-red-500/50 text-6xl"></i>
                        <p className="text-sm font-bold text-red-400 text-center">{item.error}</p>
                        <button onClick={() => processItem(item.id)} className="bg-red-500/10 text-red-400 px-6 py-2 rounded-xl font-bold hover:bg-red-500/20 text-xs">Retry Computation</button>
                      </div>
                    )}

                    {item.status === 'idle' && !item.result && (
                      <div className="flex flex-col items-center justify-center h-full text-brand-muted/20 space-y-4">
                        <i className="fa-solid fa-fingerprint text-[6rem]"></i>
                        <p className="font-black uppercase tracking-[0.3em] text-[10px]">Awaiting Signal</p>
                      </div>
                    )}

                    {item.result && (
                      <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col h-full space-y-4 pt-4">
                        <div className="flex justify-between items-start shrink-0">
                          <div>
                            <h3 className="text-[10px] font-black text-brand-accent uppercase tracking-widest mb-1">Neural Output</h3>
                            <p className="text-xl font-black text-brand-white tracking-tight">Refined Prompt</p>
                          </div>
                          <button 
                            onClick={() => copyToClipboard(item.result!.prompt)}
                            className="w-10 h-10 bg-brand-base text-brand-muted rounded-xl hover:bg-brand-accent hover:text-black transition-all hover:scale-105 active:scale-95 shadow-md border border-brand-muted/20 flex items-center justify-center"
                            title="Copy Prompt"
                          >
                            <i className="fa-regular fa-copy text-lg"></i>
                          </button>
                        </div>
                        
                        <div className="bg-brand-base/60 p-4 rounded-2xl border border-brand-muted/20 relative group hover:border-brand-muted transition-colors flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-brand-muted/30 scrollbar-track-transparent">
                          <p className="text-sm text-brand-muted leading-relaxed font-medium">
                            {item.result.prompt}
                          </p>
                        </div>

                        <div className="space-y-3 shrink-0">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[9px] font-black uppercase text-brand-muted/70 tracking-widest mb-2"><i className="fa-solid fa-palette text-brand-accent"></i> Overlay Theme</p>
                              <div className="flex flex-wrap gap-1.5">
                                {COLOR_THEMES.slice(0, 4).map(theme => (
                                  <button key={theme} onClick={() => updateRefinement(item.id, 'color', theme)} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${item.selectedColor === theme ? 'bg-brand-accent text-black border-brand-accent' : 'bg-brand-base text-brand-muted border-brand-muted/20 hover:border-brand-accent/50'}`}>{theme}</button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-[9px] font-black uppercase text-brand-muted/70 tracking-widest mb-2"><i className="fa-solid fa-brush text-brand-accent"></i> Style Bias</p>
                              <div className="flex flex-wrap gap-1.5">
                                {ART_STYLES.slice(0, 4).map(style => (
                                  <button key={style} onClick={() => updateRefinement(item.id, 'style', style)} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${item.selectedStyle === style ? 'bg-brand-accent text-black border-brand-accent' : 'bg-brand-base text-brand-muted border-brand-muted/20 hover:border-brand-accent/50'}`}>{style}</button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {(item.selectedColor || item.selectedStyle) && (
                            <button onClick={() => processItem(item.id)} className="w-full bg-brand-accent/10 border border-brand-accent/30 text-brand-accent py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-brand-accent hover:text-black transition-all">
                              <i className="fa-solid fa-wand-magic-sparkles mr-2"></i> Regenerate
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
      )}

      {currentRoute === 'about' && (
        <div className="flex-1 overflow-y-auto px-4 py-8 flex items-center justify-center">
          <div className="max-w-3xl w-full bg-brand-surface/50 backdrop-blur-2xl rounded-3xl border border-brand-muted/20 p-8 md:p-10 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-brand-accent flex items-center justify-center text-black text-2xl mb-6 shadow-[0_0_30px_rgba(249,115,22,0.3)]">
              <i className="fa-solid fa-bolt"></i>
            </div>
            
            <h2 className="text-4xl font-black tracking-tighter text-brand-white mb-6">
              What is <span className="text-brand-accent">Lens2Prompt</span>?
            </h2>
            
            <div className="space-y-6 text-sm text-brand-muted leading-relaxed font-medium">
              <p>Lens2Prompt is an advanced AI-powered aesthetic extraction engine to bridge visual inspiration and generative reproduction.</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-brand-base/60 p-5 rounded-2xl border border-brand-muted/20">
                  <i className="fa-solid fa-eye text-brand-accent text-xl mb-3"></i>
                  <h3 className="text-base font-bold text-brand-white mb-1">1. Visual Analysis</h3>
                  <p className="text-[11px] text-brand-muted">Deconstructs core elements: lighting, composition, subject, and medium.</p>
                </div>
                <div className="bg-brand-base/60 p-5 rounded-2xl border border-brand-muted/20">
                  <i className="fa-solid fa-wand-magic-sparkles text-brand-accent text-xl mb-3"></i>
                  <h3 className="text-base font-bold text-brand-white mb-1">2. Prompt Synthesis</h3>
                  <p className="text-[11px] text-brand-muted">Translates visual data into highly detailed text prompts.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentRoute === 'how-to' && (
        <div className="flex-1 overflow-y-auto px-4 py-8 flex items-center justify-center">
          <div className="max-w-3xl w-full bg-brand-surface/50 backdrop-blur-2xl rounded-3xl border border-brand-muted/20 p-8 shadow-2xl flex flex-col items-center">
            <h2 className="text-3xl font-black text-brand-white mb-8 text-center">
              How to Use <span className="text-brand-accent">Lens2Prompt</span>
            </h2>
            <div className="relative w-full max-w-xl">
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-brand-accent to-transparent z-0 hidden md:block"></div>
              
              <div className="space-y-6 relative z-10 w-full">
                {[{ num: 1, icon: 'fa-key', title: 'Configure API Key', desc: 'Click "Set API Key" to use your own Gemini quota.' },
                  { num: 2, icon: 'fa-upload', title: 'Upload Images', desc: 'Drag internal inspiration files to the dashed box.' },
                  { num: 3, icon: 'fa-sliders', title: 'Synthesize', desc: 'Set themes and styles, then click process.' },
                  { num: 4, icon: 'fa-copy', title: 'Copy Prompts', desc: 'Copy outputs for Midjourney or Stable Diffusion.' }].map(step => (
                  <div key={step.num} className="flex gap-6 items-center group">
                    <div className="w-10 h-10 rounded-full bg-brand-base text-brand-accent flex items-center justify-center font-black text-sm border-2 border-brand-accent shrink-0 relative z-10 mx-auto md:mx-0 shadow-[0_0_10px_rgba(255,163,26,0.5)]">
                      {step.num}
                    </div>
                    <div className="bg-brand-muted/10 border border-brand-muted/20 rounded-2xl p-4 flex-1">
                      <h3 className="text-sm font-bold text-brand-white mb-1 flex items-center gap-2">
                        <i className={`fa-solid ${step.icon} text-brand-accent`}></i> {step.title}
                      </h3>
                      <p className="text-brand-muted/70 text-xs">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {currentRoute === 'contact' && (
        <div className="flex-1 flex items-center justify-center px-4 overflow-hidden">
          <div className="text-center space-y-4">
            <i className="fa-solid fa-envelope-open-text text-6xl text-brand-accent opacity-50 mb-2"></i>
            <h2 className="text-3xl font-black text-brand-white">Get in Touch</h2>
            <p className="text-sm text-brand-muted max-w-sm mx-auto">Have questions, feedback, or need support? Reach out to us.</p>
            <p className="text-lg font-bold text-brand-accent">hello@lens2prompt.labs</p>
          </div>
        </div>
      )}

      <footer className="shrink-0 h-12 border-t border-brand-muted/20 flex items-center justify-between px-6 bg-black z-50 relative">
        <div className="flex gap-6 text-neutral-600 text-lg">
          <a href="https://github.com/nurangakaushalya" target="_blank" rel="noopener noreferrer">
            <i className="fa-brands fa-github hover:text-brand-white transition-all"></i>
          </a>
          <a href="https://www.linkedin.com/in/nuranga-kaushalya-5476622ba/" target="_blank" rel="noopener noreferrer">
            <i className="fa-brands fa-linkedin hover:text-[#0077b5] transition-all"></i>
          </a>
        </div>
        <p className="text-brand-muted/50 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hidden md:flex">
          Developed by <span className="text-brand-accent">Nuranga Kaushalya</span> © 2026
        </p>
      </footer>
    </div>
  );
};

const CompactAttr: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-brand-muted/10 px-4 py-3 rounded-2xl border border-brand-muted/20">
    <span className="block text-[8px] uppercase font-black text-brand-muted/70 mb-1 tracking-widest">{label}</span>
    <span className="block text-[10px] font-bold text-brand-muted truncate tracking-wide">{value}</span>
  </div>
);

export default App;
