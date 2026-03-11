import React, {memo, useState} from 'react';
import clsx from 'clsx';
import {translate} from '@docusaurus/Translate';
import Link from '@docusaurus/Link';
import {useLocation} from '@docusaurus/router';
import styles from './styles.module.css';

const CATEGORIES = [
  {label: '✨ 전체 보기', to: '/blog'},
  {
    label: '☕ Java',
    to: '/blog/tags/java',
    children: [
      {label: '전체', to: '/blog/tags/java'},
      {label: '기본기', to: '/blog/tags/basics'},
      {label: '자료구조', to: '/blog/tags/자료구조'},
      {label: '상속', to: '/blog/tags/상속'},
      {label: 'Generic', to: '/blog/tags/generic'},
      {label: ' 디자인 패턴',to: '/blog/tags/design-pattern'},
      {label: 'JDBC / DB', to: '/blog/tags/jdbc'},
    ],
  },
  {
    label: '🚀 알고리즘',
    to: '/blog/tags/algorithm',
    children: [
      {label: '전체', to: '/blog/tags/algorithm'},
      {label: 'BFS / DFS', to: '/blog/tags/bfs'},
      {label: '다익스트라', to: '/blog/tags/dijkstra'},
    ],
  },
  {
    label: '🍃 Spring',
    to: '/blog/tags/spring',
  },
  {
    label: '🌐 네트워크',
    to: '/blog/tags/network',
    children: [
      {label: '전체', to: '/blog/tags/network'},
      {label: '기초 이론', to: '/blog/tags/theory'},
    ],
  }
  
];

function CategoryItem({cat, location}) {
  const hasChildren = cat.children && cat.children.length > 0;
  
  // 현재 경로가 이 카테고리나 그 자식에 속하는지 확인
  const isChildActive = hasChildren && cat.children.some((c) =>
    location.pathname === c.to || location.pathname === `${c.to}/`
  );
  const isSelfActive =
    cat.to === '/blog'
      ? location.pathname === '/blog' || location.pathname === '/blog/'
      : location.pathname === cat.to || location.pathname === `${cat.to}/`;

  const [open, setOpen] = useState(isChildActive || isSelfActive);

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
            const isActive = location.pathname === child.to || location.pathname === `${child.to}/`;
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

function BlogSidebarDesktop() {
  return (
    <aside className="col col--3">
      <nav
        className={clsx(styles.sidebar, 'thin-scrollbar')}
        aria-label={translate({
          id: 'theme.blog.sidebar.navAriaLabel',
          message: 'Blog category navigation',
          description: 'The ARIA label for categories in the blog sidebar',
        })}>
        <CategorySection />
      </nav>
    </aside>
  );
}

export default memo(BlogSidebarDesktop);
