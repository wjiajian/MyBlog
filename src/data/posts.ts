import futureOfReactMd from '../content/future-of-react.md';

export interface Post {
  id: string;
  title: string;
  year: number;
  date: string;
  description: string;
  coverImage: string;
  link: string;
  content?: string; // Markdown content
}

export const posts: Post[] = [
  {
    id: 'post-1',
    title: 'The Future of React',
    year: 2026,
    date: 'Jan 15',
    description: 'Exploring Server Components, Actions, and the new compiler architecture.',
    coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1000&auto=format&fit=crop',
    link: '/posts/post-1',
    content: futureOfReactMd,
  },
  {
    id: 'post-2',
    title: 'CSS Anchoring Is Here',
    year: 2026,
    date: 'Mar 22',
    description: 'How to use the new Anchor Positioning API to create complex layouts without JS.',
    coverImage: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?q=80&w=1000&auto=format&fit=crop',
    link: '/posts/post-2',
  },
  {
    id: 'post-3',
    title: 'Rust for Web Devs',
    year: 2025,
    date: 'Nov 08',
    description: 'A practical guide to getting started with Rust for JavaScript developers.',
    coverImage: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=1000&auto=format&fit=crop',
    link: '/posts/post-3',
  },
  {
    id: 'post-4',
    title: 'Design Systems at Scale',
    year: 2025,
    date: 'Sep 14',
    description: 'Lessons learned from maintaining a design system used by 50+ teams.',
    coverImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=1000&auto=format&fit=crop',
    link: '/posts/post-4',
  },
  {
    id: 'post-5',
    title: 'Micro-Interactions',
    year: 2025,
    date: 'Jun 30',
    description: 'Why the small details matter and how to implement them with Framer Motion.',
    coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop',
    link: '/posts/post-5',
  },
  {
    id: 'post-6',
    title: 'AI in 2024',
    year: 2024,
    date: 'Dec 10',
    description: 'Reflecting on a year of explosive growth in generative AI tools.',
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop',
    link: '/posts/post-6',
  },
  {
    id: 'post-7',
    title: 'Understanding Color Space',
    year: 2024,
    date: 'Aug 05',
    description: 'Deep dive into OKLCH, P3, and the future of color on the web.',
    coverImage: 'https://images.unsplash.com/photo-1502691876148-a84978e59af8?q=80&w=1000&auto=format&fit=crop',
    link: '/posts/post-7',
  },
  {
    id: 'post-8',
    title: 'The Indie Web',
    year: 2023,
    date: 'May 20',
    description: 'Why owning your content is more important than ever.',
    coverImage: 'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?q=80&w=1000&auto=format&fit=crop',
    link: '/posts/post-8',
  }
];
