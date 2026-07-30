import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(defineConfig({
  title: 'agent-os',
  description: 'A lightweight agent operating system — explicit workflows and automatic disciplines, shared between Claude Code and Codex.',
  base: '/agent-os/',
  lang: 'en-US',
  lastUpdated: true,
  cleanUrls: true,

  transformHead({ title, description }) {
    return [
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }]
    ]
  },

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/agent-os/logo.svg' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: 'https://sockulags.github.io/agent-os/' }],
    ['meta', { name: 'twitter:card', content: 'summary' }]
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/guide/what-is-agent-os', activeMatch: '/guide/' },
      { text: 'Skills', link: '/skills/', activeMatch: '/skills/' },
      { text: 'Evals', link: '/reference/evals' },
      { text: 'Reference', link: '/reference/plugin-manifests', activeMatch: '/reference/' },
      {
        text: 'v0.6.2',
        items: [
          { text: 'Releases', link: 'https://github.com/sockulags/agent-os/releases' },
          { text: 'Commit history', link: 'https://github.com/sockulags/agent-os/commits/main' }
        ]
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is agent-os?', link: '/guide/what-is-agent-os' },
            { text: 'Getting started', link: '/guide/getting-started' }
          ]
        },
        {
          text: 'Using agent-os',
          items: [
            { text: 'The work loop', link: '/guide/the-work-loop' },
            { text: 'Global policy', link: '/guide/global-policy' },
            { text: 'Project policy', link: '/guide/project-policy' }
          ]
        }
      ],
      '/skills/': [
        {
          text: 'Skills',
          items: [
            { text: 'Overview', link: '/skills/' }
          ]
        },
        {
          text: 'Workflows',
          items: [
            { text: 'init-agent-os', link: '/skills/init-agent-os' },
            { text: 'chart-work', link: '/skills/chart-work' },
            { text: 'shape-work', link: '/skills/shape-work' },
            { text: 'batch-work', link: '/skills/batch-work' },
            { text: 'deliver-work', link: '/skills/deliver-work' },
            { text: 'dispatch-next', link: '/skills/dispatch-next' }
          ]
        },
        {
          text: 'Disciplines',
          items: [
            { text: 'verify-before-done', link: '/skills/verify-before-done' },
            { text: 'diagnose-before-fix', link: '/skills/diagnose-before-fix' },
            { text: 'scope-guard', link: '/skills/scope-guard' }
          ]
        },
        {
          text: 'Meta',
          items: [
            { text: 'writing-skills', link: '/skills/writing-skills' }
          ]
        }
      ],
      '/reference/': [
        {
          text: 'Reference',
          items: [
            { text: 'Plugin manifests', link: '/reference/plugin-manifests' },
            { text: 'Work records', link: '/reference/work-records' },
            { text: 'Batch manifests', link: '/reference/batches' },
            { text: 'Maps and decision tickets', link: '/reference/maps-and-tickets' },
            { text: 'Prototype evidence', link: '/reference/prototypes' },
            { text: 'Frontend mockups', link: '/reference/mockups' },
            { text: 'Evals', link: '/reference/evals' },
            { text: 'Release routine', link: '/reference/release' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/sockulags/agent-os' }
    ],

    footer: {
      message: 'A personal framework, published in the open.',
      copyright: 'Copyright © 2026 Lucas Skog'
    },

    search: { provider: 'local' },

    editLink: {
      pattern: 'https://github.com/sockulags/agent-os/edit/main/docs-site/:path',
      text: 'Edit this page on GitHub'
    },

    lastUpdated: {
      text: 'Last updated',
      formatOptions: {
        dateStyle: 'medium',
        timeStyle: 'short',
        forceLocale: true
      }
    }
  },

  mermaid: {
    theme: 'neutral'
  }
}))
