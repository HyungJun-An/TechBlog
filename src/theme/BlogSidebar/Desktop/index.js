import React, {memo, useState} from 'react';
import clsx from 'clsx';
import {translate} from '@docusaurus/Translate';
import {
  useVisibleBlogSidebarItems,
  BlogSidebarItemList,
} from '@docusaurus/plugin-content-blog/client';
import BlogSidebarContent from '@theme/BlogSidebar/Content';
import Link from '@docusaurus/Link';
import {useLocation} from '@docusaurus/router';
import styles from './styles.module.css';

const CATEGORIES = [
  {label: '전체', to: '/blog'},
  {label: 'Java', to: '/blog/tags/java'},
  {
    label: '알고리즘',
    to: '/blog/tags/algorithm',
    children: [
      {label: '전체', to: '/blog/tags/algorithm'},
      {label: 'BFS / DFS', to: '/blog/tags/bfs'},
      {label: '다익스트라', to: '/blog/tags/dijkstra'},
    ],
  },
  {label: '네트워크', to: '/blog/tags/network'},
];

function CategoryItem({cat, location}) {
  const hasChildren = cat.children && cat.children.length > 0;
  const isChildActive = hasChildren && cat.children.some((c) =>
    location.pathname.startsWith(c.to)
  );
  const isSelfActive =
    cat.to === '/blog'
      ? location.pathname === '/blog' || location.pathname === '/blog/'
      : location.pathname === cat.to;

  const [open, setOpen] = useState(isChildActive);

  if (!hasChildren) {
    return (
      <li className={`sidebar-categories__item${isSelfActive ? ' sidebar-categories__item--active' : ''}`}>
        <Link to={cat.to} className="sidebar-categories__link">
          {cat.label}
        </Link>
      </li>
    );
  }

  return (
    <li className="sidebar-categories__item">
      <button
        className={`sidebar-categories__link sidebar-categories__group-btn${isChildActive || isSelfActive ? ' sidebar-categories__item--active' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{cat.label}</span>
        <span className={`sidebar-categories__arrow${open ? ' sidebar-categories__arrow--open' : ''}`}>›</span>
      </button>
      {open && (
        <ul className="sidebar-categories__list sidebar-categories__sublist">
          {cat.children.map((child) => {
            const isActive = location.pathname === child.to || location.pathname.startsWith(child.to + '/');
            return (
              <li
                key={child.to}
                className={`sidebar-categories__item${isActive ? ' sidebar-categories__item--active' : ''}`}
              >
                <Link to={child.to} className="sidebar-categories__link sidebar-categories__sublink">
                  {child.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

function CategorySection() {
  const location = useLocation();
  return (
    <div className="sidebar-categories">
      <div className="sidebar-categories__title">카테고리</div>
      <ul className="sidebar-categories__list">
        {CATEGORIES.map((cat) => (
          <CategoryItem key={cat.to} cat={cat} location={location} />
        ))}
      </ul>
    </div>
  );
}

const ListComponent = ({items}) => (
  <BlogSidebarItemList
    items={items}
    ulClassName={clsx(styles.sidebarItemList, 'clean-list')}
    liClassName={styles.sidebarItem}
    linkClassName={styles.sidebarItemLink}
    linkActiveClassName={styles.sidebarItemLinkActive}
  />
);

function BlogSidebarDesktop({sidebar}) {
  const items = useVisibleBlogSidebarItems(sidebar.items);
  return (
    <aside className="col col--3">
      <nav
        className={clsx(styles.sidebar, 'thin-scrollbar')}
        aria-label={translate({
          id: 'theme.blog.sidebar.navAriaLabel',
          message: 'Blog recent posts navigation',
          description: 'The ARIA label for recent posts in the blog sidebar',
        })}>
        <CategorySection />
        <div className={clsx(styles.sidebarItemTitle, 'margin-bottom--md')}>
          {sidebar.title}
        </div>
        <BlogSidebarContent
          items={items}
          ListComponent={ListComponent}
          yearGroupHeadingClassName={styles.yearGroupHeading}
        />
      </nav>
    </aside>
  );
}

export default memo(BlogSidebarDesktop);
