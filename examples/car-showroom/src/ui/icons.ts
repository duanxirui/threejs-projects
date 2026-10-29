/**
 * CAR ATELIER icon language.
 * Self-contained vector icons with consistent 24px geometry, rounded joins,
 * and a 1.7px stroke. Accessible names belong to the parent controls.
 */
const paths = {
  brand: '<path d="M12 1.8 22.2 12 12 22.2 1.8 12 12 1.8Z" opacity=".68" /><path d="m7.4 16 4.6-8 4.6 8M9.7 12.9h4.6" /><path d="M8.5 18.2h7" opacity=".55" />',
  eye: '<path d="M2.3 12s3.7-6.3 9.7-6.3 9.7 6.3 9.7 6.3-3.7 6.3-9.7 6.3S2.3 12 2.3 12Z" /><circle cx="12" cy="12" r="2.8" />',
  'eye-off': '<path d="M10.2 5.9c.6-.1 1.2-.2 1.8-.2 6 0 9.7 6.3 9.7 6.3a17 17 0 0 1-2.8 3.3" /><path d="M6.5 7.3A17 17 0 0 0 2.3 12s3.7 6.3 9.7 6.3c1.7 0 3.2-.5 4.5-1.2" /><path d="M9.4 9.4a3.7 3.7 0 0 0 5.2 5.2M3 3l18 18" />',
  expand: '<path d="M8.5 3.5h-5v5M15.5 3.5h5v5M3.5 15.5v5h5M20.5 15.5v5h-5" />',
  shrink: '<path d="M3.5 8.5h5v-5M20.5 8.5h-5v-5M8.5 20.5v-5h-5M15.5 20.5v-5h5" />',
  info: '<circle cx="12" cy="12" r="9" /><path d="M12 10.8v5.2M12 7.8h.01" />',
  controls: '<path d="M4 6h16M4 12h16M4 18h16" /><circle cx="9" cy="6" r="2.2" fill="#101820" /><circle cx="16" cy="12" r="2.2" fill="#101820" /><circle cx="10.5" cy="18" r="2.2" fill="#101820" />',
  collection: '<path d="m4.1 14.5 1.5-4.4c.3-.9 1.2-1.5 2.2-1.5h8.4c1 0 1.9.6 2.2 1.5l1.5 4.4" /><path d="M4.2 14.5H19.8c.7 0 1.2.5 1.2 1.2v2.1c0 .7-.5 1.2-1.2 1.2H4.2c-.7 0-1.2-.5-1.2-1.2v-2.1c0-.7.5-1.2 1.2-1.2Z" /><path d="M6.5 19v1.5M17.5 19v1.5M6.6 16.6h2.2M15.2 16.6h2.2" />',
  'chevron-down': '<path d="m6.5 9.5 5.5 5.5 5.5-5.5" />',
  'chevron-left': '<path d="m14.5 5.5-6.5 6.5 6.5 6.5" />',
  'chevron-right': '<path d="m9.5 5.5 6.5 6.5-6.5 6.5" />',
  close: '<path d="M5.5 5.5 18.5 18.5M18.5 5.5 5.5 18.5" />',
  camera: '<path d="M4 7.5h3l1.5-2h7l1.5 2h3c.8 0 1.5.7 1.5 1.5v9.5c0 .8-.7 1.5-1.5 1.5H4c-.8 0-1.5-.7-1.5-1.5V9c0-.8.7-1.5 1.5-1.5Z" /><circle cx="12" cy="13.2" r="3.5" />',
  palette: '<path d="M12 2.5a9.5 9.5 0 0 0 0 19h1.5c1.5 0 2.3-1.4 1.5-2.5-.9-1.2 0-2.5 1.4-2.5h2A3.3 3.3 0 0 0 21.5 13 9.5 9.5 0 0 0 12 2.5Z" /><circle cx="7.3" cy="11.1" r=".9" fill="currentColor" stroke="none" /><circle cx="9.5" cy="6.8" r=".9" fill="currentColor" stroke="none" /><circle cx="14.5" cy="6.9" r=".9" fill="currentColor" stroke="none" /><circle cx="17.4" cy="10.9" r=".9" fill="currentColor" stroke="none" />',
  orbit: '<circle cx="12" cy="12" r="2.5" /><ellipse cx="12" cy="12" rx="9" ry="5.4" transform="rotate(-35 12 12)" /><path d="m16.9 3.8 2.2.2-.5 2.2" />',
  front: '<path d="m5.1 15 1.3-4.5c.3-1.1 1.1-1.8 2.3-1.8h6.6c1.2 0 2 .7 2.3 1.8l1.3 4.5" /><path d="M4.3 15h15.4c.7 0 1.3.6 1.3 1.3v2.1H3v-2.1c0-.7.6-1.3 1.3-1.3Z" /><path d="M6.4 16.7h2.3M15.3 16.7h2.3M5.3 18.4v2M18.7 18.4v2" />',
  side: '<path d="m2.5 14.2 2.5-.6 2.9-4.2c.4-.6 1.1-1 1.8-1h5.1c.7 0 1.3.3 1.8.9l3.1 4.3 1.8.6v4.1H2.5v-4.1Z" /><path d="M8 13.4h8.4M6.2 18.3a1.7 1.7 0 1 0 3.4 0M16 18.3a1.7 1.7 0 1 0 3.4 0" />',
  rear: '<path d="m5.2 14.9 1.1-4.2c.3-1.1 1.2-1.8 2.3-1.8h6.8c1.1 0 2 .7 2.3 1.8l1.1 4.2" /><rect x="3" y="14.9" width="18" height="3.8" rx="1.1" /><path d="M5.9 16.7h3.2M14.9 16.7h3.2M5.2 18.7v1.7M18.8 18.7v1.7" />',
  reset: '<path d="M3.9 10.1A8.4 8.4 0 1 1 4.5 16" /><path d="M3.9 4.7v5.4h5.4" />',
  move: '<path d="M4 12h16M7.4 8.6 4 12l3.4 3.4M16.6 8.6 20 12l-3.4 3.4" /><path d="M12 5.5v13" opacity=".35" />',
  'arrow-up-right': '<path d="M5 19 19 5M8 5h11v11" />',
  globe: '<circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />',
  check: '<path d="m5 12.5 4.3 4.3L19 7.5" />',
} as const;

export type IconName = keyof typeof paths;

/** Icons use only fixed local names and classes. */
export function icon(name: IconName, extraClass = ''): string {
  const classes = ['ui-icon', 'ui-icon-' + name, extraClass].filter(Boolean).join(' ');
  return '<svg class="' + classes
    + '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"'
    + ' fill="none" stroke="currentColor" stroke-width="1.7"'
    + ' stroke-linecap="round" stroke-linejoin="round"'
    + ' aria-hidden="true" focusable="false">'
    + paths[name] + '</svg>';
}
