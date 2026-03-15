// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Dev HyungJun',
  tagline: '기록하고 공유하는 개발자 형준',
  favicon: 'img/favicon.svg',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://dev-hyungjun.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'HyungJun-An', // Usually your GitHub org/user name.
  projectName: 'dev-hyungjun', // Usually your repo name.

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
        },
        blog: {
          showReadingTime: false,
          blogSidebarTitle: '최근 포스트',
          blogSidebarCount: 10,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      colorMode: {
        defaultMode: 'dark',
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'Dev HyungJun',
        logo: {
          alt: 'Dev HyungJun Logo',
          src: 'img/logo.svg',
        },
        items: [
          {to: '/blog', label: '블로그', position: 'left'},
          {
            type: 'dropdown',
            label: '카테고리',
            position: 'left',
            items: [
              {label: '전체', to: '/blog'},
              {label: 'Java', to: '/blog/tags/java'},
              {label: '알고리즘', to: '/blog/tags/algorithm'},
              {label: '네트워크', to: '/blog/tags/network'},
            ],
          },
          {to: '/docs/intro', label: '아카이브', position: 'left'},
          {
            href: 'https://github.com/HyungJun-An',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Content',
            items: [
              {label: '블로그', to: '/blog'},
              {label: '아카이브', to: '/docs/intro'},
            ],
          },
          {
            title: '카테고리',
            items: [
              {label: 'Java', to: '/blog/tags/java'},
              {label: '알고리즘', to: '/blog/tags/algorithm'},
              {label: '네트워크', to: '/blog/tags/network'},
            ],
          },
          {
            title: 'Social',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/HyungJun-An',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Dev HyungJun. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
