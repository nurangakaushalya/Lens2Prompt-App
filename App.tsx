
import React, { useState } from 'react';
import { analyzeImage } from './services/geminiService';
import { ImageItem, AnalysisResult } from './types';

// EDIT THIS: Change this to your actual name
const DEVELOPER_NAME = "Your Name";

const COLOR_THEMES = ["Dark Theme", "Light Theme", "Cyber Neon", "Golden Hour", "Pastel Dream", "Noir & White", "Vibrant Pop", "Muted Earth"];
const ART_STYLES = ["Cinematic", "Anime", "Oil Painting", "Pencil Sketch", "Cyberpunk", "Surrealism", "Hyper-realistic"];

const App: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);

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
    const item = images.find(img => img.id === id);
    if (!item || item.status === 'loading') return;

    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, status: 'loading', error: undefined } : img
    ));

    try {
      const data = await analyzeImage(item.base64, item.mimeType, item.selectedColor, item.selectedStyle);
      setImages(prev => prev.map(img => 
        img.id === id ? { ...img, status: 'completed', result: data } : img
      ));
    } catch (err) {
      setImages(prev => prev.map(img => 
        img.id === id ? { ...img, status: 'error', error: 'Failed to analyze' } : img
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <header className="text-center mb-16 space-y-4">
        <h1 className="text-7xl font-black tracking-tighter">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            Lens2Prompt
          </span>
          <span className="ml-4 text-slate-800 text-5xl italic font-light">AI powered</span>
        </h1>
        <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto">
          Deconstruct visual aesthetics and <span className="text-pink-400">re-imagine</span> them with custom styles.
        </p>
      </header>

      <main className="space-y-16">
        {/* Dark Upload Zone */}
        <section className="relative">
          <label className="group block w-full bg-slate-900/40 backdrop-blur-md border-2 border-dashed border-slate-800 rounded-[2.5rem] p-16 text-center cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all duration-500 shadow-2xl">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-500">
                <i className="fa-solid fa-cloud-arrow-up text-4xl"></i>
              </div>
              <span className="text-2xl font-bold text-slate-200 mb-2">Upload visual seeds</span>
              <span className="text-slate-500 font-medium tracking-wide uppercase text-xs">Multi-selection enabled • JPG • PNG • WEBP</span>
            </div>
            <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} />
          </label>
          
          {images.length > 0 && (
             <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 z-10">
                <button
                  onClick={processAll}
                  disabled={globalLoading || !images.some(i => i.status !== 'completed')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-5 rounded-2xl font-black text-lg flex items-center gap-4 shadow-[0_0_40px_rgba(79,70,229,0.3)] disabled:opacity-30 disabled:shadow-none transition-all hover:scale-105 active:scale-95"
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
            <div key={item.id} className="group bg-slate-900/50 backdrop-blur-2xl rounded-[3rem] border border-white/5 overflow-hidden flex flex-col lg:flex-row min-h-[500px] shadow-2xl hover:border-white/10 transition-all duration-500">
              {/* Image Panel */}
              <div className="lg:w-2/5 relative overflow-hidden bg-slate-950 flex items-center justify-center group/img">
                <img src={item.preview} alt="Input" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                
                <button 
                  onClick={() => removeItem(item.id)}
                  className="absolute top-6 left-6 w-12 h-12 bg-black/60 backdrop-blur-xl text-white rounded-2xl flex items-center justify-center hover:bg-red-500/80 transition-all hover:rotate-90 z-20"
                >
                  <i className="fa-solid fa-plus rotate-45"></i>
                </button>

                {item.status === 'idle' && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 z-10">
                    <button 
                      onClick={() => processItem(item.id)}
                      className="bg-white text-slate-950 px-8 py-4 rounded-2xl font-black shadow-2xl hover:bg-indigo-400 transition-colors"
                    >
                      Extract Aesthetic
                    </button>
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 z-10">
                  <div className={`w-2 h-2 rounded-full ${
                    item.status === 'completed' ? 'bg-emerald-400 animate-pulse' : 
                    item.status === 'loading' ? 'bg-indigo-400 animate-spin' : 
                    item.status === 'error' ? 'bg-red-400' : 'bg-slate-500'
                  }`}></div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-300">
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Analysis & Refinement Panel */}
              <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center bg-gradient-to-br from-transparent to-white/[0.02]">
                {item.status === 'loading' && (
                  <div className="flex flex-col items-center justify-center h-full space-y-6 py-20">
                    <div className="relative">
                       <div className="w-24 h-24 border-b-4 border-pink-500 rounded-full animate-spin"></div>
                       <div className="absolute inset-0 flex items-center justify-center">
                          <i className="fa-solid fa-brain text-pink-400 text-2xl animate-pulse"></i>
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
                        <h3 className="text-xs font-black text-pink-500 uppercase tracking-[0.4em] mb-2">Neural Output</h3>
                        <p className="text-3xl font-black text-white tracking-tight">Refined Prompt</p>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(item.result!.prompt)}
                        className="w-16 h-16 bg-slate-800 text-slate-300 rounded-[1.5rem] hover:bg-pink-600 hover:text-white transition-all hover:scale-110 active:scale-95 shadow-xl border border-white/5"
                        title="Copy Prompt"
                      >
                        <i className="fa-regular fa-copy text-2xl"></i>
                      </button>
                    </div>
                    
                    {/* Prompt Box */}
                    <div className="bg-black/40 p-8 rounded-[2.5rem] border border-white/5 relative group hover:border-white/10 transition-colors">
                      <p className="text-xl text-slate-300 leading-relaxed font-medium">
                        {item.result.prompt}
                      </p>
                      <div className="absolute -top-4 -right-4 bg-slate-800 px-4 py-1 rounded-full text-[10px] font-black text-slate-500 border border-white/5 uppercase tracking-widest">
                        Ready to Generate
                      </div>
                    </div>

                    {/* Refinement Controls */}
                    <div className="space-y-6">
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-3 flex items-center gap-2">
                          <i className="fa-solid fa-palette text-indigo-400"></i> Inject Color Theme
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {COLOR_THEMES.map(theme => (
                            <button 
                              key={theme}
                              onClick={() => updateRefinement(item.id, 'color', theme)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                item.selectedColor === theme 
                                ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]' 
                                : 'bg-slate-800/40 text-slate-400 border-white/5 hover:bg-slate-800'
                              }`}
                            >
                              {theme}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-3 flex items-center gap-2">
                          <i className="fa-solid fa-brush text-purple-400"></i> Overlay Art Style
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {ART_STYLES.map(style => (
                            <button 
                              key={style}
                              onClick={() => updateRefinement(item.id, 'style', style)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                item.selectedStyle === style 
                                ? 'bg-purple-500 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
                                : 'bg-slate-800/40 text-slate-400 border-white/5 hover:bg-slate-800'
                              }`}
                            >
                              {style}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => processItem(item.id)}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-lg hover:shadow-indigo-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                      >
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                        Regenerate with Selections
                      </button>
                    </div>

                    {/* Metadata Badges */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/5">
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

      <footer className="mt-32 pt-16 border-t border-white/5 flex flex-col items-center gap-8">
        <div className="flex gap-10 text-slate-600 text-2xl">
          <i className="fa-brands fa-discord hover:text-indigo-400 transition-all cursor-pointer hover:scale-125"></i>
          <i className="fa-brands fa-github hover:text-white transition-all cursor-pointer hover:scale-125"></i>
          <i className="fa-brands fa-instagram hover:text-pink-400 transition-all cursor-pointer hover:scale-125"></i>
          <i className="fa-brands fa-x-twitter hover:text-slate-100 transition-all cursor-pointer hover:scale-125"></i>
        </div>
        <div className="text-center space-y-2">
          <p className="text-slate-500 text-[10px] font-black tracking-[0.4em] uppercase">
            Developed by <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">Nuranga Kaushalya</span>
          </p>
          <p className="text-slate-700 text-[10px] font-medium tracking-widest uppercase">© 2026 Lens2Prompt Labs • All Rights Reserved</p>
        </div>
      </footer>
    </div>
  );
};

const CompactAttr: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-white/5 px-4 py-3 rounded-2xl border border-white/5">
    <span className="block text-[8px] uppercase font-black text-slate-500 mb-1 tracking-widest">{label}</span>
    <span className="block text-[10px] font-bold text-slate-300 truncate tracking-wide">{value}</span>
  </div>
);

export default App;
