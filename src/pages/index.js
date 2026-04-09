import clsx from 'clsx';
import React, { useState, useEffect, useRef } from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import BrowserOnly from '@docusaurus/BrowserOnly';
import {useColorMode} from '@docusaurus/theme-common';
import styles from './index.module.css';

// macOS 터미널 타이핑 애니메이션
function useTypewriter(lines, typingSpeed = 40, lineDelay = 600) {
  const [displayed, setDisplayed] = useState([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const cursorInterval = setInterval(() => setShowCursor((v) => !v), 530);
    return () => clearInterval(cursorInterval);
  }, []);

  useEffect(() => {
    if (currentLine >= lines.length) return;

    const line = lines[currentLine];
    if (currentChar < line.text.length) {
      const timeout = setTimeout(() => {
        setDisplayed((prev) => {
          const copy = [...prev];
          copy[currentLine] = { ...line, text: line.text.slice(0, currentChar + 1) };
          return copy;
        });
        setCurrentChar((c) => c + 1);
      }, line.instant ? 5 : typingSpeed);
      return () => clearTimeout(timeout);
    } else {
      // 빈 문자열 라인도 displayed에 추가
      setDisplayed((prev) => {
        const copy = [...prev];
        if (!copy[currentLine]) copy[currentLine] = { ...line };
        return copy;
      });
      const timeout = setTimeout(() => {
        setCurrentLine((l) => l + 1);
        setCurrentChar(0);
      }, line.instant ? 50 : lineDelay);
      return () => clearTimeout(timeout);
    }
  }, [currentLine, currentChar, lines, typingSpeed, lineDelay]);

  return { displayed, isTyping: currentLine < lines.length, showCursor, currentLine };
}

const terminalLines = [
  { text: 'anhyeongjun@macbook ~ % whoami', color: '#e2e8f0', prompt: true },
  { text: 'Java Backend Developer & DevOps Engineer', color: '#34d399', instant: true },
  { text: '', color: 'transparent', instant: true },
  { text: 'anhyeongjun@macbook ~ % cat skills.json', color: '#e2e8f0', prompt: true },
  { text: '{ "backend": ["Spring Boot", "JPA", "Security"],', color: '#fbbf24', instant: true },
  { text: '  "devops": ["Docker", "Jenkins", "AWS"],', color: '#fbbf24', instant: true },
  { text: '  "passion": "∞" }', color: '#fbbf24', instant: true },
  { text: '', color: 'transparent', instant: true },
  { text: 'anhyeongjun@macbook ~ % ./start-blog.sh', color: '#e2e8f0', prompt: true },
  { text: '🚀 Blog server running at dev-hyungjun.com', color: '#34d399', instant: true },
  { text: '✨ Welcome! Explore my dev journey below.', color: '#a78bfa', instant: true },
];

function MacTerminal() {
  const { displayed, isTyping, showCursor, currentLine } = useTypewriter(terminalLines);

  return (
    <div className={styles.macTerminal}>
      {/* macOS 타이틀 바 */}
      <div className={styles.terminalTitleBar}>
        <div className={styles.trafficLights}>
          <span className={styles.trafficRed} />
          <span className={styles.trafficYellow} />
          <span className={styles.trafficGreen} />
        </div>
        <span className={styles.terminalTitle}>anhyeongjun@macbook — zsh — 80x24</span>
        <div style={{ width: '52px' }} />
      </div>

      {/* 터미널 본문 */}
      <div className={styles.terminalBody}>
        {displayed.map((line, i) => (
          <div key={i} className={styles.terminalLine}>
            <span style={{ color: line.color }}>{line.text}</span>
            {i === currentLine && isTyping && (
              <span className={styles.cursor} style={{ opacity: showCursor ? 1 : 0 }}>▋</span>
            )}
          </div>
        ))}
        {!isTyping && (
          <div className={styles.terminalLine}>
            <span style={{ color: '#e2e8f0' }}>anhyeongjun@macbook ~ % </span>
            <span className={styles.cursor} style={{ opacity: showCursor ? 1 : 0 }}>▋</span>
          </div>
        )}
      </div>
    </div>
  );
}

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();

  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div className={styles.heroGrid}>
          {/* 왼쪽: 텍스트 + 터미널 */}
          <div className={styles.heroLeft}>
            <div className="badge badge--primary" style={{ marginBottom: '1.2rem', textTransform: 'uppercase', fontWeight: 800, padding: '0.5rem 1.2rem', letterSpacing: '0.1em', fontSize: '0.75rem' }}>
              Java Backend & DevOps
            </div>
            <Heading as="h1" className="hero__title" style={{ textAlign: 'left' }}>
              {siteConfig.title}
            </Heading>
            <p className={styles.heroSubtitle}>
              Spring Boot 기반 백엔드 개발자의<br />
              <strong>기술 블로그 & 포트폴리오</strong>
            </p>
            <MacTerminal />
            <div className={styles.buttons} style={{ justifyContent: 'flex-start', marginTop: '2rem' }}>
              <Link className="button button--primary button--lg" to="/blog" style={{ marginRight: '1rem' }}>
                Latest Posts
              </Link>
              <Link className="button button--secondary button--lg" to="/docs/intro">
                Archive
              </Link>
            </div>
          </div>

          {/* 오른쪽: 3D 캐릭터 */}
          <div className={styles.heroRight}>
            <BrowserOnly fallback={<div className={styles.characterPlaceholder} />}>
              {() => {
                const InteractiveCharacter = require('@site/src/components/InteractiveCharacter').default;
                return <InteractiveCharacter />;
              }}
            </BrowserOnly>
          </div>
        </div>
      </div>
    </header>
  );
}

function TechStack() {
  const stacks = [
    {
      category: 'Backend',
      items: ['Java', 'Spring Boot', 'Spring Security', 'Spring Data JPA', 'MySQL', 'Redis', 'Elasticsearch']
    },
    {
      category: 'DevOps & Cloud',
      items: ['Docker', 'Jenkins', 'GitHub Actions', 'Prometheus', 'Grafana', 'Nginx', 'AWS']
    },
    {
      category: 'Frontend & Others',
      items: ['React', 'TypeScript', 'JavaScript', 'Thymeleaf', 'Git', 'SOLID']
    },
  ];

  return (
    <section style={{ padding: '8rem 0', background: 'var(--ifm-background-color)' }}>
      <div className="container">
        <Heading as="h2" style={{ textAlign: 'center', marginBottom: '4rem', fontSize: '2.5rem' }}>Tech Stack & Expertise</Heading>
        <div className="row">
          {stacks.map((stack, idx) => (
            <div key={idx} className="col col--4">
              <div style={{
                padding: '3rem 2rem',
                borderRadius: '32px',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                height: '100%',
                transition: 'all 0.4s var(--ease-out-expo)',
                textAlign: 'center'
              }} className="tech-card">
                <Heading as="h3" style={{ color: 'var(--ifm-color-primary)', marginBottom: '1.5rem', fontSize: '1.8rem' }}>{stack.category}</Heading>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                  {stack.items.map((item, i) => (
                    <span key={i} className="badge badge--secondary" style={{ fontSize: '0.8rem' }}>{item}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section style={{ padding: '8rem 0', textAlign: 'center', position: 'relative' }}>
      <div className="container">
        <div style={{
          padding: '5rem 2rem',
          borderRadius: '40px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%)',
          border: '1px solid var(--glass-border)',
          maxWidth: '1000px',
          margin: '0 auto'
        }}>
          <Heading as="h2" style={{ fontSize: '3rem', marginBottom: '1.5rem', fontWeight: 800 }}>Let's Build Something Great</Heading>
          <p style={{ fontSize: '1.3rem', maxWidth: '600px', margin: '0 auto 3rem', opacity: 0.7, lineHeight: '1.6' }}>
            새로운 기술적 도전과 협업은 언제나 환영입니다.<br />
            함께 더 나은 가치를 만들어가요.
          </p>
          <Link
            className="button button--primary button--lg"
            href="https://github.com/HyungJun-An"
            style={{ padding: '1.2rem 4rem', fontSize: '1.1rem' }}>
            GitHub Profile
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`Professional Developer | ${siteConfig.title}`}
      description="Software Engineer Dev HyungJun's professional portfolio and technical blog.">
      <HomepageHeader />
      <main>
        <TechStack />
        <ContactSection />
      </main>
    </Layout>
  );
}
