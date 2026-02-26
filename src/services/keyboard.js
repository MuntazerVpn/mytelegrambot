import { getText } from '../config/languages.js';

class KeyboardService {
  // Main menu keyboard
  getMainMenu(lang = 'ar') {
    return {
      reply_markup: {
        keyboard: [
          [
            { text: getText(lang, 'download') },
            { text: getText(lang, 'myDownloads') }
          ],
          [
            { text: getText(lang, 'settings') },
            { text: getText(lang, 'help') }
          ]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
      }
    };
  }
  
  // Quality selection inline keyboard
  getQualityKeyboard(qualities, lang = 'ar') {
    const buttons = qualities.map(q => [{
      text: `${q.quality} - ${this.formatFileSize(q.size)}`,
      callback_data: `quality_${q.quality}_${q.itag || q.quality}`
    }]);
    
    buttons.push([{
      text: getText(lang, 'cancel'),
      callback_data: 'cancel'
    }]);
    
    return {
      reply_markup: {
        inline_keyboard: buttons
      }
    };
  }
  
  // Download type selection
  getDownloadTypeKeyboard(lang = 'ar') {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: getText(lang, 'sendAsFile'), callback_data: 'type_file' },
            { text: getText(lang, 'sendAsLink'), callback_data: 'type_link' }
          ],
          [
            { text: getText(lang, 'cancel'), callback_data: 'cancel' }
          ]
        ]
      }
    };
  }
  
  // Settings menu
  getSettingsKeyboard(lang = 'ar') {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: getText(lang, 'changeLanguage'), callback_data: 'settings_language' }
          ],
          [
            { text: getText(lang, 'defaultQuality'), callback_data: 'settings_quality' }
          ],
          [
            { text: getText(lang, 'clearHistory'), callback_data: 'settings_clear_history' }
          ],
          [
            { text: getText(lang, 'back'), callback_data: 'back_main' }
          ]
        ]
      }
    };
  }
  
  // Language selection
  getLanguageKeyboard() {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🇸🇦 العربية', callback_data: 'lang_ar' },
            { text: '🇬🇧 English', callback_data: 'lang_en' }
          ]
        ]
      }
    };
  }
  
  // Admin panel main menu
  getAdminKeyboard(lang = 'ar') {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: getText(lang, 'statistics'), callback_data: 'admin_stats' },
            { text: getText(lang, 'users'), callback_data: 'admin_users' }
          ],
          [
            { text: getText(lang, 'broadcast'), callback_data: 'admin_broadcast' },
            { text: getText(lang, 'scheduledBroadcast'), callback_data: 'admin_scheduled' }
          ],
          [
            { text: getText(lang, 'logs'), callback_data: 'admin_logs' },
            { text: getText(lang, 'roles'), callback_data: 'admin_roles' }
          ],
          [
            { text: getText(lang, 'forceSubscription'), callback_data: 'admin_force_sub' }
          ]
        ]
      }
    };
  }
  
  // User management keyboard
  getUserManagementKeyboard(lang = 'ar') {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: getText(lang, 'activeUsers'), callback_data: 'users_active' },
            { text: getText(lang, 'bannedUsers'), callback_data: 'users_banned' }
          ],
          [
            { text: '🚫 ' + getText(lang, 'banReason'), callback_data: 'users_ban' },
            { text: '✅ إلغاء حظر', callback_data: 'users_unban' }
          ],
          [
            { text: getText(lang, 'back'), callback_data: 'back_admin' }
          ]
        ]
      }
    };
  }
  
  // Broadcast options
  getBroadcastKeyboard(lang = 'ar') {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📢 إذاعة فورية', callback_data: 'broadcast_now' },
            { text: '⏰ إذاعة مجدولة', callback_data: 'broadcast_schedule' }
          ],
          [
            { text: getText(lang, 'back'), callback_data: 'back_admin' }
          ]
        ]
      }
    };
  }
  
  // Role selection keyboard
  getRoleKeyboard(lang = 'ar') {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: getText(lang, 'admin'), callback_data: 'role_admin' },
            { text: getText(lang, 'moderator'), callback_data: 'role_moderator' }
          ],
          [
            { text: getText(lang, 'user'), callback_data: 'role_user' }
          ],
          [
            { text: getText(lang, 'back'), callback_data: 'back_admin' }
          ]
        ]
      }
    };
  }
  
  // Force subscription keyboard
  getForceSubKeyboard(channelUsername, lang = 'ar') {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: getText(lang, 'joinChannel'), url: `https://t.me/${channelUsername}` }
          ],
          [
            { text: getText(lang, 'checkSubscription'), callback_data: 'check_subscription' }
          ]
        ]
      }
    };
  }
  
  // Download history keyboard
  getHistoryKeyboard(downloads, lang = 'ar') {
    const buttons = downloads.slice(0, 5).map((download, index) => [{
      text: `${index + 1}. ${download.title?.substring(0, 30) || 'Download'}`,
      callback_data: `history_${download.id}`
    }]);
    
    if (downloads.length > 0) {
      buttons.push([{
        text: getText(lang, 'clearHistory'),
        callback_data: 'clear_history'
      }]);
    }
    
    buttons.push([{
      text: getText(lang, 'back'),
      callback_data: 'back_main'
    }]);
    
    return {
      reply_markup: {
        inline_keyboard: buttons
      }
    };
  }
  
  // Confirmation keyboard
  getConfirmationKeyboard(action, lang = 'ar') {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ تأكيد', callback_data: `confirm_${action}` },
            { text: '❌ إلغاء', callback_data: 'cancel' }
          ]
        ]
      }
    };
  }
  
  // Pagination keyboard
  getPaginationKeyboard(currentPage, totalPages, prefix, lang = 'ar') {
    const buttons = [];
    
    if (currentPage > 1) {
      buttons.push({ text: '◀️ السابق', callback_data: `${prefix}_page_${currentPage - 1}` });
    }
    
    buttons.push({ text: `${currentPage}/${totalPages}`, callback_data: 'noop' });
    
    if (currentPage < totalPages) {
      buttons.push({ text: 'التالي ▶️', callback_data: `${prefix}_page_${currentPage + 1}` });
    }
    
    return {
      reply_markup: {
        inline_keyboard: [
          buttons,
          [{ text: getText(lang, 'back'), callback_data: 'back_admin' }]
        ]
      }
    };
  }
  
  // Helper method
  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

export default new KeyboardService();
