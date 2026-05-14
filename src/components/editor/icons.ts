const COMP_ICONS: Record<string, string> = {
  input:
    '<svg viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><line x1="5" y1="9" x2="15" y2="9" stroke="currentColor" stroke-width="1.5"/></svg>',
  textarea:
    '<svg viewBox="0 0 20 20" fill="none"><rect x="2" y="3" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><line x1="5" y1="7" x2="15" y2="7" stroke="currentColor" stroke-width="1.5"/><line x1="5" y1="10" x2="13" y2="10" stroke="currentColor" stroke-width="1"/><line x1="5" y1="13" x2="13" y2="13" stroke="currentColor" stroke-width="1"/><line x1="5" y1="16" x2="10" y2="16" stroke="currentColor" stroke-width="1"/></svg>',
  number:
    '<svg viewBox="0 0 20 20" fill="none"><rect x="2" y="6" width="16" height="8" rx="2" stroke="currentColor" stroke-width="1.5"/><text x="10" y="13" text-anchor="middle" font-size="8" fill="currentColor" font-weight="600">#</text></svg>',
  switch:
    '<svg viewBox="0 0 20 20" fill="none"><rect x="4" y="6" width="12" height="8" rx="4" stroke="currentColor" stroke-width="1.5"/><circle cx="7" cy="10" r="3" fill="currentColor"/></svg>',
  radio:
    '<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="6" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10" r="3.5" fill="currentColor"/></svg>',
  select:
    '<svg viewBox="0 0 20 20" fill="none"><rect x="3" y="5" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><polyline points="7,8 10,12 13,8" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
  date: '<svg viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" stroke-width="1.5"/><line x1="3" y1="9" x2="17" y2="9" stroke="currentColor" stroke-width="1.5"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" stroke-width="1.5"/></svg>',
  rate: '<svg viewBox="0 0 20 20" fill="none"><polygon points="10,3 12.5,8 18,9 14,13 15,18.5 10,16 5,18.5 6,13 2,9 7.5,8" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>',
  checkbox:
    '<svg viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="3" stroke="currentColor" stroke-width="1.5"/><polyline points="6,10 9,13 14,7" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
  'time-picker':
    '<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/><polyline points="10,6 10,10 13,13" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>',
  address:
    '<svg viewBox="0 0 20 20" fill="none"><path d="M10 2C6.69 2 4 4.69 4 8c0 4.2 6 10 6 10s6-5.8 6-10c0-3.31-2.69-6-6-6z" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/></svg>',
  signature:
    '<svg viewBox="0 0 20 20" fill="none"><path d="M3 14c2-4 4-7 8-7s4 2 6 5" stroke="currentColor" stroke-width="1.5" fill="none"/><line x1="4" y1="17" x2="16" y2="17" stroke="currentColor" stroke-width="1.5"/></svg>',
  upload:
    '<svg viewBox="0 0 20 20" fill="none"><path d="M10 14V6" stroke="currentColor" stroke-width="1.5"/><polyline points="7,9 10,6 13,9" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M4 14v2a2 2 0 002 2h8a2 2 0 002-2v-2" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>',
  divider:
    '<svg viewBox="0 0 20 20" fill="none"><line x1="4" y1="10" x2="16" y2="10" stroke="currentColor" stroke-width="1.5"/></svg>',
  'submit-button':
    '<svg viewBox="0 0 20 20" fill="none"><rect x="3" y="5" width="14" height="10" rx="3" stroke="currentColor" stroke-width="1.5"/><polyline points="7,10 9,12 13,8" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
  'page-break':
    '<svg viewBox="0 0 20 20" fill="none"><line x1="4" y1="6" x2="16" y2="6" stroke="currentColor" stroke-width="1.5"/><line x1="4" y1="11" x2="16" y2="11" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2"/><line x1="4" y1="14" x2="16" y2="14" stroke="currentColor" stroke-width="1.5"/></svg>',
  slider:
    '<svg viewBox="0 0 20 20" fill="none"><line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10" r="4" fill="currentColor"/></svg>',
  'rich-text':
    '<svg viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><line x1="6" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="1"/><line x1="6" y1="10" x2="14" y2="10" stroke="currentColor" stroke-width="1"/><line x1="6" y1="12" x2="11" y2="12" stroke="currentColor" stroke-width="1"/></svg>',
  matrix:
    '<svg viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/><line x1="2" y1="8" x2="18" y2="8" stroke="currentColor" stroke-width="1"/><line x1="2" y1="14" x2="18" y2="14" stroke="currentColor" stroke-width="1"/><line x1="8" y1="2" x2="8" y2="18" stroke="currentColor" stroke-width="1"/><line x1="14" y1="2" x2="14" y2="18" stroke="currentColor" stroke-width="1"/></svg>',
  'matrix-fill':
    '<svg viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/><line x1="2" y1="7" x2="18" y2="7" stroke="currentColor" stroke-width="1"/><line x1="2" y1="12" x2="18" y2="12" stroke="currentColor" stroke-width="1"/><line x1="7" y1="2" x2="7" y2="18" stroke="currentColor" stroke-width="1"/><line x1="12" y1="2" x2="12" y2="18" stroke="currentColor" stroke-width="1"/><rect x="8" y="8" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.3"/></svg>',
  nps: '<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M10 3a7 7 0 010 14" stroke="currentColor" stroke-width="1.5" fill="none"/><line x1="10" y1="3" x2="10" y2="17" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10" r="2" fill="currentColor"/></svg>',
  ranking:
    '<svg viewBox="0 0 20 20" fill="none"><line x1="4" y1="6" x2="16" y2="6" stroke="currentColor" stroke-width="1.5"/><line x1="4" y1="10" x2="14" y2="10" stroke="currentColor" stroke-width="1.5"/><line x1="4" y1="14" x2="12" y2="14" stroke="currentColor" stroke-width="1.5"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="10" r="1" fill="currentColor"/><circle cx="3" cy="14" r="1" fill="currentColor"/></svg>',
}

export function getCompIcon(type: string): string {
  return COMP_ICONS[type] || ''
}
