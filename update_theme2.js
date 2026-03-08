const fs = require('fs');
try {
    let content = fs.readFileSync('App.tsx', 'utf8');

    // Header
    content = content.replace(/from-indigo-400 via-purple-400 to-pink-400/g, 'from-orange-600 via-orange-500 to-amber-500');
    content = content.replace(/text-pink-400/g, 'text-orange-500');

    // Upload Zone
    content = content.replace(/bg-slate-900\/40/g, 'bg-black/60');
    content = content.replace(/border-slate-800/g, 'border-neutral-800');
    content = content.replace(/hover:border-indigo-500\/50 hover:bg-indigo-500\/5/g, 'hover:border-orange-500/50 hover:bg-orange-500/5');
    content = content.replace(/bg-indigo-500\/10/g, 'bg-orange-500/10');
    content = content.replace(/text-indigo-400/g, 'text-orange-500');
    content = content.replace(/group-hover:bg-indigo-500\/20/g, 'group-hover:bg-orange-500/20');
    content = content.replace(/bg-indigo-600/g, 'bg-orange-600');
    content = content.replace(/hover:bg-indigo-500/g, 'hover:bg-orange-500');
    content = content.replace(/rgba\(79,70,229,0\.3\)/g, 'rgba(249,115,22,0.3)');

    // Workspace grid overall
    content = content.replace(/bg-slate-900\/50/g, 'bg-neutral-900/50');
    content = content.replace(/bg-slate-950/g, 'bg-black');
    content = content.replace(/from-slate-950/g, 'from-black');
    content = content.replace(/bg-white text-slate-950/g, 'bg-white text-black');
    content = content.replace(/hover:bg-indigo-400/g, 'hover:bg-orange-500 hover:text-white');
    content = content.replace(/bg-emerald-400/g, 'bg-orange-400');
    content = content.replace(/bg-indigo-400 animate-spin/g, 'bg-amber-400 animate-spin');
    content = content.replace(/bg-slate-500/g, 'bg-neutral-500');

    // Loading state
    content = content.replace(/border-pink-500/g, 'border-orange-500');
    content = content.replace(/text-pink-400/g, 'text-orange-400');

    // Refinement outputs
    content = content.replace(/text-pink-500/g, 'text-orange-500');
    content = content.replace(/bg-slate-800/g, 'bg-neutral-800');
    content = content.replace(/text-slate-300/g, 'text-neutral-300');
    content = content.replace(/hover:bg-pink-600/g, 'hover:bg-orange-600');

    // Inject Color Theme
    content = content.replace(/bg-indigo-500 text-white border-indigo-400 shadow-\[0_0_15px_rgba\(99,102,241,0\.4\)\]/g, 'bg-orange-600 text-white border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]');
    content = content.replace(/bg-slate-800\/40 text-slate-400/g, 'bg-neutral-800/40 text-neutral-400');
    content = content.replace(/hover:bg-slate-800/g, 'hover:bg-neutral-800 hover:text-white');

    // Overlay Art Theme
    content = content.replace(/text-purple-400/g, 'text-amber-500');
    content = content.replace(/bg-purple-500 text-white border-purple-400 shadow-\[0_0_15px_rgba\(168,85,247,0\.4\)\]/g, 'bg-amber-600 text-white border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]');

    // Regenerate button
    content = content.replace(/from-indigo-600 to-purple-600/g, 'from-orange-600 to-orange-500');
    content = content.replace(/hover:shadow-indigo-500\/20/g, 'hover:shadow-orange-500/20');

    // Footer
    content = content.replace(/from-indigo-400 to-pink-400/g, 'from-orange-500 to-amber-500');
    content = content.replace(/text-slate-600/g, 'text-neutral-600');
    content = content.replace(/text-slate-500/g, 'text-neutral-500');
    content = content.replace(/text-slate-400/g, 'text-neutral-400');
    content = content.replace(/text-slate-700/g, 'text-neutral-700');
    content = content.replace(/text-slate-800/g, 'text-neutral-800');
    content = content.replace(/text-slate-200/g, 'text-neutral-200');

    fs.writeFileSync('App.tsx', content);
    console.log('SUCCESS');
} catch (e) {
    console.error("ERROR:", e);
    process.exit(1);
}
