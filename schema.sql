-- D1 Database Schema for Blog Comments
-- Run this to create the database:
--   wrangler d1 create blog-comments
--   wrangler d1 execute blog-comments --file=./schema.sql

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_slug TEXT NOT NULL,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  -- Index for fast lookups by post
  CONSTRAINT valid_slug CHECK (length(post_slug) <= 200),
  CONSTRAINT valid_name CHECK (length(author_name) <= 100),
  CONSTRAINT valid_content CHECK (length(content) <= 2000)
);

-- Index for fetching comments by post slug
CREATE INDEX IF NOT EXISTS idx_comments_post_slug ON comments(post_slug);

-- Index for ordering by date
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
