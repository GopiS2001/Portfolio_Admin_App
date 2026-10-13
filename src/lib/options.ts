// Choices offered by the app. Copied from ADMIN DASHBOARD/src/portfolio/options.ts — keep in sync
// with that file, WEBSITE/src/lib/appearance.ts and the icon map in WEBSITE/src/components/sections/Skills.tsx.

/** First entry is bundled with the website; the rest load from Google Fonts. */
export const SANS_FONTS = [
  'Geist',
  'Inter',
  'Poppins',
  'DM Sans',
  'Manrope',
  'Outfit',
  'Plus Jakarta Sans',
  'Space Grotesk',
  'Montserrat',
  'Roboto',
  'Open Sans',
  'Nunito',
  'Urbanist',
  'Sora',
  'IBM Plex Sans',
];

/** Display font used for headings — every option ships an italic for the highlighted words. */
export const SERIF_FONTS = [
  'Instrument Serif',
  'Playfair Display',
  'Cormorant Garamond',
  'DM Serif Display',
  'Fraunces',
  'Libre Baskerville',
  'Lora',
  'EB Garamond',
  'Merriweather',
  'Crimson Pro',
  'Bodoni Moda',
];

export const GRADIENTS = [
  {
    value: 'from-amber-300 via-orange-400 to-rose-500',
    label: 'Sunset',
    css: '#fcd34d, #fb923c, #f43f5e',
  },
  {
    value: 'from-sky-300 via-indigo-400 to-violet-500',
    label: 'Twilight',
    css: '#7dd3fc, #818cf8, #8b5cf6',
  },
  {
    value: 'from-emerald-300 via-teal-400 to-cyan-500',
    label: 'Lagoon',
    css: '#6ee7b7, #2dd4bf, #06b6d4',
  },
  {
    value: 'from-fuchsia-300 via-pink-400 to-rose-500',
    label: 'Blossom',
    css: '#f0abfc, #f472b6, #f43f5e',
  },
  {
    value: 'from-yellow-200 via-lime-300 to-emerald-400',
    label: 'Citrus',
    css: '#fef08a, #bef264, #34d399',
  },
  {
    value: 'from-slate-300 via-slate-400 to-slate-600',
    label: 'Graphite',
    css: '#cbd5e1, #94a3b8, #475569',
  },
  {
    value: 'from-rose-300 via-red-400 to-orange-500',
    label: 'Ember',
    css: '#fda4af, #f87171, #f97316',
  },
  {
    value: 'from-cyan-200 via-sky-400 to-blue-600',
    label: 'Ocean',
    css: '#a5f3fc, #38bdf8, #2563eb',
  },
  {
    value: 'from-violet-300 via-purple-400 to-fuchsia-500',
    label: 'Nebula',
    css: '#c4b5fd, #c084fc, #d946ef',
  },
  {
    value: 'from-stone-200 via-amber-200 to-yellow-400',
    label: 'Sand',
    css: '#e7e5e4, #fde68a, #facc15',
  },
];

export const SKILL_ICONS = [
  { value: 'layout', label: 'Layout (frontend)' },
  { value: 'server', label: 'Server (backend)' },
  { value: 'database', label: 'Database' },
  { value: 'wrench', label: 'Wrench (tools)' },
  { value: 'code', label: 'Code' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'smartphone', label: 'Smartphone (mobile)' },
  { value: 'palette', label: 'Palette (design)' },
  { value: 'cpu', label: 'CPU (systems)' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'git', label: 'Git branch' },
  { value: 'shield', label: 'Shield (security)' },
  { value: 'brain', label: 'Brain (AI / ML)' },
  { value: 'globe', label: 'Globe (web)' },
  { value: 'layers', label: 'Layers' },
  { value: 'sparkles', label: 'Sparkles' },
];

export const SECTION_LABELS: Record<string, string> = {
  home: 'Home (hero)',
  about: 'About',
  skills: 'Skills',
  experience: 'Experience',
  projects: 'Projects',
  contact: 'Contact',
};

/** Project filter groups. Keep in sync with PROJECT_CATEGORIES in WEBSITE/src/components/sections/Projects.tsx. */
export const PROJECT_CATEGORIES = [
  { value: 'personal', label: 'My project' },
  { value: 'office', label: 'Office project' },
];
