export const RESERVED_USERNAMES = new Set([
  // System routes
  'admin', 'api', 'app', 'auth', 'dashboard',
  'login', 'signup', 'register', 'logout', 'signout',
  'forgot-password', 'reset-password', 'callback',

  // Infrastructure
  'www', 'mail', 'ftp', 'ssh', 'root', 'administrator',
  'superuser', 'sysadmin', 'webmaster', 'postmaster',
  'cdn', 'ns1', 'ns2', 'smtp', 'imap', 'pop',

  // Platform features
  'settings', 'profile', 'account', 'billing', 'pricing',
  'blog', 'post', 'posts', 'page', 'pages',
  'help', 'support', 'contact', 'about', 'faq',
  'terms', 'privacy', 'tos', 'legal', 'dmca', 'cookies',
  'search', 'explore', 'discover', 'trending', 'popular', 'featured',
  'feed', 'rss', 'atom', 'sitemap', 'robots',
  'static', 'assets', 'public', 'media', 'images', 'img', 'files', 'uploads',
  'tag', 'tags', 'category', 'categories', 'archive', 'archives',
  'user', 'users', 'member', 'members', 'author', 'authors',
  'home', 'index', 'default', 'welcome',

  // Dev / test
  'test', 'testing', 'demo', 'example', 'sample', 'debug', 'dev', 'staging',
  'null', 'undefined', 'true', 'false', 'none', 'nan',
  'localhost', 'internal',

  // Brand / official
  'nen2', 'nen', 'nenn', 'official', 'staff', 'team', 'system', 'bot',
  'news', 'info', 'status', 'docs', 'documentation', 'changelog',
  'community', 'forum', 'forums',

  // Actions
  'new', 'edit', 'delete', 'create', 'update', 'remove', 'manage',
  'config', 'configuration', 'install', 'setup',
  'subscribe', 'unsubscribe', 'notify', 'notifications',

  // Common / squatting prevention
  'god', 'jesus', 'allah', 'buddha',
  'anonymous', 'anon', 'guest', 'unknown',
  'moderator', 'mod', 'owner', 'founder', 'ceo',
  'spam', 'abuse', 'security', 'report',
  'store', 'shop', 'checkout', 'cart', 'order', 'orders',
  'analytics', 'stats', 'statistics',
  'design', 'theme', 'themes', 'template', 'templates',
  'widget', 'widgets', 'plugin', 'plugins',
  'embed', 'oembed', 'webhook', 'webhooks',
])

export const MIN_USERNAME_LENGTH = 3

export function validateUsername(username: string): string | null {
  if (!username) return 'ユーザー名を入力してください'
  if (username.length < MIN_USERNAME_LENGTH) return `ユーザー名は${MIN_USERNAME_LENGTH}文字以上にしてください`
  if (RESERVED_USERNAMES.has(username)) return 'このユーザー名は使用できません'
  return null
}
