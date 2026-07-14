import { defineConfig } from 'vitepress';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  title: 'SpecKit Governance Dashboard',
  description:
    'A read-only, Markdown-first visual dashboard for GitHub Spec Kit repositories. Watch local artifacts, refresh project health automatically, and keep Markdown authoritative.',
  lang: 'en-US',
  cleanUrls: true,
  vite: {
    publicDir: path.resolve(__dirname, '../assets'),
  },
  head: [
    ['meta', { name: 'theme-color', content: '#0b1020' }],
    ['meta', { property: 'og:title', content: 'SpecKit Governance Dashboard' }],
    [
      'meta',
      {
        property: 'og:description',
        content: 'Live, read-only visual dashboard for Spec Kit repositories. Source changes refresh automatically while Markdown stays authoritative.',
      },
    ],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: 'https://skgd.itseslam.com' }],
    ['meta', { property: 'og:image', content: 'https://skgd.itseslam.com/screenshots/overview.png' }],
    ['link', { rel: 'canonical', href: 'https://skgd.itseslam.com' }],
  ],
  themeConfig: {
    logo: undefined,
    nav: [
      { text: 'Get started', link: '/getting-started' },
      { text: 'Guide', link: '/architecture' },
      { text: 'Live updates', link: '/live-updates' },
      {
        text: 'Reference',
        items: [
          { text: 'Adapters', link: '/adapters' },
          { text: 'Snapshot schema', link: '/snapshot-schema' },
          { text: 'Validation rules', link: '/validation-rules' },
          { text: 'Read-only model', link: '/read-only-model' },
        ],
      },
      { text: 'Demo & deploy', link: '/demo' },
      { text: 'npm', link: 'https://www.npmjs.com/package/speckit-governance-dashboard' },
    ],
    sidebar: [
      {
        text: 'Overview',
        items: [
          { text: 'Getting started', link: '/getting-started' },
          { text: 'Architecture', link: '/architecture' },
          { text: 'Live updates', link: '/live-updates' },
          { text: 'Read-only model', link: '/read-only-model' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Adapters', link: '/adapters' },
          { text: 'Snapshot schema', link: '/snapshot-schema' },
          { text: 'Validation rules', link: '/validation-rules' },
        ],
      },
      {
        text: 'Demo & release',
        items: [
          { text: 'Demo and deployment', link: '/demo' },
          { text: 'Release checklist', link: '/release-checklist' },
        ],
      },
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/essov3/speckit-governance-dashboard' }],
    footer: {
      message: 'MIT licensed · Independent companion dashboard for SpecKit-style repositories.',
      copyright: 'A project by <a href="https://itseslam.com">Eslam M. Mohamed</a>',
    },
    search: {
      provider: 'local',
    },
  },
});
