// GET /api/comments/:slug - Fetch comments for a blog post

interface Env {
  DB: D1Database;
}

interface Comment {
  id: number;
  post_slug: string;
  author_name: string;
  content: string;
  created_at: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { slug } = context.params;

  if (!slug || typeof slug !== 'string') {
    return new Response(JSON.stringify({ error: 'Invalid slug' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { results } = await context.env.DB.prepare(
      'SELECT id, post_slug, author_name, content, created_at FROM comments WHERE post_slug = ? ORDER BY created_at DESC'
    )
      .bind(slug)
      .all<Comment>();

    return new Response(JSON.stringify({ comments: results }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch comments' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
