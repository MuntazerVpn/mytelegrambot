export const languages = {
  ar: {
    // Main Menu
    welcome: '👋 مرحباً بك في بوت التحميل الاحترافي!\n\nأرسل رابط الفيديو أو الصوت للتحميل.',
    mainMenu: '📋 القائمة الرئيسية',
    download: '⬇️ تحميل',
    myDownloads: '📁 تحميلاتي',
    settings: '⚙️ الإعدادات',
    help: '❓ المساعدة',
    language: '🌐 اللغة',
    
    // Download Process
    sendLink: '📎 أرسل رابط الفيديو أو الصوت',
    processing: '⏳ جاري المعالجة...',
    fetchingInfo: '🔍 جاري جلب معلومات الملف...',
    selectQuality: '📊 اختر الجودة:',
    selectFormat: '📝 اختر الصيغة:',
    downloading: '⬇️ جاري التحميل... {progress}%',
    uploadingFile: '📤 جاري رفع الملف...',
    uploadingLink: '🔗 جاري إنشاء رابط مباشر...',
    downloadComplete: '✅ تم التحميل بنجاح!',
    downloadFailed: '❌ فشل التحميل. حاول مرة أخرى.',
    
    // File Info
    title: '📌 العنوان',
    duration: '⏱ المدة',
    size: '💾 الحجم',
    quality: '🎬 الجودة',
    format: '📄 الصيغة',
    
    // Download Options
    sendAsFile: '📁 إرسال كملف',
    sendAsLink: '🔗 إرسال كرابط',
    cancel: '❌ إلغاء',
    back: '🔙 رجوع',
    
    // History
    downloadHistory: '📁 سجل التحميلات',
    noHistory: 'لا توجد تحميلات سابقة',
    clearHistory: '🗑 مسح السجل',
    historyCleared: '✅ تم مسح السجل',
    
    // Settings
    settingsMenu: '⚙️ الإعدادات',
    changeLanguage: '🌐 تغيير اللغة',
    languageChanged: '✅ تم تغيير اللغة',
    defaultQuality: '🎬 الجودة الافتراضية',
    autoDelete: '🗑 حذف تلقائي',
    notifications: '🔔 الإشعارات',
    
    // Admin Panel
    adminPanel: '👑 لوحة الإدارة',
    statistics: '📊 الإحصائيات',
    broadcast: '📢 إذاعة',
    scheduledBroadcast: '⏰ إذاعة مجدولة',
    users: '👥 المستخدمين',
    activeUsers: '✅ المستخدمين النشطين',
    bannedUsers: '🚫 المحظورين',
    logs: '📝 سجل العمليات',
    roles: '🎭 الأدوار',
    forceSubscription: '🔒 الاشتراك الإجباري',
    
    // Statistics
    totalUsers: '👥 إجمالي المستخدمين',
    activeToday: '✅ النشطين اليوم',
    totalDownloads: '⬇️ إجمالي التحميلات',
    downloadsToday: '📊 تحميلات اليوم',
    bannedCount: '🚫 المحظورين',
    
    // Broadcast
    enterBroadcastMessage: '📝 أدخل رسالة الإذاعة:',
    broadcastSent: '✅ تم إرسال الإذاعة إلى {count} مستخدم',
    broadcastScheduled: '⏰ تم جدولة الإذاعة',
    selectDateTime: '📅 اختر التاريخ والوقت',
    
    // User Management
    enterUserId: '🔢 أدخل معرف المستخدم:',
    userBanned: '🚫 تم حظر المستخدم',
    userUnbanned: '✅ تم إلغاء حظر المستخدم',
    userNotFound: '❌ المستخدم غير موجود',
    banReason: '📝 سبب الحظر',
    
    // Roles
    assignRole: '🎭 تعيين دور',
    roleAssigned: '✅ تم تعيين الدور',
    selectRole: 'اختر الدور:',
    owner: '👑 مالك',
    admin: '⚡ مشرف',
    moderator: '🛡 مراقب',
    user: '👤 مستخدم',
    
    // Force Subscription
    mustJoinChannel: '⚠️ يجب عليك الانضمام إلى القناة أولاً:',
    joinChannel: '✅ انضمام للقناة',
    checkSubscription: '🔄 تحقق من الاشتراك',
    subscriptionVerified: '✅ تم التحقق من الاشتراك',
    
    // Errors
    error: '❌ حدث خطأ',
    invalidLink: '❌ رابط غير صالح',
    fileTooLarge: '❌ الملف كبير جداً (الحد الأقصى {max} MB)',
    rateLimitExceeded: '⏳ تجاوزت الحد المسموح. حاول بعد {time} ثانية',
    spamDetected: '🚫 تم اكتشاف سبام. تم حظرك مؤقتاً',
    notAuthorized: '🚫 غير مصرح لك بهذا الإجراء',
    
    // Help
    helpText: `
📖 *دليل الاستخدام*

*التحميل:*
1️⃣ أرسل رابط الفيديو أو الصوت
2️⃣ اختر الجودة المطلوبة
3️⃣ اختر إرسال كملف أو رابط مباشر

*المنصات المدعومة:*
• YouTube
• Instagram
• TikTok
• Facebook
• Twitter
• والمزيد...

*الأوامر:*
/start - بدء البوت
/download - تحميل ملف
/history - سجل التحميلات
/settings - الإعدادات
/help - المساعدة
/language - تغيير اللغة

*أوامر الإدارة:*
/admin - لوحة الإدارة
/stats - الإحصائيات
/broadcast - إذاعة رسالة
/ban - حظر مستخدم
/unban - إلغاء حظر
    `
  },
  
  en: {
    // Main Menu
    welcome: '👋 Welcome to Professional Downloader Bot!\n\nSend a video or audio link to download.',
    mainMenu: '📋 Main Menu',
    download: '⬇️ Download',
    myDownloads: '📁 My Downloads',
    settings: '⚙️ Settings',
    help: '❓ Help',
    language: '🌐 Language',
    
    // Download Process
    sendLink: '📎 Send video or audio link',
    processing: '⏳ Processing...',
    fetchingInfo: '🔍 Fetching file information...',
    selectQuality: '📊 Select quality:',
    selectFormat: '📝 Select format:',
    downloading: '⬇️ Downloading... {progress}%',
    uploadingFile: '📤 Uploading file...',
    uploadingLink: '🔗 Creating direct link...',
    downloadComplete: '✅ Download completed!',
    downloadFailed: '❌ Download failed. Try again.',
    
    // File Info
    title: '📌 Title',
    duration: '⏱ Duration',
    size: '💾 Size',
    quality: '🎬 Quality',
    format: '📄 Format',
    
    // Download Options
    sendAsFile: '📁 Send as File',
    sendAsLink: '🔗 Send as Link',
    cancel: '❌ Cancel',
    back: '🔙 Back',
    
    // History
    downloadHistory: '📁 Download History',
    noHistory: 'No previous downloads',
    clearHistory: '🗑 Clear History',
    historyCleared: '✅ History cleared',
    
    // Settings
    settingsMenu: '⚙️ Settings',
    changeLanguage: '🌐 Change Language',
    languageChanged: '✅ Language changed',
    defaultQuality: '🎬 Default Quality',
    autoDelete: '🗑 Auto Delete',
    notifications: '🔔 Notifications',
    
    // Admin Panel
    adminPanel: '👑 Admin Panel',
    statistics: '📊 Statistics',
    broadcast: '📢 Broadcast',
    scheduledBroadcast: '⏰ Scheduled Broadcast',
    users: '👥 Users',
    activeUsers: '✅ Active Users',
    bannedUsers: '🚫 Banned Users',
    logs: '📝 Activity Logs',
    roles: '🎭 Roles',
    forceSubscription: '🔒 Force Subscription',
    
    // Statistics
    totalUsers: '👥 Total Users',
    activeToday: '✅ Active Today',
    totalDownloads: '⬇️ Total Downloads',
    downloadsToday: '📊 Downloads Today',
    bannedCount: '🚫 Banned',
    
    // Broadcast
    enterBroadcastMessage: '📝 Enter broadcast message:',
    broadcastSent: '✅ Broadcast sent to {count} users',
    broadcastScheduled: '⏰ Broadcast scheduled',
    selectDateTime: '📅 Select date and time',
    
    // User Management
    enterUserId: '🔢 Enter user ID:',
    userBanned: '🚫 User banned',
    userUnbanned: '✅ User unbanned',
    userNotFound: '❌ User not found',
    banReason: '📝 Ban reason',
    
    // Roles
    assignRole: '🎭 Assign Role',
    roleAssigned: '✅ Role assigned',
    selectRole: 'Select role:',
    owner: '👑 Owner',
    admin: '⚡ Admin',
    moderator: '🛡 Moderator',
    user: '👤 User',
    
    // Force Subscription
    mustJoinChannel: '⚠️ You must join the channel first:',
    joinChannel: '✅ Join Channel',
    checkSubscription: '🔄 Check Subscription',
    subscriptionVerified: '✅ Subscription verified',
    
    // Errors
    error: '❌ An error occurred',
    invalidLink: '❌ Invalid link',
    fileTooLarge: '❌ File too large (max {max} MB)',
    rateLimitExceeded: '⏳ Rate limit exceeded. Try after {time} seconds',
    spamDetected: '🚫 Spam detected. You are temporarily banned',
    notAuthorized: '🚫 You are not authorized for this action',
    
    // Help
    helpText: `
📖 *User Guide*

*Download:*
1️⃣ Send video or audio link
2️⃣ Select desired quality
3️⃣ Choose to send as file or direct link

*Supported Platforms:*
• YouTube
• Instagram
• TikTok
• Facebook
• Twitter
• And more...

*Commands:*
/start - Start bot
/download - Download file
/history - Download history
/settings - Settings
/help - Help
/language - Change language

*Admin Commands:*
/admin - Admin panel
/stats - Statistics
/broadcast - Broadcast message
/ban - Ban user
/unban - Unban user
    `
  }
};

export function getText(lang, key, params = {}) {
  let text = languages[lang]?.[key] || languages['ar'][key] || key;
  
  // Replace parameters
  Object.keys(params).forEach(param => {
    text = text.replace(`{${param}}`, params[param]);
  });
  
  return text;
}
