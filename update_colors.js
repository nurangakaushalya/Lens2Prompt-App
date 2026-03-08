const fs = require('fs');
const path = require('path');

const appFile = path.join(__dirname, 'App.tsx');
let content = fs.readFileSync(appFile, 'utf8');

// The Goal: Replace default tailwind colors with the new custom brand classes
// 1. Text colors: text-orange-500, text-amber-500, text-white -> text-brand-accent, text-brand-white
// 2. Background colors: bg-black, bg-neutral-900, bg-white/5 -> bg-brand-base, bg-brand-surface
// 3. Borders: border-orange-500, border-white/5, etc.

const replacements = [
    // Backgrounds
    { regex: /bg-black(?!\/)/g, rep: 'bg-brand-base' },
    { regex: /bg-neutral-900(?!\/)/g, rep: 'bg-brand-surface' },
    { regex: /bg-neutral-[89]00\/50/g, rep: 'bg-brand-surface/50' },
    { regex: /bg-white\/5/g, rep: 'bg-brand-muted/10' },

    // Text
    { regex: /text-white/g, rep: 'text-brand-white' },
    { regex: /text-neutral-[234]00/g, rep: 'text-brand-muted' },
    { regex: /text-neutral-500/g, rep: 'text-brand-muted/70' },
    { regex: /text-orange-[456]00/g, rep: 'text-brand-accent' },
    { regex: /text-amber-500/g, rep: 'text-brand-accent' },

    // Gradients (Making gradients solid for now or utilizing accent)
    { regex: /bg-gradient-to-[a-z]+ from-orange-[456]00 (via-orange-[456]00 )?to-[a-z]+-[456]00/g, rep: 'bg-brand-accent' },
    { regex: /bg-gradient-to-[a-z]+ from-orange-[456]00 (via-amber-[456]00 )?to-amber-[456]00/g, rep: 'bg-brand-accent' },

    // Text Gradients
    { regex: /text-transparent bg-clip-text bg-gradient-to-[a-z]+ from-[a-z]+-[456]00 (via-[a-z]+-[456]00 )?to-[a-z]+-[456]00/g, rep: 'text-brand-accent' },

    // Borders
    { regex: /border-white\/[0-9]+/g, rep: 'border-brand-muted/20' },
    { regex: /border-orange-[456]00\/[0-9]+/g, rep: 'border-brand-accent/50' },
    { regex: /border-orange-[456]00/g, rep: 'border-brand-accent' },
    { regex: /border-amber-[456]00\/[0-9]+/g, rep: 'border-brand-accent/50' },
    { regex: /border-amber-[456]00/g, rep: 'border-brand-accent' },

    // Background Accent
    { regex: /bg-orange-[456]00/g, rep: 'bg-brand-accent' },
    { regex: /bg-amber-500/g, rep: 'bg-brand-accent' },

    // Hovers
    { regex: /hover:text-white/g, rep: 'hover:text-brand-white' },
    { regex: /hover:text-orange-[456]00/g, rep: 'hover:text-brand-accent' },
    { regex: /hover:bg-orange-[456]00/g, rep: 'hover:bg-brand-accent' },
    { regex: /hover:border-orange-[456]00\/[0-9]+/g, rep: 'hover:border-brand-accent/50' },

    // Shadows
    { regex: /shadow-\[0_0_[0-9]+px_rgba\([0-9,]+\)\]/g, rep: 'shadow-[0_0_20px_rgba(255,163,26,0.3)]' },
    { regex: /shadow-orange-500\/[0-9]+/g, rep: 'shadow-brand-accent/20' }
];

replacements.forEach(({ regex, rep }) => {
    content = content.replace(regex, rep);
});

fs.writeFileSync(appFile, content, 'utf8');
console.log('Successfully updated App.tsx styles.');
