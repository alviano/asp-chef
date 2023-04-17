export const consts = {
  DEBUG: import.meta.env.VITE_DEBUG === 'true',
  DOMAIN: import.meta.env.VITE_DOMAIN,
  PURIFY_LOG_ERRORS: import.meta.env.VITE_PURIFY_LOG_ERRORS === 'true',
  PURIFY_EXTERNAL_LINK_PREFIXES: [
    'https://ssd2020.pythonanywhere.com/',
    'https://cod.alviano.org/',
  ],
  PURIFY_ALLOWED_TAGS: ['a', 'body', 'code', 'em', 'img', 'li', 'ol', 'p', 'pre', 'strong', 'ul', '#text'],
  PURIFY_ALLOWED_ATTR: ['alt', 'class', 'href', 'src'],
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
