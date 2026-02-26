import { getText } from '../config/languages.js';
import db from '../database/database.js';
import keyboard from '../services/keyboard.js';
import downloader from '../services/downloader.js';

class CallbackHandlers {
  constructor(bot, commandHandlers) {
    this.bot = bot;
    this.commandHandlers = commandHandlers;
    this.downloadSessions = new Map();
  }
  
  // Handle callback queries
  async handleCallback(query) {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.callback_data;
    const messageId = query.message.message_id;
    
    const user = db.getUser(userId);
    const lang = user?.language || 'ar';
    
    try {
      // Quality selection
      if (data.startsWith('quality_')) {
        await this.handleQualitySelection(chatId, userId, data, messageId, lang);
      }
      // Download type selection
      else if (data.startsWith('type_')) {
        await this.handleDownloadType(chatId, userId, data, messageId, lang);
      }
      // Settings callbacks
      else if (data.startsWith('settings_')) {
        await this.handleSettings(chatId, userId, data, messageId, lang);
      }
      // Language selection
      else if (data.startsWith('lang_')) {
        await this.handleLanguageChange(chatId, userId, data, messageId, lang);
      }
      // Admin callbacks
      else if (data.startsWith('admin_')) {
        await this.handleAdmin(chatId, userId, data, messageId, lang);
      }
      // User management
      else if (data.startsWith('users_')) {
        await this.handleUserManagement(chatId, userId, data, messageId, lang);
      }
      // Broadcast callbacks
      else if (data.startsWith('broadcast_')) {
        await this.handleBroadcast(chatId, userId, data, messageId, lang);
      }
      // Role management
      else if (data.startsWith('role_')) {
        await this.handleRoleAssignment(chatId, userId, data, messageId, lang);
      }
      // Force subscription check
      else if (data === 'check_subscription') {
        await this.handleSubscriptionCheck(chatId, userId, messageId, lang);
      }
      // History callbacks
      else if (data.startsWith('history_')) {
        await this.handleHistory(chatId, userId, data, messageId, lang);
      }
      // Clear history
      else if (data === 'clear_history') {
        await this.handleClearHistory(chatId, userId, messageId, lang);
      }
      // Cancel
      else if (data === 'cancel') {
        await this.handleCancel(chatId, userId, messageId, lang);
      }
      // Back buttons
      else if (data.startsWith('back_')) {
        await this.handleBack(chatId, userId, data, messageId, lang);
      }
      
      await this.bot.answerCallbackQuery(query.id);
    } catch (error) {
      console.error('Callback error:', error);
      await this.bot.answerCallbackQuery(query.id, { text: getText(lang, 'error') });
    }
  }
  
  // Handle quality selection
  async handleQualitySelection(chatId, userId, data, messageId, lang) {
    const parts = data.split('_');
    const quality = parts[1];
    
    const session = this.downloadSessions.get(userId);
    if (!session) {
      await this.bot.editMessageText(getText(lang, 'error'), {
        chat_id: chatId,
        message_id: messageId
      });
      return;
    }
    
    session.selectedQuality = quality;
    this.downloadSessions.set(userId, session);
    
    await this.bot.editMessageText(
      getText(lang, 'selectFormat'),
      {
        chat_id: chatId,
        message_id: messageId,
        ...keyboard.getDownloadTypeKeyboard(lang)
      }
    );
  }
  
  // Handle download type selection
  async handleDownloadType(chatId, userId, data, messageId, lang) {
    const type = data.split('_')[1];
    const session = this.downloadSessions.get(userId);
    
    if (!session) {
      await this.bot.editMessageText(getText(lang, 'error'), {
        chat_id: chatId,
        message_id: messageId
      });
      return;
    }
    
    await this.bot.editMessageText(getText(lang, 'downloading', { progress: 0 }), {
      chat_id: chatId,
      message_id: messageId
    });
    
    try {
      const result = await downloader.download(
        session.url,
        session.selectedQuality,
        async (progress) => {
          if (progress % 10 === 0) {
            await this.bot.editMessageText(
              getText(lang, 'downloading', { progress }),
              { chat_id: chatId, message_id: messageId }
            ).catch(() => {});
          }
        }
      );
      
      if (type === 'file') {
        await this.bot.editMessageText(getText(lang, 'uploadingFile'), {
          chat_id: chatId,
          message_id: messageId
        });
        
        await this.bot.sendDocument(chatId, result.filePath, {
          caption: `✅ ${result.title}`
        });
        
        downloader.deleteFile(result.filePath);
      } else {
        await this.bot.editMessageText(getText(lang, 'uploadingLink'), {
          chat_id: chatId,
          message_id: messageId
        });
        
        const linkResult = await downloader.generateDirectLink(result.filePath);
        await this.bot.sendMessage(chatId, `🔗 ${linkResult.directLink}`);
      }
      
      // Save to database
      db.addDownload({
        userId,
        url: session.url,
        title: result.title,
        platform: session.platform,
        quality: session.selectedQuality,
        format: result.fileName.split('.').pop(),
        fileSize: result.fileSize,
        downloadType: type,
        status: 'completed'
      });
      
      db.addLog(userId, 'download_completed', `Downloaded: ${result.title}`);
      
      await this.bot.editMessageText(getText(lang, 'downloadComplete'), {
        chat_id: chatId,
        message_id: messageId
      });
      
      this.downloadSessions.delete(userId);
    } catch (error) {
      console.error('Download error:', error);
      await this.bot.editMessageText(getText(lang, 'downloadFailed'), {
        chat_id: chatId,
        message_id: messageId
      });
      this.downloadSessions.delete(userId);
    }
  }
  
  // Handle settings
  async handleSettings(chatId, userId, data, messageId, lang) {
    const action = data.split('_')[1];
    
    if (action === 'language') {
      await this.bot.editMessageText(
        getText(lang, 'changeLanguage'),
        {
          chat_id: chatId,
          message_id: messageId,
          ...keyboard.getLanguageKeyboard()
        }
      );
    } else if (action === 'clear' && data.includes('history')) {
      await this.bot.editMessageText(
        'هل أنت متأكد من مسح السجل؟',
        {
          chat_id: chatId,
          message_id: messageId,
          ...keyboard.getConfirmationKeyboard('clear_history', lang)
        }
      );
    }
  }
  
  // Handle language change
  async handleLanguageChange(chatId, userId, data, messageId, lang) {
    const newLang = data.split('_')[1];
    db.updateUser(userId, { language: newLang });
    
    await this.bot.editMessageText(
      getText(newLang, 'languageChanged'),
      { chat_id: chatId, message_id: messageId }
    );
    
    db.addLog(userId, 'language_changed', `Changed to ${newLang}`);
  }
  
  // Handle admin callbacks
  async handleAdmin(chatId, userId, data, messageId, lang) {
    if (!this.commandHandlers.isAdmin(userId)) {
      await this.bot.answerCallbackQuery(query.id, { text: getText(lang, 'notAuthorized') });
      return;
    }
    
    const action = data.split('_')[1];
    
    if (action === 'stats') {
      const stats = db.getStats();
      const message = `
📊 *${getText(lang, 'statistics')}*

${getText(lang, 'totalUsers')}: ${stats.totalUsers}
${getText(lang, 'activeToday')}: ${stats.activeToday}
${getText(lang, 'totalDownloads')}: ${stats.totalDownloads}
${getText(lang, 'downloadsToday')}: ${stats.downloadsToday}
${getText(lang, 'bannedCount')}: ${stats.bannedCount}
      `;
      
      await this.bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown'
      });
    } else if (action === 'users') {
      await this.bot.editMessageText(
        getText(lang, 'users'),
        {
          chat_id: chatId,
          message_id: messageId,
          ...keyboard.getUserManagementKeyboard(lang)
        }
      );
    } else if (action === 'broadcast') {
      await this.bot.editMessageText(
        getText(lang, 'broadcast'),
        {
          chat_id: chatId,
          message_id: messageId,
          ...keyboard.getBroadcastKeyboard(lang)
        }
      );
    } else if (action === 'logs') {
      const logs = db.getLogs(10);
      let message = `📝 *${getText(lang, 'logs')}*\n\n`;
      
      logs.forEach(log => {
        const date = new Date(log.created_at * 1000).toLocaleString('ar-SA');
        message += `• ${log.action} - ${log.username || log.user_id}\n  ${date}\n\n`;
      });
      
      await this.bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown'
      });
    } else if (action === 'roles') {
      await this.bot.editMessageText(
        getText(lang, 'assignRole'),
        {
          chat_id: chatId,
          message_id: messageId,
          ...keyboard.getRoleKeyboard(lang)
        }
      );
    }
  }
  
  // Handle user management
  async handleUserManagement(chatId, userId, data, messageId, lang) {
    const action = data.split('_')[1];
    
    if (action === 'active') {
      const users = db.getActiveUsers(24);
      let message = `✅ *${getText(lang, 'activeUsers')}* (${users.length})\n\n`;
      
      users.slice(0, 10).forEach(user => {
        message += `• ${user.first_name || 'User'} (@${user.username || user.user_id})\n`;
      });
      
      await this.bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown'
      });
    } else if (action === 'banned') {
      const users = db.getBannedUsers();
      let message = `🚫 *${getText(lang, 'bannedUsers')}* (${users.length})\n\n`;
      
      users.forEach(user => {
        message += `• ${user.first_name || 'User'} (@${user.username || user.user_id})\n`;
        message += `  السبب: ${user.ban_reason || 'غير محدد'}\n\n`;
      });
      
      await this.bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown'
      });
    } else if (action === 'ban') {
      this.commandHandlers.setUserState(userId, { state: 'awaiting_ban_user_id' });
      await this.bot.sendMessage(chatId, getText(lang, 'enterUserId'));
    } else if (action === 'unban') {
      this.commandHandlers.setUserState(userId, { state: 'awaiting_unban_user_id' });
      await this.bot.sendMessage(chatId, getText(lang, 'enterUserId'));
    }
  }
  
  // Handle broadcast
  async handleBroadcast(chatId, userId, data, messageId, lang) {
    const action = data.split('_')[1];
    
    if (action === 'now') {
      this.commandHandlers.setUserState(userId, { state: 'awaiting_broadcast' });
      await this.bot.sendMessage(chatId, getText(lang, 'enterBroadcastMessage'));
    } else if (action === 'schedule') {
      this.commandHandlers.setUserState(userId, { state: 'awaiting_scheduled_broadcast' });
      await this.bot.sendMessage(chatId, getText(lang, 'enterBroadcastMessage'));
    }
  }
  
  // Handle role assignment
  async handleRoleAssignment(chatId, userId, data, messageId, lang) {
    const role = data.split('_')[1];
    this.commandHandlers.setUserState(userId, { state: 'awaiting_role_user_id', role });
    await this.bot.sendMessage(chatId, getText(lang, 'enterUserId'));
  }
  
  // Handle subscription check
  async handleSubscriptionCheck(chatId, userId, messageId, lang) {
    const isSubscribed = await this.commandHandlers.checkForceSubscription(userId);
    
    if (isSubscribed) {
      await this.bot.editMessageText(
        getText(lang, 'subscriptionVerified'),
        { chat_id: chatId, message_id: messageId }
      );
      
      setTimeout(() => {
        this.bot.sendMessage(chatId, getText(lang, 'welcome'), keyboard.getMainMenu(lang));
      }, 1000);
    } else {
      await this.bot.answerCallbackQuery(query.id, {
        text: getText(lang, 'mustJoinChannel'),
        show_alert: true
      });
    }
  }
  
  // Handle history
  async handleHistory(chatId, userId, data, messageId, lang) {
    const downloadId = data.split('_')[1];
    // Show download details
  }
  
  // Handle clear history
  async handleClearHistory(chatId, userId, messageId, lang) {
    db.clearUserDownloads(userId);
    await this.bot.editMessageText(getText(lang, 'historyCleared'), {
      chat_id: chatId,
      message_id: messageId
    });
    db.addLog(userId, 'history_cleared', 'User cleared download history');
  }
  
  // Handle cancel
  async handleCancel(chatId, userId, messageId, lang) {
    this.commandHandlers.clearUserState(userId);
    this.downloadSessions.delete(userId);
    
    await this.bot.editMessageText('❌ تم الإلغاء', {
      chat_id: chatId,
      message_id: messageId
    });
  }
  
  // Handle back buttons
  async handleBack(chatId, userId, data, messageId, lang) {
    const destination = data.split('_')[1];
    
    if (destination === 'main') {
      await this.bot.sendMessage(chatId, getText(lang, 'mainMenu'), keyboard.getMainMenu(lang));
    } else if (destination === 'admin') {
      await this.bot.editMessageText(
        getText(lang, 'adminPanel'),
        {
          chat_id: chatId,
          message_id: messageId,
          ...keyboard.getAdminKeyboard(lang)
        }
      );
    }
  }
  
  // Store download session
  storeDownloadSession(userId, sessionData) {
    this.downloadSessions.set(userId, sessionData);
  }
}

export default CallbackHandlers;
