// Mirrors the NestJS entities in BACKEND/src/content/entities (same as the admin dashboard).

import type { DesignStyle } from './preferences';

export type ThemeMode = 'light' | 'dark' | 'system';
export type SectionKey = 'home' | 'about' | 'skills' | 'experience' | 'projects' | 'contact';

export type Ordered = { id: number; sortOrder: number; visible: boolean };

export type Profile = {
  name: string;
  role: string;
  location: string;
  avatarUrl: string;
  resumeUrl: string;
  available: boolean;
  availabilityText: string;
  heroTitle: string;
  heroHighlight: string;
  heroTitleSuffix: string;
  tagline: string | null;
  primaryCtaLabel: string;
  resumeCtaLabel: string;
  email: string;
  phone: string;
  whatsapp: string;
  contactIntro: string | null;
  github: string;
  linkedin: string;
  instagram: string;
  twitter: string;
  website: string;
  footerText: string;
};

export type Settings = {
  siteEnabled: boolean;
  maintenanceMessage: string;
  siteTitle: string;
  metaDescription: string | null;
  showHeader: boolean;
  showHeaderCta: boolean;
  headerCtaLabel: string;
  enableThemeToggle: boolean;
  defaultTheme: ThemeMode;
  accentLight: string;
  accentDark: string;
  /** The website's surface look (older servers may not send it). */
  designStyle?: DesignStyle;
  enableStyleSwitcher?: boolean;
  fontSans: string;
  fontSerif: string;
  baseFontSize: number;
  headingScale: number;
  showStats: boolean;
  showMarquee: boolean;
  showResumeButton: boolean;
  showContactForm: boolean;
  showFooter: boolean;
  showWhatsappButton: boolean;
  enableAnimations: boolean;
  updatedAt?: string;
};

export type Section = {
  key: SectionKey;
  visible: boolean;
  showInNav: boolean;
  sortOrder: number;
  navLabel: string;
  eyebrow: string;
  title: string;
  highlight: string;
  titleSuffix: string;
};

export type Stat = Ordered & { value: string; label: string };
export type AboutParagraph = Ordered & { content: string };
export type Highlight = Ordered & { title: string; text: string };
export type SkillGroup = Ordered & { title: string; icon: string; skills: string[] };
export type MarqueeItem = Ordered & { label: string };
export type Experience = Ordered & {
  role: string;
  company: string;
  period: string;
  location: string;
  description: string | null;
  stack: string[];
};
export type Project = Ordered & {
  title: string;
  category: 'office' | 'personal';
  description: string;
  tags: string[];
  liveUrl: string;
  sourceUrl: string;
  links: { label: string; url: string }[] | null;
  imageUrl: string;
  apkUrl: string;
  gradient: string;
  featured: boolean;
};

export type Message = {
  id: number;
  name: string;
  email: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export type Summary = {
  projects: number;
  experiences: number;
  skillGroups: number;
  skills: number;
  messages: number;
  unread: number;
};
