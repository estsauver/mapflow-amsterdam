import React from 'react';
import { Link } from 'react-router-dom';
import { getAllPosts } from '../lib/blog';

const Blog = () => {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Subtle grain texture overlay */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />

      {/* Ambient glow effect */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-amber-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-2xl mx-auto px-6 py-16 md:py-24">
        {/* Back link */}
        <Link
          to="/"
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
          Back to home
        </Link>

        {/* Header */}
        <header className="mb-20 animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-px bg-gradient-to-r from-amber-500/80 to-transparent" />
            <span className="text-xs font-mono text-amber-500/60 uppercase tracking-[0.2em]">Blog</span>
          </div>
          <h1 className="font-fraunces text-5xl md:text-6xl font-medium text-white mb-6 tracking-tight">
            Writing
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-md">
            Notes on building software, tooling experiments, and lessons learned along the way.
          </p>
        </header>

        {/* Posts list */}
        <div className="space-y-2">
          {posts.map((post, index) => (
            <article
              key={post.slug}
              className="group animate-slide-up"
              style={{ animationDelay: `${150 + index * 100}ms`, animationFillMode: 'backwards' }}
            >
              <Link
                to={`/blog/${post.slug}`}
                className="block relative py-6 pl-6 -mx-4 px-4 rounded-xl transition-all duration-500 hover:bg-gradient-to-r hover:from-amber-500/[0.05] hover:to-transparent"
              >
                {/* Left accent bar */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 rounded-full bg-slate-800 group-hover:bg-amber-500/70 group-hover:h-12 transition-all duration-300" />

                <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-6">
                  <div className="flex items-center gap-3 md:flex-col md:items-start md:gap-1 shrink-0 md:w-24">
                    <time className="text-xs text-slate-600 font-mono tabular-nums">
                      {new Date(post.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </time>
                    <span className="md:hidden text-slate-700">·</span>
                    <span className="text-[10px] font-mono text-slate-700 uppercase tracking-wider md:mt-1">
                      {Math.ceil(post.content.split(/\s+/).length / 200)} min read
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-fraunces text-xl md:text-2xl text-slate-200 group-hover:text-amber-300 transition-colors duration-300 mb-2 leading-snug">
                      {post.title}
                    </h2>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">
                      {post.description}
                    </p>
                  </div>
                  <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full border border-slate-800 group-hover:border-amber-500/50 group-hover:bg-amber-500/10 transition-all duration-300 shrink-0 mt-1">
                    <svg
                      className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-all duration-300 group-hover:translate-x-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-slate-800/30">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-600 font-mono">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'}
            </p>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500/60 animate-pulse" />
              <span className="text-xs text-slate-600 font-mono">Writing more soon</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Blog;
