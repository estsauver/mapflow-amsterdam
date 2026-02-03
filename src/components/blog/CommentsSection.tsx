import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send, User, Loader2 } from 'lucide-react';
import DuBoisColorBar from '../DuBoisColorBar';

interface Comment {
  id: number;
  post_slug: string;
  author_name: string;
  content: string;
  created_at: string;
}

interface CommentsSectionProps {
  postSlug: string;
}

const API_BASE = '/api/comments';

async function fetchComments(slug: string): Promise<Comment[]> {
  const response = await fetch(`${API_BASE}/${slug}`);
  if (!response.ok) {
    throw new Error('Failed to fetch comments');
  }
  const data = await response.json();
  return data.comments;
}

async function postComment(data: { post_slug: string; author_name: string; content: string }): Promise<Comment> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to post comment');
  }
  const result = await response.json();
  return result.comment;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const CommentsSection = ({ postSlug }: CommentsSectionProps) => {
  const queryClient = useQueryClient();
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [formError, setFormError] = useState('');

  const { data: comments = [], isLoading, error } = useQuery({
    queryKey: ['comments', postSlug],
    queryFn: () => fetchComments(postSlug),
  });

  const mutation = useMutation({
    mutationFn: postComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postSlug] });
      setAuthorName('');
      setContent('');
      setFormError('');
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = authorName.trim();
    const trimmedContent = content.trim();

    if (!trimmedName) {
      setFormError('Please enter your name');
      return;
    }
    if (!trimmedContent) {
      setFormError('Please enter a comment');
      return;
    }
    if (trimmedName.length > 100) {
      setFormError('Name must be 100 characters or less');
      return;
    }
    if (trimmedContent.length > 2000) {
      setFormError('Comment must be 2000 characters or less');
      return;
    }

    mutation.mutate({
      post_slug: postSlug,
      author_name: trimmedName,
      content: trimmedContent,
    });
  };

  return (
    <section className="mt-16 pt-8 border-t-2 border-dubois-ink">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-8">
        <MessageSquare className="w-5 h-5 text-dubois-carmine" />
        <h2 className="dubois-heading text-lg text-dubois-ink">
          Comments {comments.length > 0 && `(${comments.length})`}
        </h2>
      </div>

      {/* Comment form */}
      <div className="dubois-panel mb-8 overflow-hidden">
        <DuBoisColorBar />
        <form onSubmit={handleSubmit} className="p-6">
          <h3 className="dubois-heading text-sm text-dubois-charcoal mb-4">
            Leave a Comment
          </h3>

          <div className="space-y-4">
            {/* Name input */}
            <div>
              <label htmlFor="author-name" className="block text-sm font-medium text-dubois-ink mb-1">
                Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dubois-charcoal" />
                <input
                  type="text"
                  id="author-name"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Your name"
                  maxLength={100}
                  className="w-full pl-10 pr-4 py-2 bg-dubois-cream border-2 border-dubois-ink text-dubois-ink placeholder:text-dubois-charcoal/50 focus:outline-none focus:ring-2 focus:ring-dubois-carmine focus:ring-offset-1"
                  disabled={mutation.isPending}
                />
              </div>
            </div>

            {/* Comment textarea */}
            <div>
              <label htmlFor="comment-content" className="block text-sm font-medium text-dubois-ink mb-1">
                Comment
              </label>
              <textarea
                id="comment-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts..."
                rows={4}
                maxLength={2000}
                className="w-full px-4 py-2 bg-dubois-cream border-2 border-dubois-ink text-dubois-ink placeholder:text-dubois-charcoal/50 focus:outline-none focus:ring-2 focus:ring-dubois-carmine focus:ring-offset-1 resize-none"
                disabled={mutation.isPending}
              />
              <div className="text-right text-xs text-dubois-charcoal mt-1">
                {content.length}/2000
              </div>
            </div>

            {/* Error message */}
            {formError && (
              <div className="text-sm text-dubois-carmine bg-dubois-carmine/10 border border-dubois-carmine px-3 py-2">
                {formError}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="dubois-btn inline-flex items-center gap-2 px-6 py-2 bg-dubois-prussian text-dubois-cream text-sm font-medium uppercase tracking-wider border-2 border-dubois-ink disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Post Comment
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Comments list */}
      <div className="space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8 text-dubois-charcoal">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Loading comments...</span>
          </div>
        )}

        {error && (
          <div className="dubois-panel p-4 bg-dubois-carmine/10 border-dubois-carmine">
            <p className="text-sm text-dubois-carmine">
              Unable to load comments. Please try again later.
            </p>
          </div>
        )}

        {!isLoading && !error && comments.length === 0 && (
          <div className="dubois-panel p-6 text-center">
            <MessageSquare className="w-8 h-8 text-dubois-charcoal/40 mx-auto mb-2" />
            <p className="text-sm text-dubois-charcoal">
              No comments yet. Be the first to share your thoughts!
            </p>
          </div>
        )}

        {comments.map((comment) => (
          <div key={comment.id} className="dubois-panel overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-dubois-gold via-dubois-carmine to-dubois-prussian" />
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-dubois-prussian flex items-center justify-center">
                    <span className="text-dubois-cream text-sm font-bold uppercase">
                      {comment.author_name.charAt(0)}
                    </span>
                  </div>
                  <span className="font-medium text-dubois-ink">
                    {comment.author_name}
                  </span>
                </div>
                <time className="text-xs text-dubois-charcoal font-mono">
                  {formatDate(comment.created_at)}
                </time>
              </div>
              <p className="text-dubois-ink leading-relaxed whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CommentsSection;
