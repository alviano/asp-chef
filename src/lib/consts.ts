export const consts = {
  DEBUG: import.meta.env.VITE_DEBUG === 'true',
  DOMAIN: import.meta.env.VITE_DOMAIN,
  PURIFY_LOG_ERRORS: import.meta.env.VITE_PURIFY_LOG_ERRORS === 'true',
  PURIFY_EXTERNAL_LINK_PREFIXES: [
    'https://ssd2020.pythonanywhere.com/',
    'https://cod.alviano.org/',
  ],
  PURIFY_ALLOWED_TAGS: 'a blockquote body br code em h1 h2 h3 h4 h5 h6 hr img li ol p pre span strong table tbody td th thead tr ul #text'.split(' '),
  PURIFY_ALLOWED_ATTR: 'alt class href src style title'.split(' '),
  SYMBOLS: {
    CHECK_MARK: '✔',
    CROSS_MARK: '✘',
    CRYING_FACE: '😢',
    THUMB_UP: '👍',
    LOCKED: '🔒',
    UNLOCKED: '🔓',
    MODELS_SEPARATOR: '§',
    SEARCH_FAIL: '§',
    NEW_LINE: '⏎',
  },
};
