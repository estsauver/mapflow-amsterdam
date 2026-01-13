import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { getPostBySlug } from '../lib/blog';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

// USGC-inspired "RETICLE" theme - industrial fluorescent aesthetic
const usgcReticleTheme: { [key: string]: React.CSSProperties } = {
  'code[class*="language-"]': {
    color: '#00A645',
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
    color: '#00A645',
    background: '#000000',
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
    borderRadius: '0.5rem',
  },
  'comment': { color: '#666666', fontStyle: 'italic' },
  'prolog': { color: '#666666' },
  'doctype': { color: '#666666' },
  'cdata': { color: '#666666' },
  'punctuation': { color: '#00A645' },
  'namespace': { opacity: 0.7 },
  'property': { color: '#00FFFF' },
  'tag': { color: '#00FFFF' },
  'boolean': { color: '#00FFFF' },
  'number': { color: '#00FFFF' },
  'constant': { color: '#00FFFF' },
  'symbol': { color: '#00FFFF' },
  'deleted': { color: '#FF0000' },
  'selector': { color: '#FFBF00' },
  'attr-name': { color: '#FFBF00' },
  'string': { color: '#FFBF00' },
  'char': { color: '#FFBF00' },
  'builtin': { color: '#FFBF00' },
  'inserted': { color: '#00FF00' },
  'operator': { color: '#FFFFFF' },
  'entity': { color: '#FFFFFF', cursor: 'help' },
  'url': { color: '#FFFFFF' },
  'atrule': { color: '#FF0000' },
  'attr-value': { color: '#FFBF00' },
  'keyword': { color: '#FF0000' },
  'function': { color: '#FF00FF' },
  'class-name': { color: '#FF00FF' },
  'regex': { color: '#FF6600' },
  'important': { color: '#FF6600', fontWeight: 'bold' },
  'variable': { color: '#FF6600' },
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-slate-900 z-50">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Subtle grain texture overlay */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />

      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-amber-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

      {/* Table of Contents - hidden on mobile, sticky on desktop */}
      {tableOfContents.length > 0 && (
        <nav className="hidden xl:block fixed left-8 top-32 w-56 max-h-[calc(100vh-12rem)] overflow-y-auto z-40">
          <div className="border-l border-slate-800/50 pl-4">
            <span className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.2em] mb-4 block">
              On this page
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
                        ? 'text-amber-400'
                        : 'text-slate-500 hover:text-slate-300'
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
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-amber-400 transition-colors duration-300 mb-16 group animate-fade-in"
        >
          <svg
            className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          All posts
        </Link>

        {/* Article header */}
        <header className="mb-12 animate-slide-up">
          {/* Meta info row */}
          <div className="flex items-center gap-4 mb-6">
            <time className="text-xs text-slate-500 font-mono tabular-nums">
              {new Date(post.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            <span className="text-slate-700">·</span>
            <span className="text-xs text-slate-500 font-mono">{readingTime} min read</span>
            <span className="text-slate-700">·</span>
            <span className="text-xs text-slate-600 font-mono">{wordCount.toLocaleString()} words</span>
          </div>

          <h1 className="font-fraunces text-4xl md:text-5xl lg:text-6xl font-medium text-white leading-[1.1] tracking-tight mb-8">
            {post.title}
          </h1>

          {post.description && (
            <p className="text-xl md:text-2xl text-slate-400 leading-relaxed font-light">
              {post.description}
            </p>
          )}
        </header>

        {/* Decorative divider */}
        <div className="flex items-center gap-4 mb-14 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
          <div className="flex gap-1">
            <div className="w-1 h-1 rounded-full bg-amber-500/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/70" />
            <div className="w-1 h-1 rounded-full bg-amber-500/40" />
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-slate-800 to-transparent" />
        </div>

        {/* Article content */}
        <div className="
          prose prose-lg prose-invert max-w-none animate-slide-up

          prose-headings:font-fraunces prose-headings:font-medium prose-headings:tracking-tight
          prose-h2:text-2xl prose-h2:text-slate-100 prose-h2:mt-16 prose-h2:mb-6 prose-h2:relative
          prose-h2:before:absolute prose-h2:before:-left-4 prose-h2:before:top-0 prose-h2:before:bottom-0
          prose-h2:before:w-1 prose-h2:before:bg-amber-500/50 prose-h2:before:rounded-full
          prose-h3:text-xl prose-h3:text-slate-200 prose-h3:mt-12 prose-h3:mb-4
          prose-h4:text-lg prose-h4:text-slate-300 prose-h4:mt-8 prose-h4:mb-3

          prose-p:text-slate-300 prose-p:leading-[1.8] prose-p:mb-6

          prose-a:text-amber-400 prose-a:no-underline prose-a:border-b prose-a:border-amber-400/30
          hover:prose-a:border-amber-400 prose-a:transition-colors

          prose-strong:text-slate-200 prose-strong:font-semibold
          prose-em:text-slate-300 prose-em:italic

          prose-code:text-[#00A645] prose-code:bg-black prose-code:px-1.5 prose-code:py-0.5
          prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
          prose-code:border prose-code:border-[#00A645]/20

          prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0

          prose-blockquote:border-none prose-blockquote:bg-transparent
          prose-blockquote:p-0 prose-blockquote:not-italic prose-blockquote:my-0

          prose-ul:text-slate-300 prose-ol:text-slate-300
          prose-li:marker:text-amber-500/50 prose-li:my-2

          prose-hr:border-slate-800 prose-hr:my-12
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
                  <figure className="my-12 not-prose">
                    <blockquote
                      className="relative py-8 px-10 bg-slate-800/60 rounded-2xl border border-slate-700/50 shadow-xl [&>p]:before:content-none [&>p]:after:content-none"
                      {...props}
                    >
                      {/* Large decorative quotation mark */}
                      <svg
                        className="absolute top-6 left-6 w-12 h-12 text-amber-500/30"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                      </svg>
                      <div className="relative pl-10 text-slate-200 text-lg md:text-xl leading-relaxed font-light italic [&>p]:mb-4 [&>p:last-child]:mb-0 [&>p]:before:content-none [&>p]:after:content-none [&_a]:text-amber-400 [&_a]:not-italic [&_a]:font-normal [&_a]:no-underline [&_a]:border-b [&_a]:border-amber-400/30 hover:[&_a]:border-amber-400">
                        {children}
                      </div>
                    </blockquote>
                  </figure>
                );
              },
              code({ node, className, children, ...props }) {
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
                  <div className="relative my-8 rounded-lg overflow-hidden border border-[#00A645]/30 shadow-xl shadow-black/40 group">
                    {/* Terminal header bar */}
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-black border-b border-[#00A645]/20">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-[#FF0000]/80 group-hover:bg-[#FF0000] transition-colors" />
                        <div className="w-3 h-3 rounded-full bg-[#FFBF00]/80 group-hover:bg-[#FFBF00] transition-colors" />
                        <div className="w-3 h-3 rounded-full bg-[#00A645]/80 group-hover:bg-[#00A645] transition-colors" />
                      </div>
                      {match && (
                        <span className="ml-auto text-[10px] font-mono text-[#00A645]/60 uppercase tracking-[0.15em]">
                          {match[1]}
                        </span>
                      )}
                    </div>
                    <SyntaxHighlighter
                      style={usgcReticleTheme}
                      language={match ? match[1] : 'text'}
                      PreTag="div"
                      showLineNumbers={false}
                      wrapLines={false}
                      useInlineStyles={true}
                      customStyle={{
                        margin: 0,
                        borderRadius: 0,
                        background: '#000000',
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
        <footer className="mt-20 pt-10 border-t border-slate-800/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-amber-400 transition-colors duration-300 group"
            >
              <svg
                className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to all posts
            </Link>

            <div className="flex items-center gap-3 text-xs font-mono text-slate-600">
              <span>{wordCount.toLocaleString()} words</span>
              <span className="text-slate-700">·</span>
              <span>{readingTime} min read</span>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
};

export default BlogPost;
