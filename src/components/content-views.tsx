import type { FieldDef } from './fields';
import type {
  Stat,
  Profile,
  Project,
  Highlight,
  SkillGroup,
  Experience,
  MarqueeItem,
  AboutParagraph,
} from '@/lib/types';

import { View, Image } from 'react-native';
import { Text } from 'react-native-paper';

import { useAppTheme } from '@/theme';
import { revalidate } from '@/lib/store';
import { endpoints as api, resolveFileUrl } from '@/lib/api';
import { GRADIENTS, SKILL_ICONS, PROJECT_CATEGORIES } from '@/lib/options';

import { CrudList } from './crud-list';
import { GradientSwatch } from './fields';
import { Label, Screen, ChipList } from './ui';
import { SingletonForm } from './singleton-form';
import { SectionHeadingCard } from './section-heading-card';

// ----------------------------------------------------------------------

const refreshAll = (...urls: string[]) => () =>
  Promise.all([api.sections, ...urls].map((u) => revalidate(u))).catch(() => undefined);

function Secondary({ children, lines = 2 }: { children: React.ReactNode; lines?: number }) {
  const theme = useAppTheme();
  return (
    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={lines}>
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------------- Home

const HERO_FIELDS: FieldDef[] = [
  { name: 'name', label: 'Your name', required: true },
  { name: 'role', label: 'Role / title', placeholder: 'Full-Stack Developer' },
  { name: 'location', label: 'Location (place)', placeholder: 'Chennai, India' },
  { name: 'availabilityText', label: 'Availability badge text' },
  { name: 'available', label: 'Show “available for work” badge', type: 'switch' },
  { name: 'heroTitle', label: 'Headline', helperText: '{name} is replaced with your name' },
  { name: 'heroHighlight', label: 'Headline highlight (animated)' },
  { name: 'heroTitleSuffix', label: 'Headline ending' },
  { name: 'primaryCtaLabel', label: '“View my work” button label' },
  { name: 'tagline', label: 'Intro paragraph', type: 'textarea', rows: 3 },
  { name: 'resumeCtaLabel', label: 'Résumé button label' },
  { name: 'resumeUrl', label: 'Résumé (PDF)', type: 'file' },
  {
    name: 'avatarUrl',
    label: 'Profile photo',
    type: 'image',
    helperText: 'Shown in the About section. Leave empty to show your initials.',
  },
];

const STAT_FIELDS: FieldDef[] = [
  { name: 'value', label: 'Value', required: true, placeholder: '5+' },
  { name: 'label', label: 'Label', required: true, placeholder: 'Years experience' },
];

export function HomeContentView() {
  return (
    <Screen anchor="home" onRefresh={refreshAll(api.profile, api.stats)}>
      <SectionHeadingCard sectionKey="home" />
      <SingletonForm<Profile>
        url={api.profile}
        title="Hero"
        icon="account-star-outline"
        subheader="The first screen visitors see."
        fields={HERO_FIELDS}
      />
      <CrudList<Stat>
        url={api.stats}
        title="Stats"
        icon="chart-box-outline"
        subheader="Numbers under the hero (turn the whole row off in Configuration)."
        itemName="stat"
        fields={STAT_FIELDS}
        renderPrimary={(s) => s.value}
        renderSecondary={(s) => <Secondary>{s.label}</Secondary>}
      />
    </Screen>
  );
}

// ---------------------------------------------------------------------- About

const PARAGRAPH_FIELDS: FieldDef[] = [
  {
    name: 'content',
    label: 'Paragraph',
    type: 'textarea',
    rows: 5,
    required: true,
    helperText: 'The first visible paragraph is shown in a stronger colour.',
  },
];

const HIGHLIGHT_FIELDS: FieldDef[] = [
  { name: 'title', label: 'Title', required: true },
  { name: 'text', label: 'Description' },
];

export function AboutContentView() {
  return (
    <Screen anchor="about" onRefresh={refreshAll(api.aboutParagraphs, api.highlights)}>
      <SectionHeadingCard sectionKey="about" />
      <CrudList<AboutParagraph>
        url={api.aboutParagraphs}
        title="About paragraphs"
        icon="text-box-outline"
        itemName="paragraph"
        fields={PARAGRAPH_FIELDS}
        renderPrimary={(p) => p.content}
      />
      <CrudList<Highlight>
        url={api.highlights}
        title="Highlights"
        icon="star-four-points-outline"
        subheader="Small cards under the paragraphs."
        itemName="highlight"
        fields={HIGHLIGHT_FIELDS}
        renderPrimary={(h) => h.title}
        renderSecondary={(h) => (h.text ? <Secondary>{h.text}</Secondary> : null)}
      />
    </Screen>
  );
}

// ---------------------------------------------------------------------- Skills

const SKILL_GROUP_FIELDS: FieldDef[] = [
  { name: 'title', label: 'Group title', required: true, placeholder: 'Frontend' },
  { name: 'icon', label: 'Icon', type: 'select', options: SKILL_ICONS },
  { name: 'skills', label: 'Skills', type: 'tags' },
];

const MARQUEE_FIELDS: FieldDef[] = [{ name: 'label', label: 'Technology', required: true }];

export function SkillsContentView() {
  return (
    <Screen anchor="skills" onRefresh={refreshAll(api.skillGroups, api.marquee)}>
      <SectionHeadingCard sectionKey="skills" />
      <CrudList<SkillGroup>
        url={api.skillGroups}
        title="Skill groups"
        icon="layers-triple-outline"
        itemName="skill group"
        fields={SKILL_GROUP_FIELDS}
        renderPrimary={(g) => g.title}
        renderSecondary={(g) => <ChipList items={g.skills} max={8} />}
      />
      <CrudList<MarqueeItem>
        url={api.marquee}
        title="Scrolling technology strip"
        icon="marquee"
        subheader="The infinite marquee under the skill cards (turn it off in Configuration)."
        itemName="technology"
        fields={MARQUEE_FIELDS}
        renderPrimary={(m) => m.label}
      />
    </Screen>
  );
}

// ---------------------------------------------------------------------- Experience

const EXPERIENCE_FIELDS: FieldDef[] = [
  { name: 'role', label: 'Role', required: true },
  { name: 'company', label: 'Company', required: true },
  { name: 'period', label: 'Period', placeholder: '2023 — Present' },
  { name: 'location', label: 'Location', placeholder: 'Remote' },
  {
    name: 'description',
    label: 'Project explanation',
    type: 'textarea',
    rows: 6,
    placeholder: 'Built the payment gateway with Socket.IO…\nIntegrated the bank UPI API…',
    helperText: 'One point per line — each line becomes a bullet point on the website.',
  },
  { name: 'stack', label: 'Tech stack', type: 'tags' },
];

export function ExperienceContentView() {
  return (
    <Screen anchor="experience" onRefresh={refreshAll(api.experiences)}>
      <SectionHeadingCard sectionKey="experience" />
      <CrudList<Experience>
        url={api.experiences}
        title="Work history"
        icon="briefcase-outline"
        subheader="Newest first — use the arrows to reorder."
        itemName="experience"
        fields={EXPERIENCE_FIELDS}
        renderPrimary={(e) => `${e.role} · ${e.company}`}
        renderSecondary={(e) => (
          <View style={{ gap: 6 }}>
            {!!(e.period || e.location) && (
              <Secondary lines={1}>{[e.period, e.location].filter(Boolean).join(' · ')}</Secondary>
            )}
            {!!e.description && <Secondary>{e.description}</Secondary>}
            {e.stack.length > 0 && <ChipList items={e.stack} />}
          </View>
        )}
      />
    </Screen>
  );
}

// ---------------------------------------------------------------------- Projects

const PROJECT_FIELDS: FieldDef[] = [
  { name: 'title', label: 'Title', required: true },
  { name: 'featured', label: 'Featured (full-width card)', type: 'switch' },
  {
    name: 'category',
    label: 'Category',
    type: 'select',
    options: PROJECT_CATEGORIES,
    helperText: 'Visitors can filter projects by this on the website',
  },
  { name: 'description', label: 'Description', type: 'textarea', rows: 3, required: true },
  { name: 'tags', label: 'Tags', type: 'tags' },
  { name: 'liveUrl', label: 'Live site URL', keyboard: 'url', helperText: 'Leave empty to hide the button' },
  { name: 'sourceUrl', label: 'Source code URL', keyboard: 'url', helperText: 'Leave empty to hide the button' },
  {
    name: 'links',
    label: 'More live links',
    type: 'links',
    helperText:
      'For projects with several parts, e.g. "Admin dashboard" or "Web app". Each becomes its own button.',
  },
  {
    name: 'imageUrl',
    label: 'Cover image',
    type: 'image',
    helperText: 'Optional screenshot. Without one, the gradient cover below is used.',
  },
  {
    name: 'apkUrl',
    label: 'Android app (APK)',
    type: 'file',
    // Phones report APKs under several MIME types; the API checks the .apk extension.
    pickTypes: ['*/*'],
    helperText: 'Upload the release .apk (up to 200 MB) to show a "Download APK" button. Leave empty to hide it.',
  },
  { name: 'gradient', label: 'Gradient cover', type: 'select', options: GRADIENTS },
];

function ProjectCover({ project }: { project: Project }) {
  const gradient = GRADIENTS.find((g) => g.value === project.gradient) ?? GRADIENTS[0];
  const image = resolveFileUrl(project.imageUrl);
  return image ? (
    <Image source={{ uri: image }} style={{ width: 64, height: 48, borderRadius: 12 }} />
  ) : (
    <GradientSwatch css={gradient.css} width={64} height={48} radius={12} />
  );
}

export function ProjectsContentView() {
  return (
    <Screen anchor="projects" onRefresh={refreshAll(api.projects)}>
      <SectionHeadingCard sectionKey="projects" />
      <CrudList<Project>
        url={api.projects}
        title="Projects"
        icon="folder-star-outline"
        itemName="project"
        fields={PROJECT_FIELDS}
        renderLeading={(p) => <ProjectCover project={p} />}
        renderPrimary={(p) => p.title}
        renderSecondary={(p) => (
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              <Label tone={p.category === 'office' ? 'info' : 'default'}>
                {PROJECT_CATEGORIES.find((c) => c.value === p.category)?.label ?? 'My project'}
              </Label>
              {p.featured && <Label tone="warning">Featured</Label>}
              {!!p.apkUrl && <Label tone="success">APK</Label>}
            </View>
            <Secondary>{p.description}</Secondary>
            {p.tags.length > 0 && <ChipList items={p.tags} />}
          </View>
        )}
      />
    </Screen>
  );
}

// ---------------------------------------------------------------------- Contact

const CONTACT_FIELDS: FieldDef[] = [
  { name: 'email', label: 'Email', keyboard: 'email-address' },
  { name: 'phone', label: 'Mobile number', keyboard: 'phone-pad', placeholder: '+91 98765 43210' },
  {
    name: 'whatsapp',
    label: 'WhatsApp number',
    keyboard: 'phone-pad',
    placeholder: '+91 98765 43210',
    helperText: 'With country code. Enables the WhatsApp button.',
  },
  { name: 'location', label: 'Place / location' },
  { name: 'contactIntro', label: 'Contact intro text', type: 'textarea', rows: 3 },
];

const SOCIAL_FIELDS: FieldDef[] = [
  { name: 'linkedin', label: 'LinkedIn URL', keyboard: 'url' },
  { name: 'github', label: 'GitHub URL', keyboard: 'url' },
  { name: 'instagram', label: 'Instagram URL', keyboard: 'url' },
  { name: 'twitter', label: 'X / Twitter URL', keyboard: 'url' },
  { name: 'footerText', label: 'Footer text', helperText: 'Shown after “© year name.”' },
];

export function ContactContentView() {
  return (
    <Screen anchor="contact" onRefresh={refreshAll(api.profile)}>
      <SectionHeadingCard sectionKey="contact" />
      <SingletonForm<Profile>
        url={api.profile}
        title="Contact details"
        icon="card-account-mail-outline"
        subheader="Empty fields are hidden on the website."
        fields={CONTACT_FIELDS}
      />
      <SingletonForm<Profile>
        url={api.profile}
        title="Social links & footer"
        icon="share-variant-outline"
        subheader="Icons appear in the footer for every link you fill in."
        fields={SOCIAL_FIELDS}
      />
    </Screen>
  );
}
