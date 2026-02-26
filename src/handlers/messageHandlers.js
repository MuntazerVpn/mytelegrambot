import { getText } from '../config/languages.js';
import db from '../database/database.js';
import keyboard from '../services/keyboard.js';
import downloader from '../services/downloader.js';

class MessageHandlers {
  constructor(bot, commandHandlers, callbackHandlers) {
    this.bot = bot;
    this.commandHandlers = commandHandlers;
    this.callbackHandlers = callbackHandlers;
  }
  
  // Handle text messages
  async handleMessage(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    
    const user = db.getUser(userId);
    if (!user) return;
    
    const lang = user.language || 'ar';
    
    // Check if banned
    if (user.is_banned) {
      await this.bot.sendMessage(chatId, getText(lang, 'notAuthorized'));
      return;
    }
    
    // Update last active
    db.updateLastActive(userId);
    
    // Check user state
    const userState = this.commandHandlers.getUserState(userId);
    
    if (userState) {
      await this.handleStateBasedMessage(chatId, userId, text, userState, lang);
      return;
    }
    
    // Handle menu buttons
    if (text === getText(lang, 'download') || text === '⬇️ تحميل' || text === '⬇️ Download') {
      await this.commandHandlers.handleDownload(msg);
    } else if (text === getText(lang, 'myDownloads') || text === '📁 تحميلاتي' || text === '📁 My Downloads') {
      await this.commandHandlers.handleHistory(msg);
    } else if (text === getText(lang, 'settings') || text === '⚙️ الإعدادات' || text === '⚙️ Settings') {
      await this.commandHandlers.handleSettings(msg);
    } else if (text === getText(lang, 'help') || text === '❓ المساعدة' || text === '❓ Help') {
      await this.commandHandlers.handleHelp(msg);
    }
    // Check if it's a URL
    else if (this.isUrl(text)) {
      await this.handleUrlMessage(chatId, userId, text, lang);
    }
  }
  
  // Handle state-based messages
  async handleStateBasedMessage(chatId, userId, text, userState, lang) {
    const state = userState.state;
    
    // Awaiting URL for download
    if (state === 'awaiting_url') {
      await this.handleUrlMessage(chatId, userId, text, lang);
      this.commandHandlers.clearUserState(userId);
    }
    // Awaiting broadcast message
    else if (state === 'awaiting_broadcast') {
      await this.handleBroadcastMessage(chatId, userId, text, lang);
      this.commandHandlers.clearUserState(userId);
    }
    // Awaiting scheduled broadcast
    else if (state === 'awaiting_scheduled_broadcast') {
      await this.handleScheduledBroadcast(chatId, userId, text, lang);
      this.commandHandlers.clearUserState(userId);
    }
    // Awaiting user ID to ban
    else if (state === 'awaiting_ban_user_id') {
      await this.handleBanUser(chatId, userId, text, lang);
      this.commandHandlers.clearUserState(userId);
    }
    // Awaiting user ID to unban
    else if (state === 'awaiting_unban_user_id') {
      await this.handleUnbanUser(chatId, userId, text, lang);
      this.commandHandlers.clearUserState(userId);
    }
    // Awaiting ban reason
    else if (state === 'awaiting_ban_reason') {
      await this.handleBanReason(chatId, userId, text, userState.targetUserId, lang);
      this.commandHandlers.clearUserState(userId);
    }
    // Awaiting user ID for role assignment
    else if (state === 'awaiting_role_user_id') {
      await this.handleRoleUserAssignment(chatId, userId, text, userState.role, lang);
      this.commandHandlers.clearUserState(userId);
    }
  }
  
  // Handle URL message
  async handleUrlMessage(chatId, userId, url, lang) {
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
    
    if (!downloader.isValidUrl(url)) {
      await this.bot.sendMessage(chatId, getText(lang, 'invalidLink'));
      return;
    }
    
    const processingMsg = await this.bot.sendMessage(chatId, getText(lang, 'fetchingInfo'));
    
    try {
      const info = await downloader.getVideoInfo(url);
      
      // Store session
      this.callbackHandlers.storeDownloadSession(userId, {
        url,
        platform: info.platform,
        info
      });
      
      // Build info message
      let message = `${getText(lang, 'title')}: ${info.title}\n`;
      if (info.duration) {
        message += `${getText(lang, 'duration')}: ${info.duration}\n`;
      }
      if (info.author) {
        message += `المؤلف: ${info.author}\n`;
      }
      message += `\n${getText(lang, 'selectQuality')}`;
      
      await this.bot.editMessageText(message, {
        chat_id: chatId,
        message_id: processingMsg.message_id,
        ...keyboard.getQualityKeyboard(info.qualities, lang)
      });
      
      db.addLog(userId, 'video_info_fetched', `Platform: ${info.platform}`);
    } catch (error) {
      console.error('Error fetching video info:', error);
      await this.bot.editMessageText(getText(lang, 'error') + '\n' + error.message, {
        chat_id: chatId,
        message_id: processingMsg.message_id
      });
    }
  }
  
  // Handle broadcast message
  async handleBroadcastMessage(chatId, userId, message, lang) {
    const users = db.getAllUsers();
    const totalUsers = users.length;
    
    const broadcastId = db.createBroadcast({
      message,
      createdBy: userId,
      totalUsers
    }).lastInsertRowid;
    
    let successCount = 0;
    let failedCount = 0;
    
    const statusMsg = await this.bot.sendMessage(
      chatId,
      `📢 جاري الإرسال... 0/${totalUsers}`
    );
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      
      try {
        await this.bot.sendMessage(user.user_id, message);
        successCount++;
      } catch (error) {
        failedCount++;
      }
      
      // Update status every 10 users
      if ((i + 1) % 10 === 0 || i === users.length - 1) {
        await this.bot.editMessageText(
          `📢 جاري الإرسال... ${i + 1}/${totalUsers}\n✅ نجح: ${successCount}\n❌ فشل: ${failedCount}`,
          {
            chat_id: chatId,
            message_id: statusMsg.message_id
          }
        ).catch(() => {});
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    db.updateBroadcast(broadcastId, {
      sent_at: Math.floor(Date.now() / 1000),
      success_count: successCount,
      failed_count: failedCount,
      status: 'completed'
    });
    
    await this.bot.editMessageText(
      getText(lang, 'broadcastSent', { count: successCount }),
      {
        chat_id: chatId,
        message_id: statusMsg.message_id
      }
    );
    
    db.addLog(userId, 'broadcast_sent', `Sent to ${successCount} users`);
  }
  
  // Handle scheduled broadcast
  async handleScheduledBroadcast(chatId, userId, text, lang) {
    // Parse message and schedule time
    // Format: message|timestamp
    const parts = text.split('|');
    
    if (parts.length < 2) {
      await this.bot.sendMessage(
        chatId,
        'الصيغة: الرسالة|الوقت (timestamp)\nمثال: مرحباً|' + (Math.floor(Date.now() / 1000) + 3600)
      );
      return;
    }
    
    const message = parts[0].trim();
    const scheduledAt = parseInt(parts[1].trim());
    
    const users = db.getAllUsers();
    
    db.createBroadcast({
      message,
      scheduledAt,
      createdBy: userId,
      totalUsers: users.length
    });
    
    await this.bot.sendMessage(chatId, getText(lang, 'broadcastScheduled'));
    db.addLog(userId, 'broadcast_scheduled', `Scheduled for ${new Date(scheduledAt * 1000)}`);
  }
  
  // Handle ban user
  async handleBanUser(chatId, userId, text, lang) {
    const targetUserId = parseInt(text);
    
    if (isNaN(targetUserId)) {
      await this.bot.sendMessage(chatId, 'معرف المستخدم غير صالح');
      return;
    }
    
    const targetUser = db.getUser(targetUserId);
    if (!targetUser) {
      await this.bot.sendMessage(chatId, getText(lang, 'userNotFound'));
      return;
    }
    
    this.commandHandlers.setUserState(userId, {
      state: 'awaiting_ban_reason',
      targetUserId
    });
    
    await this.bot.sendMessage(chatId, getText(lang, 'banReason') + ':');
  }
  
  // Handle ban reason
  async handleBanReason(chatId, userId, reason, targetUserId, lang) {
    db.banUser(targetUserId, reason);
    await this.bot.sendMessage(chatId, getText(lang, 'userBanned'));
    
    try {
      const targetUser = db.getUser(targetUserId);
      const targetLang = targetUser.language || 'ar';
      await this.bot.sendMessage(
        targetUserId,
        `🚫 ${getText(targetLang, 'notAuthorized')}\n${getText(targetLang, 'banReason')}: ${reason}`
      );
    } catch (error) {
      // User might have blocked the bot
    }
    
    db.addLog(userId, 'user_banned', `Banned user ${targetUserId}: ${reason}`);
  }
  
  // Handle unban user
  async handleUnbanUser(chatId, userId, text, lang) {
    const targetUserId = parseInt(text);
    
    if (isNaN(targetUserId)) {
      await this.bot.sendMessage(chatId, 'معرف المستخدم غير صالح');
      return;
    }
    
    const targetUser = db.getUser(targetUserId);
    if (!targetUser) {
      await this.bot.sendMessage(chatId, getText(lang, 'userNotFound'));
      return;
    }
    
    db.unbanUser(targetUserId);
    await this.bot.sendMessage(chatId, getText(lang, 'userUnbanned'));
    
    try {
      const targetLang = targetUser.language || 'ar';
      await this.bot.sendMessage(
        targetUserId,
        `✅ تم إلغاء حظرك. يمكنك الآن استخدام البوت.`
      );
    } catch (error) {
      // User might have blocked the bot
    }
    
    db.addLog(userId, 'user_unbanned', `Unbanned user ${targetUserId}`);
  }
  
  // Handle role assignment
  async handleRoleUserAssignment(chatId, userId, text, role, lang) {
    const targetUserId = parseInt(text);
    
    if (isNaN(targetUserId)) {
      await this.bot.sendMessage(chatId, 'معرف المستخدم غير صالح');
      return;
    }
    
    const targetUser = db.getUser(targetUserId);
    if (!targetUser) {
      await this.bot.sendMessage(chatId, getText(lang, 'userNotFound'));
      return;
    }
    
    db.updateUser(targetUserId, { role });
    await this.bot.sendMessage(chatId, getText(lang, 'roleAssigned'));
    
    db.addLog(userId, 'role_assigned', `Assigned ${role} to user ${targetUserId}`);
  }
  
  // Helper to check if text is URL
  isUrl(text) {
    try {
      new URL(text);
      return true;
    } catch {
      return false;
    }
  }
}

export default MessageHandlers;
