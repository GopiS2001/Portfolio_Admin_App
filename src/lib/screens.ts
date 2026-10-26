// Titles of the screens pushed on top of the tabs. The root stack registers them with these titles,
// and the in-scroll page header (ui.tsx → StackHeader) shows them, so they're kept in one place.

export const STACK_TITLES = {
  'content/home': 'Home',
  'content/about': 'About',
  'content/skills': 'Skills',
  'content/experience': 'Experience',
  'content/projects': 'Projects',
  'content/contact': 'Contact',
  account: 'Account',
} as const;

export type StackRoute = keyof typeof STACK_TITLES;
