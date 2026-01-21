import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { getPostBySlug } from '../lib/blog';
import DuBoisColorBar from '../components/DuBoisColorBar';
import {
  PortCollision,
  NamespaceArchitecture,
  DatabaseBranching,
  PipelineOverview,
  BuildLoop,
  DataMorph,
} from '../components/blog/visualizations';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

// Du Bois-inspired syntax theme - warm, muted tones on parchment
const duboisSyntaxTheme: { [key: string]: React.CSSProperties } = {
  'code[class*="language-"]': {
    color: '#1A1A1A',
    background: 'none',
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: '0.875rem',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.6',
    tabSize: 2,
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    color: '#1A1A1A',
    background: '#F5F0E6',
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: '0.875rem',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.6',
    tabSize: 2,
    hyphens: 'none',
    padding: '1.5rem',
    margin: '0',
    overflow: 'auto',
    borderRadius: '0',
  },
  'comment': { color: '#8B4513', fontStyle: 'italic' },     // Sepia
  'prolog': { color: '#8B4513' },
  'doctype': { color: '#8B4513' },
  'cdata': { color: '#8B4513' },
  'punctuation': { color: '#4A4A4A' },                       // Charcoal
  'namespace': { opacity: 0.7 },
  'property': { color: '#1E3A5F' },                          // Prussian
  'tag': { color: '#1E3A5F' },
  'boolean': { color: '#C41E3A' },                           // Carmine
  'number': { color: '#C41E3A' },
  'constant': { color: '#C41E3A' },
  'symbol': { color: '#C41E3A' },
  'deleted': { color: '#800020' },                           // Burgundy
  'selector': { color: '#2E8B57' },                          // Emerald
  'attr-name': { color: '#2E8B57' },
  'string': { color: '#2E8B57' },
  'char': { color: '#2E8B57' },
  'builtin': { color: '#DAA520' },                           // Gold
  'inserted': { color: '#2E8B57' },
  'operator': { color: '#4A4A4A' },
  'entity': { color: '#4A4A4A', cursor: 'help' },
  'url': { color: '#1E3A5F' },
  'atrule': { color: '#800020' },
  'attr-value': { color: '#2E8B57' },
  'keyword': { color: '#C41E3A' },
  'function': { color: '#1E3A5F' },
  'class-name': { color: '#DAA520' },
  'regex': { color: '#8B4513' },
  'important': { color: '#C41E3A', fontWeight: 'bold' },
  'variable': { color: '#DAA520' },
  'bold': { fontWeight: 'bold' },
  'italic': { fontStyle: 'italic' },
};

// Helper to generate slug from heading text
const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

// Extract headings from markdown content
const extractHeadings = (content: string): TocItem[] => {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    headings.push({
      id: slugify(text),
      text,
      level,
    });
  }

  return headings;
};

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPostBySlug(slug) : undefined;
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeHeading, setActiveHeading] = useState<string>('');
  const articleRef = useRef<HTMLElement>(null);

  // Extract table of contents from markdown
  const tableOfContents = useMemo(() => {
    if (!post) return [];
    return extractHeadings(post.content);
  }, [post]);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
      setShowScrollTop(window.scrollY > 400);

      // Find which heading is currently in view
      if (articleRef.current) {
        const headings = articleRef.current.querySelectorAll('h2, h3');
        let currentHeading = '';

        headings.forEach((heading) => {
          const rect = heading.getBoundingClientRect();
          // Heading is considered active if it's above the middle of the viewport
          if (rect.top < window.innerHeight / 3) {
            currentHeading = heading.id;
          }
        });

        setActiveHeading(currentHeading);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const wordCount = post.content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  const siteUrl = 'https://estsauver.com';
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const ogImage = `${siteUrl}/earl.jpeg`;

  return (
    <div className="min-h-screen bg-dubois-parchment overflow-hidden">
      <Helmet>
        <title>{post.title} | Earl St Sauver</title>
        <meta name="description" content={post.description} />

        {/* Open Graph tags */}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={postUrl} />
        <meta property="og:type" content="article" />

        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.description} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>

      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-dubois-tan z-50">
        <div
          className="h-full bg-dubois-carmine transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Subtle paper texture overlay */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />

      {/* Table of Contents - hidden on mobile, sticky on desktop */}
      {tableOfContents.length > 0 && (
        <nav className="hidden xl:block fixed left-8 top-32 w-56 max-h-[calc(100vh-12rem)] overflow-y-auto z-40">
          <div className="dubois-panel p-4 overflow-hidden">
            <DuBoisColorBar className="absolute top-0 left-0 right-0" />
            <span className="dubois-heading text-[10px] text-dubois-charcoal mb-3 block mt-2">
              On This Page
            </span>
            <ul className="space-y-1">
              {tableOfContents.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => scrollToHeading(item.id)}
                    className={`
                      block w-full text-left text-sm py-1.5 transition-all duration-200
                      ${item.level === 3 ? 'pl-3' : ''}
                      ${activeHeading === item.id
                        ? 'text-dubois-carmine font-medium'
                        : 'text-dubois-charcoal hover:text-dubois-ink'
                      }
                    `}
                  >
                    <span className="line-clamp-2">{item.text}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}

      <article ref={articleRef} className="relative max-w-2xl mx-auto px-6 py-16 md:py-24">
        {/* Back link */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm text-dubois-charcoal hover:text-dubois-carmine transition-colors duration-300 mb-16 group animate-fade-in"
        >
          <svg
            className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="dubois-heading text-xs">All Posts</span>
        </Link>

        {/* Article header */}
        <header className="dubois-panel mb-12 animate-slide-up overflow-hidden">
          <DuBoisColorBar />
          <div className="p-8">
            {/* Meta info row */}
            <div className="flex items-center gap-4 mb-6">
              <time className="text-xs text-dubois-charcoal font-mono tabular-nums">
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              <span className="text-dubois-tan">·</span>
              <span className="text-xs text-dubois-sepia font-mono">{readingTime} min read</span>
              <span className="text-dubois-tan">·</span>
              <span className="text-xs text-dubois-charcoal font-mono">{wordCount.toLocaleString()} words</span>
            </div>

            <h1 className="dubois-title text-3xl md:text-4xl lg:text-5xl text-dubois-ink leading-tight mb-6">
              {post.title}
            </h1>

            {post.description && (
              <p className="text-lg text-dubois-charcoal leading-relaxed">
                {post.description}
              </p>
            )}
          </div>
        </header>

        {/* Decorative divider */}
        <div className="flex items-center gap-4 mb-12 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="h-0.5 flex-1 bg-dubois-ink" />
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-dubois-carmine" />
            <div className="w-2 h-2 bg-dubois-gold" />
            <div className="w-2 h-2 bg-dubois-prussian" />
          </div>
          <div className="h-0.5 flex-1 bg-dubois-ink" />
        </div>

        {/* Article content */}
        <div className="
          prose prose-lg max-w-none animate-slide-up

          prose-headings:font-condensed prose-headings:font-semibold prose-headings:tracking-wide prose-headings:uppercase
          prose-h2:text-xl prose-h2:text-dubois-ink prose-h2:mt-14 prose-h2:mb-6 prose-h2:relative
          prose-h2:pl-4 prose-h2:border-l-4 prose-h2:border-dubois-carmine
          prose-h3:text-lg prose-h3:text-dubois-ink prose-h3:mt-10 prose-h3:mb-4
          prose-h4:text-base prose-h4:text-dubois-charcoal prose-h4:mt-8 prose-h4:mb-3

          prose-p:text-dubois-ink prose-p:leading-[1.8] prose-p:mb-6

          prose-a:text-dubois-carmine prose-a:no-underline prose-a:border-b-2 prose-a:border-dubois-carmine/30
          hover:prose-a:border-dubois-carmine prose-a:transition-colors

          prose-strong:text-dubois-ink prose-strong:font-semibold
          prose-em:text-dubois-charcoal prose-em:italic

          prose-code:text-dubois-prussian prose-code:bg-dubois-cream prose-code:px-1.5 prose-code:py-0.5
          prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
          prose-code:border prose-code:border-dubois-ink/20

          prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0

          prose-blockquote:border-none prose-blockquote:bg-transparent
          prose-blockquote:p-0 prose-blockquote:not-italic prose-blockquote:my-0

          prose-ul:text-dubois-ink prose-ol:text-dubois-ink
          prose-li:marker:text-dubois-carmine prose-li:my-2

          prose-hr:border-dubois-ink prose-hr:my-12
        " style={{ animationDelay: '150ms' }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2({ children, ...props }) {
                const text = String(children);
                const id = slugify(text);
                return <h2 id={id} {...props}>{children}</h2>;
              },
              h3({ children, ...props }) {
                const text = String(children);
                const id = slugify(text);
                return <h3 id={id} {...props}>{children}</h3>;
              },
              blockquote({ children, ...props }) {
                return (
                  <figure className="my-10 not-prose">
                    <blockquote
                      className="relative py-6 px-8 bg-dubois-cream border-2 border-dubois-ink shadow-[3px_3px_0_0_rgba(26,26,26,0.8)] [&>p]:before:content-none [&>p]:after:content-none"
                      {...props}
                    >
                      {/* Large decorative quotation mark */}
                      <svg
                        className="absolute top-4 left-4 w-10 h-10 text-dubois-gold/50"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                      </svg>
                      <div className="relative pl-8 text-dubois-ink text-lg leading-relaxed italic [&>p]:mb-4 [&>p:last-child]:mb-0 [&>p]:before:content-none [&>p]:after:content-none [&_a]:text-dubois-carmine [&_a]:not-italic [&_a]:font-normal [&_a]:no-underline [&_a]:border-b-2 [&_a]:border-dubois-carmine/30 hover:[&_a]:border-dubois-carmine">
                        {children}
                      </div>
                    </blockquote>
                  </figure>
                );
              },
              pre({ children, ...props }) {
                // Check if this pre contains a visualization code block
                const codeChild = React.Children.toArray(children).find(
                  (child): child is React.ReactElement =>
                    React.isValidElement(child) && child.type === 'code'
                );

                if (codeChild && codeChild.props?.className) {
                  const match = /language-visualization:(\w+[-\w]*)/.exec(codeChild.props.className);
                  if (match) {
                    const vizType = match[1];
                    switch (vizType) {
                      case 'port-collision':
                        return <div className="my-8 not-prose"><PortCollision /></div>;
                      case 'namespace-architecture':
                        return <div className="my-8 not-prose"><NamespaceArchitecture /></div>;
                      case 'database-branching':
                        return <div className="my-8 not-prose"><DatabaseBranching /></div>;
                      case 'pipeline-overview':
                      case 'pipeline-stages':
                        return <div className="my-8 not-prose"><PipelineOverview /></div>;
                      case 'build-loop':
                        return <div className="my-8 not-prose"><BuildLoop /></div>;
                      case 'data-morph':
                        return <div className="my-8 not-prose"><DataMorph /></div>;
                      default:
                        return null;
                    }
                  }
                }

                // Default pre rendering
                return <pre {...props}>{children}</pre>;
              },
              code({ node, className, children, ...props }) {
                // Check for visualization blocks first (colon in language name)
                const vizMatch = /language-visualization:([\w-]+)/.exec(className || '');
                if (vizMatch) {
                  const vizType = vizMatch[1];
                  switch (vizType) {
                    case 'port-collision':
                      return <div className="my-8 not-prose"><PortCollision /></div>;
                    case 'namespace-architecture':
                      return <div className="my-8 not-prose"><NamespaceArchitecture /></div>;
                    case 'database-branching':
                      return <div className="my-8 not-prose"><DatabaseBranching /></div>;
                    case 'pipeline-overview':
                    case 'pipeline-stages':
                      return <div className="my-8 not-prose"><PipelineOverview /></div>;
                    case 'build-loop':
                      return <div className="my-8 not-prose"><BuildLoop /></div>;
                    case 'data-morph':
                      return <div className="my-8 not-prose"><DataMorph /></div>;
                    default:
                      return null;
                  }
                }

                const match = /language-(\w+)/.exec(className || '');
                const isInline = !match && !className;

                if (isInline) {
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }

                return (
                  <div className="relative my-8 overflow-hidden border-2 border-dubois-ink shadow-[3px_3px_0_0_rgba(26,26,26,0.8)] group">
                    {/* Terminal header bar - Du Bois style */}
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-dubois-ink border-b-2 border-dubois-ink">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 bg-dubois-carmine" />
                        <div className="w-3 h-3 bg-dubois-gold" />
                        <div className="w-3 h-3 bg-dubois-emerald" />
                      </div>
                      {match && (
                        <span className="ml-auto text-[10px] font-mono text-dubois-cream uppercase tracking-[0.15em]">
                          {match[1]}
                        </span>
                      )}
                    </div>
                    <SyntaxHighlighter
                      style={duboisSyntaxTheme}
                      language={match ? match[1] : 'text'}
                      PreTag="div"
                      showLineNumbers={false}
                      wrapLines={false}
                      useInlineStyles={true}
                      customStyle={{
                        margin: 0,
                        borderRadius: 0,
                        background: '#F5F0E6',
                        border: 'none',
                        padding: '1.5rem',
                        textIndent: 0,
                      }}
                      codeTagProps={{
                        style: {
                          background: 'none',
                          border: 'none',
                          textIndent: 0,
                          display: 'block',
                        }
                      }}
                    >
                      {String(children).replace(/\n$/, '').replace(/^\s+/, '')}
                    </SyntaxHighlighter>
                  </div>
                );
              },
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        {/* Article footer */}
        <footer className="mt-16 pt-8 border-t-2 border-dubois-ink">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm text-dubois-charcoal hover:text-dubois-carmine transition-colors duration-300 group"
            >
              <svg
                className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="dubois-heading text-xs">Back to All Posts</span>
            </Link>

            <div className="flex items-center gap-3 text-xs font-mono text-dubois-charcoal">
              <span>{wordCount.toLocaleString()} words</span>
              <span className="text-dubois-tan">·</span>
              <span>{readingTime} min read</span>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
};

export default BlogPost;
