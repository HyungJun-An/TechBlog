import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

function Terminal() {
  return (
    <div style={{
      background: '#0f172a',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
      overflow: 'hidden',
      maxWidth: '500px',
      margin: '2rem auto',
      textAlign: 'left',
      fontFamily: 'var(--ifm-font-family-monospace)',
      fontSize: '0.85rem'
    }}>
      <div style={{ background: '#1e293b', padding: '10px 15px', display: 'flex', gap: '8px' }}>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }}></div>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }}></div>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }}></div>
      </div>
      <div style={{ padding: '20px', color: '#cbd5e1' }}>
        <div style={{ marginBottom: '10px' }}><span style={{ color: '#818cf8' }}>$</span> npx create-innovation --future</div>
        <div style={{ color: '#27c93f' }}>✔ Successfully initialized project</div>
        <div style={{ marginTop: '10px' }}><span style={{ color: '#818cf8' }}>$</span> cd dev-hyungjun</div>
        <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>// Loading awesome content...</div>
        <div style={{ marginTop: '10px' }}><span style={{ color: '#818cf8' }}>$</span> blog start --mode professional</div>
      </div>
    </div>
  );
}

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="badge badge--primary" style={{ marginBottom: '1.5rem', textTransform: 'uppercase', fontWeight: 700 }}>Full Stack Developer</div>
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle" style={{ fontSize: '1.5rem', opacity: 0.8, maxWidth: '800px', margin: '1rem auto' }}>
          {siteConfig.tagline}
        </p>
        <Terminal />
        <div className={styles.buttons} style={{ marginTop: '3rem' }}>
          <Link
            className="button button--primary button--lg"
            to="/blog"
            style={{ marginRight: '1rem' }}>
            Latest Posts
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            Archive
          </Link>
        </div>
      </div>
    </header>
  );
}

function TechStack() {
  const stacks = [
    { category: 'Frontend', items: ['React', 'TypeScript', 'Tailwind', 'Next.js'] },
    { category: 'Backend', items: ['Node.js', 'Spring Boot', 'PostgreSQL', 'Redis'] },
    { category: 'Infra', items: ['Docker', 'AWS', 'GitHub Actions', 'Terraform'] },
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
