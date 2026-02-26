import dotenv from 'dotenv';
dotenv.config();

export const config = {
  botToken: process.env.BOT_TOKEN,
  adminIds: process.env.ADMIN_IDS?.split(',').map(id => parseInt(id.trim())) || [],
  
  database: {
    path: process.env.DB_PATH || './data/bot.db'
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10
  },
  
  antiSpam: {
    threshold: parseInt(process.env.SPAM_THRESHOLD) || 5,
    banDuration: parseInt(process.env.SPAM_BAN_DURATION) || 3600000
  },
  
  download: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 2000000000,
    tempDir: process.env.TEMP_DIR || './temp',
    autoCleanupHours: parseInt(process.env.AUTO_CLEANUP_HOURS) || 24
  },
  
  forceSubscription: {
    enabled: !!process.env.FORCE_CHANNEL_ID,
    channelId: process.env.FORCE_CHANNEL_ID,
    channelUsername: process.env.FORCE_CHANNEL_USERNAME
  }
};

export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user'
};

export const PERMISSIONS = {
  [ROLES.OWNER]: ['*'],
  [ROLES.ADMIN]: ['broadcast', 'stats', 'ban', 'unban', 'view_logs', 'manage_users'],
  [ROLES.MODERATOR]: ['ban', 'unban', 'view_logs'],
  [ROLES.USER]: ['download']
};
