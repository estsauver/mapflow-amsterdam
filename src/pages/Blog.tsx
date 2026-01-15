import React from 'react';
import { Link } from 'react-router-dom';
import { getAllPosts } from '../lib/blog';
import DuBoisColorBar from '../components/DuBoisColorBar';

const Blog = () => {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-dubois-parchment overflow-hidden">
      {/* Subtle paper texture overlay */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />

      <div className="relative max-w-2xl mx-auto px-6 py-16 md:py-24">
        {/* Back link */}
        <Link
          to="/"
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
          <span className="dubois-heading text-xs">Back to Home</span>
        </Link>

        {/* Header Panel */}
        <header className="dubois-panel mb-12 animate-slide-up overflow-hidden">
          <DuBoisColorBar />
          <div className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-0.5 bg-dubois-carmine" />
              <span className="text-xs font-mono text-dubois-charcoal uppercase tracking-[0.2em]">Writing</span>
            </div>
            <h1 className="dubois-title text-4xl md:text-5xl text-dubois-ink mb-4">
              Blog
            </h1>
            <p className="text-dubois-charcoal leading-relaxed">
              Notes on building software, tooling experiments, and lessons learned along the way.
            </p>
          </div>
        </header>

        {/* Posts list */}
        <div className="space-y-4">
          {posts.map((post, index) => (
            <article
              key={post.slug}
              className="group animate-slide-up"
              style={{ animationDelay: `${150 + index * 100}ms`, animationFillMode: 'backwards' }}
            >
              <Link
                to={`/blog/${post.slug}`}
                className="block dubois-panel p-6 transition-all duration-300 hover:shadow-[4px_4px_0_0_rgba(26,26,26,0.9)] hover:-translate-x-0.5 hover:-translate-y-0.5"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Date column */}
                  <div className="flex items-center gap-3 md:flex-col md:items-start md:gap-1 shrink-0 md:w-24">
                    <time className="text-xs text-dubois-charcoal font-mono tabular-nums">
                      {new Date(post.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </time>
                    <span className="md:hidden text-dubois-tan">·</span>
                    <span className="text-[10px] font-mono text-dubois-sepia uppercase tracking-wider md:mt-1">
                      {Math.ceil(post.content.split(/\s+/).length / 200)} min
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h2 className="dubois-title text-lg md:text-xl text-dubois-ink group-hover:text-dubois-carmine transition-colors duration-300 mb-2">
                      {post.title}
                    </h2>
                    <p className="text-dubois-charcoal text-sm leading-relaxed line-clamp-2">
                      {post.description}
                    </p>
                  </div>

                  {/* Arrow indicator */}
                  <div className="hidden md:flex items-center justify-center w-10 h-10 border-2 border-dubois-ink bg-dubois-cream group-hover:bg-dubois-carmine group-hover:border-dubois-carmine transition-all duration-300 shrink-0">
                    <svg
                      className="w-4 h-4 text-dubois-ink group-hover:text-dubois-warm-white transition-all duration-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t-2 border-dubois-ink">
          <div className="flex items-center justify-between">
            <p className="text-xs text-dubois-charcoal font-mono">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'}
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-dubois-emerald" />
              <span className="text-xs text-dubois-charcoal font-mono">Writing more soon</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Blog;
