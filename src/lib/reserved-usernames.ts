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

  // Common nouns / squatting prevention
  'god', 'jesus', 'allah', 'buddha',
  'anonymous', 'anon', 'guest', 'unknown',
  'moderator', 'mod', 'owner', 'founder', 'ceo',
  'spam', 'abuse', 'security', 'report',
  'store', 'shop', 'checkout', 'cart', 'order', 'orders',
  'analytics', 'stats', 'statistics',
  'design', 'theme', 'themes', 'template', 'templates',
  'widget', 'widgets', 'plugin', 'plugins',
  'embed', 'oembed', 'webhook', 'webhooks',

  // Entertainment / media
  'travel', 'music', 'movie', 'movies', 'photo', 'photos', 'video', 'videos',
  'game', 'games', 'gaming', 'anime', 'manga', 'book', 'books', 'review', 'reviews',
  'drama', 'comic', 'comics', 'novel', 'novels', 'podcast', 'radio', 'tv',
  'entertainment', 'culture', 'hobby', 'hobbies', 'sports', 'soccer', 'baseball',
  'basketball', 'tennis', 'golf', 'running', 'yoga', 'dance', 'singing',

  // Technology
  'tech', 'technology', 'code', 'coding', 'programming', 'engineer', 'engineering',
  'software', 'hardware', 'computer', 'digital', 'internet', 'network', 'cloud',
  'data', 'database', 'server', 'frontend', 'backend', 'fullstack', 'devops',
  'machine-learning', 'deep-learning', 'algorithm', 'hacker', 'hacking', 'cyber',
  'linux', 'windows', 'macos', 'python', 'javascript', 'typescript', 'react',
  'nodejs', 'ruby', 'rust', 'golang', 'swift', 'kotlin', 'java',

  // Food / lifestyle
  'food', 'cooking', 'recipe', 'recipes', 'health', 'fitness', 'diet', 'beauty',
  'fashion', 'style', 'art', 'artist', 'writer', 'writing', 'creative',
  'cafe', 'coffee', 'beer', 'wine', 'sake', 'ramen', 'sushi', 'restaurant',
  'gourmet', 'sweets', 'dessert', 'organic', 'vegan', 'vegetarian',
  'lifestyle', 'interior', 'garden', 'gardening', 'outdoor', 'camping',
  'pet', 'pets', 'cat', 'cats', 'dog', 'dogs', 'animal', 'animals', 'nature',

  // Business / finance
  'money', 'finance', 'invest', 'investing', 'crypto', 'bitcoin', 'nft',
  'marketing', 'business', 'startup', 'entrepreneur',
  'stock', 'stocks', 'trading', 'forex', 'economy', 'economics',
  'real-estate', 'property', 'insurance', 'banking', 'payment', 'salary',
  'career', 'work', 'job', 'jobs', 'hire', 'hiring', 'resume', 'freelance',

  // Places / geography
  'japan', 'tokyo', 'osaka', 'kyoto', 'japanese', 'english',
  'nagoya', 'fukuoka', 'sapporo', 'kobe', 'yokohama', 'okinawa', 'hokkaido',
  'america', 'china', 'korea', 'taiwan', 'thailand', 'vietnam', 'india',
  'europe', 'france', 'germany', 'italy', 'spain', 'london', 'paris', 'newyork',
  'asia', 'africa', 'australia', 'canada', 'brazil', 'mexico', 'russia',

  // Education / learning
  'study', 'learn', 'learning', 'education', 'school', 'university', 'college',
  'student', 'teacher', 'professor', 'tutor', 'lesson', 'course', 'class',
  'english', 'math', 'science', 'history', 'language', 'eigo',

  // Daily life / general
  'life', 'daily', 'diary', 'journal', 'note', 'notes', 'memo',
  'today', 'world', 'global', 'local', 'free', 'premium', 'pro', 'plus', 'vip',
  'love', 'happy', 'cool', 'awesome', 'best', 'top', 'first', 'last',
  'family', 'baby', 'kids', 'child', 'children', 'mama', 'papa', 'parent',
  'wedding', 'marriage', 'couple', 'dating', 'single', 'friend', 'friends',
  'dream', 'future', 'story', 'stories', 'voice', 'opinion', 'think', 'thought',
  'morning', 'night', 'weekend', 'holiday', 'vacation', 'summer', 'winter',
  'spring', 'autumn', 'rain', 'snow', 'sunshine', 'weather',
  'home', 'house', 'room', 'kitchen', 'living', 'bedroom',
  'idea', 'tips', 'guide', 'howto', 'how-to', 'tutorial', 'manual',
  'random', 'misc', 'other', 'general', 'everything', 'anything', 'something',

  // Major brands / companies / services
  'android', 'iphone', 'apple', 'google', 'microsoft', 'amazon', 'meta', 'twitter',
  'facebook', 'instagram', 'youtube', 'tiktok', 'line', 'slack', 'discord',
  'openai', 'chatgpt', 'claude', 'anthropic', 'vercel', 'supabase', 'github',
  'netflix', 'spotify', 'uber', 'airbnb', 'zoom', 'notion', 'figma',
  'wordpress', 'medium', 'substack', 'tumblr', 'blogger', 'wix', 'squarespace',
  'nintendo', 'sony', 'playstation', 'xbox', 'steam', 'epic',
  'toyota', 'honda', 'nissan', 'sony', 'panasonic', 'sharp', 'toshiba',
  'softbank', 'docomo', 'kddi', 'rakuten', 'mercari', 'yahoo', 'paypal',

  // Photography / creative
  'camera', 'photograph', 'photography', 'photographer', 'illustrator',
  'illustration', 'designer', 'graphic', 'graphics', 'icon', 'logo',
  'sketch', 'paint', 'painting', 'drawing', 'craft', 'crafts', 'handmade', 'diy',

  // Health / wellness
  'medical', 'doctor', 'nurse', 'hospital', 'clinic', 'therapy', 'mental',
  'wellness', 'meditation', 'mindfulness', 'sleep', 'exercise', 'muscle',
  'nutrition', 'supplement', 'vitamin', 'pharmacy', 'skincare', 'haircare',

  // Roles / titles
  'king', 'queen', 'prince', 'princess', 'president', 'minister', 'emperor',
  'hero', 'legend', 'master', 'sensei', 'guru', 'ninja', 'samurai',
  'manager', 'director', 'leader', 'captain', 'chief', 'boss',
])

export const MIN_USERNAME_LENGTH = 4

export function validateUsername(username: string): string | null {
  if (!username) return 'ユーザー名を入力してください'
  if (username.length < MIN_USERNAME_LENGTH) return `ユーザー名は${MIN_USERNAME_LENGTH}文字以上にしてください`
  if (RESERVED_USERNAMES.has(username.toLowerCase())) return 'このユーザー名は使用できません'
  return null
}
