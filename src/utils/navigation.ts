export interface OpenPostLinkOptions {
  newTab?: boolean;
}

export const NEW_TAB_LINK_PROPS = {
  target: '_blank',
  rel: 'noopener noreferrer',
} as const;

export function openPostLink(link: string, options: OpenPostLinkOptions = {}): void {
  if (!link || typeof window === 'undefined') return;

  if (options.newTab) {
    window.open(link, '_blank', 'noopener,noreferrer');
    return;
  }

  window.location.assign(link);
}
