export const queryKeys = {
  gallery: {
    all: ['gallery'] as const,
    discovery: ['gallery', 'discovery'] as const,
    detail: (slug: string) => ['gallery', 'detail', slug] as const,
    items: (slug: string) => ['gallery', 'items', slug] as const,
  },
};
