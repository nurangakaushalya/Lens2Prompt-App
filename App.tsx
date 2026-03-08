
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
    <div className="min-h-screen bg-black">
      {/* Navigation Bar */}
      <nav className="border-b border-brand-muted/20 bg-black/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-accent flex items-center justify-center text-black font-black">
              <i className="fa-solid fa-camera"></i>
            </div>
            <span className="text-xl font-bold tracking-tight text-brand-white hover:text-brand-accent transition-colors cursor-pointer">
              Lens2Prompt
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
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
              className="text-sm font-bold text-brand-muted hover:text-brand-white transition-colors flex items-center gap-2 bg-brand-muted/10 px-4 py-2 rounded-xl border border-brand-muted/20 hover:border-brand-accent/50">
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
      <div className="max-w-6xl mx-auto px-4 py-16">
        <header className="text-center mb-16 space-y-4">
          <h1 className="text-7xl font-black tracking-tighter">
            <span className="text-transparent bg-clip-text bg-brand-accent">
              Lens2Prompt
            </span>
          </h1>
        <p className="text-brand-muted text-xl font-medium max-w-2xl mx-auto">
          Deconstruct visual aesthetics and <span className="text-brand-accent">re-imagine</span> them with custom styles.
        </p>
      </header>

      <main className="space-y-16">
        {/* Dark Upload Zone */}
        <section className="relative">
          <label className="group block w-full bg-brand-base/60 backdrop-blur-md border-2 border-dashed border-neutral-800 rounded-[2.5rem] p-16 text-center cursor-pointer hover:border-brand-accent/50 hover:bg-brand-accent/5 transition-all duration-500 shadow-2xl">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-brand-accent/10 rounded-full flex items-center justify-center text-brand-accent mb-6 group-hover:scale-110 group-hover:bg-brand-accent/20 transition-all duration-500">
                <i className="fa-solid fa-cloud-arrow-up text-4xl"></i>
              </div>
              <span className="text-2xl font-bold text-slate-200 mb-2">Upload your image</span>
              <span className="text-slate-500 font-medium tracking-wide uppercase text-xs">Multi-selection enabled • JPG • PNG • WEBP</span>
            </div>
            <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} />
          </label>
          
          {images.length > 0 && images.some(i => i.status !== 'completed') && (
             <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 z-10">
                <button
                  onClick={processAll}
                  disabled={globalLoading}
                  className="bg-brand-accent hover:bg-brand-accent text-brand-white px-10 py-5 rounded-2xl font-black text-lg flex items-center gap-4 shadow-[0_0_40px_rgba(249,115,22,0.3)] disabled:opacity-30 disabled:shadow-none transition-all hover:scale-105 active:scale-95"
                >
                  {globalLoading ? <i className="fa-solid fa-sync animate-spin"></i> : <i className="fa-solid fa-wand-sparkles"></i>}
                  Synthesize Queue ({images.filter(i => i.status !== 'completed').length})
                </button>
             </div>
          )}
        </section>

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 gap-12 pt-10">
          {images.map((item) => (
            <div key={item.id} className="group bg-brand-surface/50 backdrop-blur-2xl rounded-[3rem] border border-brand-muted/20 overflow-hidden flex flex-col lg:flex-row min-h-[500px] shadow-2xl hover:border-brand-muted/20 transition-all duration-500">
              {/* Image Panel */}
              <div className="lg:w-2/5 relative overflow-hidden bg-brand-base flex items-center justify-center group/img">
                <img src={item.preview} alt="Input" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                
                <button 
                  onClick={() => removeItem(item.id)}
                  className="absolute top-6 left-6 w-12 h-12 bg-brand-base/60 backdrop-blur-xl text-brand-white rounded-2xl flex items-center justify-center hover:bg-red-500/80 transition-all hover:rotate-90 z-20"
                >
                  <i className="fa-solid fa-plus rotate-45"></i>
                </button>

                {item.status === 'idle' && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 z-10">
                    <button 
                      onClick={() => processItem(item.id)}
                      className="bg-white text-black px-8 py-4 rounded-2xl font-black shadow-2xl hover:bg-brand-accent hover:text-brand-white transition-colors"
                    >
                      Extract Aesthetic
                    </button>
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-brand-base/40 backdrop-blur-md px-4 py-2 rounded-full border border-brand-muted/20 z-10">
                  <div className={`w-2 h-2 rounded-full ${
                    item.status === 'completed' ? 'bg-brand-accent animate-pulse' : 
                    item.status === 'loading' ? 'bg-amber-400 animate-spin' : 
                    item.status === 'error' ? 'bg-red-400' : 'bg-neutral-500'
                  }`}></div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-brand-muted">
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Analysis & Refinement Panel */}
              <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center bg-gradient-to-br from-transparent to-white/[0.02]">
                {item.status === 'loading' && (
                  <div className="flex flex-col items-center justify-center h-full space-y-6 py-20">
                    <div className="relative">
                       <div className="w-24 h-24 border-b-4 border-brand-accent rounded-full animate-spin"></div>
                       <div className="absolute inset-0 flex items-center justify-center">
                          <i className="fa-solid fa-brain text-brand-accent text-2xl animate-pulse"></i>
                       </div>
                    </div>
                    <p className="font-black text-slate-500 uppercase tracking-[0.4em] text-xs">Decoding Latent Space...</p>
                  </div>
                )}

                {item.status === 'error' && (
                  <div className="text-center p-10 space-y-6">
                    <div className="text-red-500/20 text-8xl">
                      <i className="fa-solid fa-bolt-slash"></i>
                    </div>
                    <p className="text-xl font-bold text-red-400">{item.error}</p>
                    <button onClick={() => processItem(item.id)} className="bg-red-500/10 text-red-400 px-8 py-3 rounded-2xl font-bold hover:bg-red-500/20 transition-all">Retry Computation</button>
                  </div>
                )}

                {item.status === 'idle' && !item.result && (
                  <div className="flex flex-col items-center justify-center h-full text-slate-800 space-y-6">
                    <i className="fa-solid fa-fingerprint text-[10rem] opacity-20"></i>
                    <p className="font-black uppercase tracking-[0.3em] text-sm opacity-30">Awaiting Neural Signature</p>
                  </div>
                )}

                {item.result && (
                  <div className="animate-in fade-in zoom-in-95 duration-700 flex flex-col h-full space-y-8">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xs font-black text-brand-accent uppercase tracking-[0.4em] mb-2">Neural Output</h3>
                        <p className="text-3xl font-black text-brand-white tracking-tight">Refined Prompt</p>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(item.result!.prompt)}
                        className="w-16 h-16 bg-neutral-800 text-brand-muted rounded-[1.5rem] hover:bg-brand-accent hover:text-brand-white transition-all hover:scale-110 active:scale-95 shadow-xl border border-brand-muted/20"
                        title="Copy Prompt"
                      >
                        <i className="fa-regular fa-copy text-2xl"></i>
                      </button>
                    </div>
                    
                    {/* Prompt Box */}
                    <div className="bg-brand-base/40 p-8 rounded-[2.5rem] border border-brand-muted/20 relative group hover:border-brand-muted/20 transition-colors">
                      <p className="text-xl text-brand-muted leading-relaxed font-medium">
                        {item.result.prompt}
                      </p>
                      <div className="absolute -top-4 -right-4 bg-neutral-800 px-4 py-1 rounded-full text-[10px] font-black text-brand-muted/70 border border-brand-muted/20 uppercase tracking-widest">
                        Ready to Generate
                      </div>
                    </div>

                    {/* Refinement Controls */}
                    <div className="space-y-6">
                      <div>
                        <p className="text-[10px] font-black uppercase text-brand-muted/70 tracking-widest mb-3 flex items-center gap-2">
                          <i className="fa-solid fa-palette text-brand-accent"></i> Inject Color Theme
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {COLOR_THEMES.map(theme => (
                            <button 
                              key={theme}
                              onClick={() => updateRefinement(item.id, 'color', theme)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                item.selectedColor === theme 
                                ? 'bg-brand-accent text-brand-white border-brand-accent shadow-[0_0_15px_rgba(249,115,22,0.4)]' 
                                : 'bg-neutral-800/40 text-brand-muted border-brand-muted/20 hover:bg-neutral-800'
                              }`}
                            >
                              {theme}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-black uppercase text-brand-muted/70 tracking-widest mb-3 flex items-center gap-2">
                          <i className="fa-solid fa-brush text-brand-accent"></i> Overlay Art Style
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {ART_STYLES.map(style => (
                            <button 
                              key={style}
                              onClick={() => updateRefinement(item.id, 'style', style)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                item.selectedStyle === style 
                                ? 'bg-amber-600 text-brand-white border-brand-accent shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                                : 'bg-neutral-800/40 text-brand-muted border-brand-muted/20 hover:bg-neutral-800'
                              }`}
                            >
                              {style}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => processItem(item.id)}
                        className="w-full bg-brand-accent text-brand-white py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-lg hover:shadow-brand-accent/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                      >
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                        Regenerate with Selections
                      </button>
                    </div>

                    {/* Metadata Badges */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-brand-muted/20">
                      <CompactAttr label="Style" value={item.result.metadata.style} />
                      <CompactAttr label="Subject" value={item.result.metadata.subject} />
                      <CompactAttr label="Light" value={item.result.metadata.lighting} />
                      <CompactAttr label="View" value={item.result.metadata.composition} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {images.length === 0 && (
          <div className="text-center py-32 opacity-10 grayscale">
            <i className="fa-solid fa-images text-[14rem] mb-8"></i>
            <p className="text-3xl font-black tracking-[0.5em] uppercase">No Inspiration Loaded</p>
          </div>
        )}
      </main>
      </div>
      )}

      {currentRoute === 'about' && (
        <div className="max-w-4xl mx-auto px-4 py-24 min-h-[70vh]">
          <div className="bg-brand-surface/50 backdrop-blur-2xl rounded-[3rem] border border-brand-muted/20 p-12 md:p-16 shadow-2xl">
            <div className="w-20 h-20 rounded-2xl bg-brand-accent flex items-center justify-center text-brand-white text-3xl mb-10 shadow-[0_0_30px_rgba(249,115,22,0.3)]">
              <i className="fa-solid fa-bolt"></i>
            </div>
            
            <h2 className="text-5xl font-black tracking-tighter text-brand-white mb-8">
              What is <span className="text-transparent bg-clip-text bg-brand-accent">Lens2Prompt</span>?
            </h2>
            
            <div className="space-y-8 text-lg text-brand-muted leading-relaxed font-medium">
              <p>
                Lens2Prompt is an advanced AI-powered aesthetic extraction engine. We built this tool to bridge the gap between visual inspiration and generative reproduction. 
              </p>
              
              <div className="grid md:grid-cols-2 gap-8 my-12">
                <div className="bg-brand-base/40 p-8 rounded-3xl border border-brand-muted/20">
                  <i className="fa-solid fa-eye text-brand-accent text-2xl mb-4"></i>
                  <h3 className="text-xl font-bold text-brand-white mb-2">1. Visual Analysis</h3>
                  <p className="text-sm text-brand-muted">Upload any image and our neural networks deconstruct its core elements: lighting, composition, subject, and medium.</p>
                </div>
                <div className="bg-brand-base/40 p-8 rounded-3xl border border-brand-muted/20">
                  <i className="fa-solid fa-wand-magic-sparkles text-brand-accent text-2xl mb-4"></i>
                  <h3 className="text-xl font-bold text-brand-white mb-2">2. Prompt Synthesis</h3>
                  <p className="text-sm text-brand-muted">We translate visual data into highly detailed text prompts optimized for models like Midjourney or Stable Diffusion.</p>
                </div>
              </div>

              <p>
                Whether you want to replicate a specific photography style, transform a sketch into a cyberpunk masterpiece, or just find the perfect words to describe a vibe, Lens2Prompt handles the complex prompt engineering for you.
              </p>
            </div>
            
            <div className="mt-16 pt-8 border-t border-brand-muted/20">
              <button 
                onClick={() => setCurrentRoute('home')}
                className="bg-white text-black px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-brand-accent hover:text-brand-white transition-all transform hover:-translate-y-1">
                Try it out now <i className="fa-solid fa-arrow-right ml-2"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {currentRoute === 'how-to' && (
        <div className="max-w-4xl mx-auto px-4 py-24 min-h-[70vh]">
          <div className="bg-brand-surface/50 backdrop-blur-2xl rounded-[3rem] border border-brand-muted/20 p-12 md:p-16 shadow-2xl">
            <h2 className="text-4xl font-black text-brand-white mb-12 text-center">
              How to Use <span className="text-transparent bg-clip-text bg-brand-accent">Lens2Prompt</span>
            </h2>
            <div className="relative mt-16 max-w-2xl mx-auto">
              {/* Vertical connecting line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-500 via-amber-500 to-transparent z-0 hidden md:block"></div>
              
              <div className="space-y-16 relative z-10">
                <div className="flex gap-8 items-start group">
                  <div className="w-12 h-12 rounded-full bg-brand-surface text-brand-accent flex items-center justify-center font-black text-xl flex-shrink-0 border-2 border-brand-accent shadow-[0_0_15px_rgba(249,115,22,0.5)] group-hover:scale-110 group-hover:bg-brand-accent group-hover:text-brand-white transition-all z-10 relative md:ml-0 mx-auto md:mx-0">
                    1
                  </div>
                  <div className="bg-brand-muted/10 border border-brand-muted/20 rounded-3xl p-8 flex-grow group-hover:border-brand-accent/50 transition-colors">
                    <h3 className="text-2xl font-black text-brand-white mb-3 flex items-center gap-3">
                      <i className="fa-solid fa-key text-brand-accent"></i> Configure API Key
                    </h3>
                    <p className="text-brand-muted leading-relaxed text-sm">Before starting, click "Set API Key" in the top right. Paste your Google Gemini API key to securely allow the app to generate prompts locally.</p>
                  </div>
                </div>

                <div className="flex gap-8 items-start group">
                  <div className="w-12 h-12 rounded-full bg-brand-surface text-brand-accent flex items-center justify-center font-black text-xl flex-shrink-0 border-2 border-brand-accent shadow-[0_0_15px_rgba(249,115,22,0.5)] group-hover:scale-110 group-hover:bg-brand-accent group-hover:text-brand-white transition-all z-10 relative md:ml-0 mx-auto md:mx-0">
                    2
                  </div>
                  <div className="bg-brand-muted/10 border border-brand-muted/20 rounded-3xl p-8 flex-grow group-hover:border-brand-accent/50 transition-colors">
                    <h3 className="text-2xl font-black text-brand-white mb-3 flex items-center gap-3">
                      <i className="fa-solid fa-upload text-brand-accent"></i> Upload Images
                    </h3>
                    <p className="text-brand-muted leading-relaxed text-sm">Drag and drop your visual inspiration into the dashed upload area, or click to select files. You can queue up multiple images simultaneously.</p>
                  </div>
                </div>

                <div className="flex gap-8 items-start group">
                  <div className="w-12 h-12 rounded-full bg-brand-surface text-brand-accent flex items-center justify-center font-black text-xl flex-shrink-0 border-2 border-brand-accent shadow-[0_0_15px_rgba(245,158,11,0.5)] group-hover:scale-110 group-hover:bg-brand-accent group-hover:text-brand-white transition-all z-10 relative md:ml-0 mx-auto md:mx-0">
                    3
                  </div>
                  <div className="bg-brand-muted/10 border border-brand-muted/20 rounded-3xl p-8 flex-grow group-hover:border-brand-accent/50 transition-colors">
                    <h3 className="text-2xl font-black text-brand-white mb-3 flex items-center gap-3">
                      <i className="fa-solid fa-sliders text-brand-accent"></i> Customize & Synthesize
                    </h3>
                    <p className="text-brand-muted leading-relaxed text-sm">Select optional Color Themes and Art Styles to guide the AI. Click "Synthesize Queue" to process all images, or generate them individually.</p>
                  </div>
                </div>

                <div className="flex gap-8 items-start group">
                  <div className="w-12 h-12 rounded-full bg-brand-surface text-brand-accent flex items-center justify-center font-black text-xl flex-shrink-0 border-2 border-brand-accent shadow-[0_0_15px_rgba(245,158,11,0.5)] group-hover:scale-110 group-hover:bg-brand-accent group-hover:text-brand-white transition-all z-10 relative md:ml-0 mx-auto md:mx-0">
                    4
                  </div>
                  <div className="bg-brand-muted/10 border border-brand-muted/20 rounded-3xl p-8 flex-grow group-hover:border-brand-accent/50 transition-colors">
                    <h3 className="text-2xl font-black text-brand-white mb-3 flex items-center gap-3">
                      <i className="fa-solid fa-copy text-brand-accent"></i> Copy Prompts
                    </h3>
                    <p className="text-brand-muted leading-relaxed text-sm">Review the highly detailed extracted prompt. Click the copy icon in the corner to instantly copy it to your clipboard for use in Midjourney or Stable Diffusion.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-16 text-center">
              <button 
                onClick={() => setCurrentRoute('home')}
                className="bg-white text-black px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-brand-accent hover:text-brand-white transition-all transform hover:-translate-y-1">
                Start Generating <i className="fa-solid fa-wand-magic-sparkles ml-2"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {currentRoute === 'contact' && (
        <div className="max-w-4xl mx-auto px-4 py-24 min-h-[70vh] flex items-center justify-center">
          <div className="text-center space-y-6">
            <i className="fa-solid fa-envelope-open-text text-7xl text-brand-accent mb-4 opacity-50"></i>
            <h2 className="text-4xl font-black text-brand-white">Get in Touch</h2>
            <p className="text-brand-muted max-w-md mx-auto">Have questions, feedback, or need support? Reach out to us.</p>
            <p className="text-xl font-bold text-brand-accent">hello@lens2prompt.labs</p>
          </div>
        </div>
      )}

      <footer className="mt-auto pt-16 pb-8 border-t border-brand-muted/20 flex flex-col items-center gap-8">
        <div className="flex gap-10 text-neutral-600 text-2xl">
          <a href="https://github.com/nurangakaushalya" target="_blank" rel="noopener noreferrer">
            <i className="fa-brands fa-github hover:text-brand-white transition-all cursor-pointer hover:scale-125"></i>
          </a>
          <a href="https://www.linkedin.com/in/nuranga-kaushalya-5476622ba/" target="_blank" rel="noopener noreferrer">
            <i className="fa-brands fa-linkedin hover:text-[#0077b5] transition-all cursor-pointer hover:scale-125"></i>
          </a>
        </div>
        <div className="text-center space-y-2">
          <p className="text-brand-muted/70 text-[10px] font-black tracking-[0.4em] uppercase">
            Developed by <span className="text-transparent bg-clip-text bg-brand-accent">Nuranga Kaushalya</span>
          </p>
          <p className="text-neutral-700 text-[10px] font-medium tracking-widest uppercase">© 2026 Lens2Prompt Labs • All Rights Reserved</p>
        </div>
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
