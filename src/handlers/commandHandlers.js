import { getText } from '../config/languages.js';
import db from '../database/database.js';
import keyboard from '../services/keyboard.js';
import { config, ROLES, PERMISSIONS } from '../config/config.js';

class CommandHandlers {
  constructor(bot) {
    this.bot = bot;
    this.userStates = new Map();
  }
  
  // Check if user has permission
  hasPermission(userId, permission) {
    const user = db.getUser(userId);
    if (!user) return false;
    
    const userRole = user.role || ROLES.USER;
    const permissions = PERMISSIONS[userRole] || [];
    
    return permissions.includes('*') || permissions.includes(permission);
  }
  
  // Check if user is admin
  isAdmin(userId) {
    return config.adminIds.includes(userId) || this.hasPermission(userId, 'broadcast');
  }
  
  // Check force subscription
  async checkForceSubscription(userId) {
    if (!config.forceSubscription.enabled) {
      return true;
    }
    
    try {
      const member = await this.bot.getChatMember(config.forceSubscription.channelId, userId);
      return ['member', 'administrator', 'creator'].includes(member.status);
    } catch (error) {
      return false;
    }
  }
  
  // Handle /start command
  async handleStart(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // Create or update user
    let user = db.getUser(userId);
    if (!user) {
      db.createUser(userId, {
        username: msg.from.username,
        first_name: msg.from.first_name,
        last_name: msg.from.last_name,
        language: msg.from.language_code === 'ar' ? 'ar' : 'en'
      });
      user = db.getUser(userId);
      db.addLog(userId, 'user_registered', 'New user registered');
    } else {
      db.updateLastActive(userId);
    }
    
    const lang = user.language || 'ar';
    
    // Check if banned
    if (user.is_banned) {
      await this.bot.sendMessage(chatId, getText(lang, 'notAuthorized'));
      return;
    }
    
    // Check force subscription
    if (!await this.checkForceSubscription(userId)) {
      await this.bot.sendMessage(
        chatId,
        getText(lang, 'mustJoinChannel'),
        keyboard.getForceSubKeyboard(config.forceSubscription.channelUsername, lang)
      );
      return;
    }
    
    await this.bot.sendMessage(
      chatId,
      getText(lang, 'welcome'),
      keyboard.getMainMenu(lang)
    );
  }
  
  // Handle /download command
  async handleDownload(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const user = db.getUser(userId);
    const lang = user?.language || 'ar';
    
    if (!user || user.is_banned) {
      await this.bot.sendMessage(chatId, getText(lang, 'notAuthorized'));
      return;
    }
    
    // Check rate limit
    const rateLimit = db.checkRateLimit(userId);
    if (!rateLimit.allowed) {
      await this.bot.sendMessage(
        chatId,
        getText(lang, 'rateLimitExceeded', { time: Math.ceil(rateLimit.resetIn) })
      );
      return;
    }
    
    // Check spam
    const spamCheck = db.checkSpam(userId);
    if (spamCheck.isSpam) {
      await this.bot.sendMessage(chatId, getText(lang, 'spamDetected'));
      return;
    }
    
    this.userStates.set(userId, { state: 'awaiting_url' });
    await this.bot.sendMessage(chatId, getText(lang, 'sendLink'));
  }
  
  // Handle /history command
  async handleHistory(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const user = db.getUser(userId);
    const lang = user?.language || 'ar';
    
    if (!user || user.is_banned) {
      await this.bot.sendMessage(chatId, getText(lang, 'notAuthorized'));
      return;
    }
    
    const downloads = db.getUserDownloads(userId, 10);
    
    if (downloads.length === 0) {
      await this.bot.sendMessage(chatId, getText(lang, 'noHistory'));
      return;
    }
    
    let message = `${getText(lang, 'downloadHistory')}\n\n`;
    downloads.forEach((download, index) => {
      message += `${index + 1}. ${download.title || 'Download'}\n`;
      message += `   ${getText(lang, 'quality')}: ${download.quality}\n`;
      message += `   ${getText(lang, 'format')}: ${download.format}\n\n`;
    });
    
    await this.bot.sendMessage(
      chatId,
      message,
      keyboard.getHistoryKeyboard(downloads, lang)
    );
  }
  
  // Handle /settings command
  async handleSettings(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const user = db.getUser(userId);
    const lang = user?.language || 'ar';
    
    if (!user || user.is_banned) {
      await this.bot.sendMessage(chatId, getText(lang, 'notAuthorized'));
      return;
    }
    
    await this.bot.sendMessage(
      chatId,
      getText(lang, 'settingsMenu'),
      keyboard.getSettingsKeyboard(lang)
    );
  }
  
  // Handle /help command
  async handleHelp(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const user = db.getUser(userId);
    const lang = user?.language || 'ar';
    
    await this.bot.sendMessage(chatId, getText(lang, 'helpText'), { parse_mode: 'Markdown' });
  }
  
  // Handle /language command
  async handleLanguage(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const user = db.getUser(userId);
    const lang = user?.language || 'ar';
    
    await this.bot.sendMessage(
      chatId,
      getText(lang, 'changeLanguage'),
      keyboard.getLanguageKeyboard()
    );
  }
  
  // Handle /admin command
  async handleAdmin(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (!this.isAdmin(userId)) {
      const user = db.getUser(userId);
      const lang = user?.language || 'ar';
      await this.bot.sendMessage(chatId, getText(lang, 'notAuthorized'));
      return;
    }
    
    const user = db.getUser(userId);
    const lang = user?.language || 'ar';
    
    await this.bot.sendMessage(
      chatId,
      getText(lang, 'adminPanel'),
      keyboard.getAdminKeyboard(lang)
    );
  }
  
  // Handle /stats command
  async handleStats(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (!this.isAdmin(userId)) {
      const user = db.getUser(userId);
      const lang = user?.language || 'ar';
      await this.bot.sendMessage(chatId, getText(lang, 'notAuthorized'));
      return;
    }
    
    const user = db.getUser(userId);
    const lang = user?.language || 'ar';
    const stats = db.getStats();
    
    const message = `
📊 *${getText(lang, 'statistics')}*

${getText(lang, 'totalUsers')}: ${stats.totalUsers}
${getText(lang, 'activeToday')}: ${stats.activeToday}
${getText(lang, 'totalDownloads')}: ${stats.totalDownloads}
${getText(lang, 'downloadsToday')}: ${stats.downloadsToday}
${getText(lang, 'bannedCount')}: ${stats.bannedCount}
    `;
    
    await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }
  
  // Handle /broadcast command
  async handleBroadcast(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (!this.isAdmin(userId)) {
      const user = db.getUser(userId);
      const lang = user?.language || 'ar';
      await this.bot.sendMessage(chatId, getText(lang, 'notAuthorized'));
      return;
    }
    
    const user = db.getUser(userId);
    const lang = user?.language || 'ar';
    
    this.userStates.set(userId, { state: 'awaiting_broadcast' });
    await this.bot.sendMessage(chatId, getText(lang, 'enterBroadcastMessage'));
  }
  
  // Handle /ban command
  async handleBan(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (!this.hasPermission(userId, 'ban')) {
      const user = db.getUser(userId);
      const lang = user?.language || 'ar';
      await this.bot.sendMessage(chatId, getText(lang, 'notAuthorized'));
      return;
    }
    
    const user = db.getUser(userId);
    const lang = user?.language || 'ar';
    
    this.userStates.set(userId, { state: 'awaiting_ban_user_id' });
    await this.bot.sendMessage(chatId, getText(lang, 'enterUserId'));
  }
  
  // Handle /unban command
  async handleUnban(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (!this.hasPermission(userId, 'unban')) {
      const user = db.getUser(userId);
      const lang = user?.language || 'ar';
      await this.bot.sendMessage(chatId, getText(lang, 'notAuthorized'));
      return;
    }
    
    const user = db.getUser(userId);
    const lang = user?.language || 'ar';
    
    this.userStates.set(userId, { state: 'awaiting_unban_user_id' });
    await this.bot.sendMessage(chatId, getText(lang, 'enterUserId'));
  }
  
  // Get user state
  getUserState(userId) {
    return this.userStates.get(userId);
  }
  
  // Clear user state
  clearUserState(userId) {
    this.userStates.delete(userId);
  }
  
  // Set user state
  setUserState(userId, state) {
    this.userStates.set(userId, state);
  }
}

export default CommandHandlers;
