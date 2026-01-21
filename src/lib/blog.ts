import claudeCodeWorkflow from '../content/blog/claude-code-workflow.md?raw';
import demoCreator from '../content/blog/demo-creator.md?raw';
import scalingVisualizations from '../content/blog/scaling-visualizations.md?raw';

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  description: string;
  content: string;
}

function parseFrontmatter(markdown: string): { frontmatter: Record<string, string>; content: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, content: markdown };
  }

  const frontmatterLines = match[1].split('\n');
  const frontmatter: Record<string, string> = {};

  for (const line of frontmatterLines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      // Remove surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      frontmatter[key] = value;
    }
  }

  return { frontmatter, content: match[2] };
}

function parsePost(rawContent: string, defaultSlug: string): BlogPost {
  const { frontmatter, content } = parseFrontmatter(rawContent);

  return {
    slug: frontmatter.slug || defaultSlug,
    title: frontmatter.title || 'Untitled',
    date: frontmatter.date || new Date().toISOString().split('T')[0],
    description: frontmatter.description || '',
    content,
  };
}

// All blog posts - add new posts here
const rawPosts: { raw: string; defaultSlug: string }[] = [
  { raw: scalingVisualizations, defaultSlug: 'scaling-visualizations' },
  { raw: demoCreator, defaultSlug: 'demo-creator' },
  { raw: claudeCodeWorkflow, defaultSlug: 'claude-code-workflow' },
];

export const posts: BlogPost[] = rawPosts
  .map(({ raw, defaultSlug }) => parsePost(raw, defaultSlug))
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export function getAllPosts(): BlogPost[] {
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find(post => post.slug === slug);
}
