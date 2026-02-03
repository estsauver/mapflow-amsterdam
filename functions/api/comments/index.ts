// POST /api/comments - Create a new comment

interface Env {
  DB: D1Database;
}

interface CommentInput {
  post_slug: string;
  author_name: string;
  content: string;
}

// Simple validation
function validateInput(data: unknown): data is CommentInput {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.post_slug === 'string' &&
    obj.post_slug.length > 0 &&
    obj.post_slug.length <= 200 &&
    typeof obj.author_name === 'string' &&
    obj.author_name.length > 0 &&
    obj.author_name.length <= 100 &&
    typeof obj.content === 'string' &&
    obj.content.length > 0 &&
    obj.content.length <= 2000
  );
}

// Basic rate limiting using CF headers
function isRateLimited(request: Request): boolean {
  // Cloudflare provides rate limiting info - for now we'll do basic check
  // In production, you'd use Cloudflare's rate limiting or a KV-based solution
  return false;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  // Handle CORS preflight
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (isRateLimited(context.request)) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await context.request.json();

    if (!validateInput(body)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid input. Required: post_slug (max 200), author_name (max 100), content (max 2000)'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { post_slug, author_name, content } = body;

    // Sanitize content (basic XSS prevention - content is displayed as text, not HTML)
    const sanitizedContent = content.trim();
    const sanitizedName = author_name.trim();

    const result = await context.env.DB.prepare(
      'INSERT INTO comments (post_slug, author_name, content, created_at) VALUES (?, ?, ?, datetime("now")) RETURNING id, post_slug, author_name, content, created_at'
    )
      .bind(post_slug, sanitizedName, sanitizedContent)
      .first();

    return new Response(JSON.stringify({ comment: result }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return new Response(JSON.stringify({ error: 'Failed to create comment' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Handle OPTIONS for CORS
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
