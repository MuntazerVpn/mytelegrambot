import TelegramBot from 'node-telegram-bot-api';
import { config } from './config/config.js';
import CommandHandlers from './handlers/commandHandlers.js';
import CallbackHandlers from './handlers/callbackHandlers.js';
import MessageHandlers from './handlers/messageHandlers.js';
import cleanupService from './utils/cleanup.js';
import db from './database/database.js';

// Validate configuration
if (!config.botToken) {
  console.error('❌ BOT_TOKEN is not set in .env file');
  process.exit(1);
}

// Create bot instance
const bot = new TelegramBot(config.botToken, { polling: true });

// Initialize handlers
const commandHandlers = new CommandHandlers(bot);
const callbackHandlers = new CallbackHandlers(bot, commandHandlers);
const messageHandlers = new MessageHandlers(bot, commandHandlers, callbackHandlers);

// Set bot instance for cleanup service
cleanupService.setBot(bot);

// Command handlers
bot.onText(/\/start/, (msg) => commandHandlers.handleStart(msg));
bot.onText(/\/download/, (msg) => commandHandlers.handleDownload(msg));
bot.onText(/\/history/, (msg) => commandHandlers.handleHistory(msg));
bot.onText(/\/settings/, (msg) => commandHandlers.handleSettings(msg));
bot.onText(/\/help/, (msg) => commandHandlers.handleHelp(msg));
bot.onText(/\/language/, (msg) => commandHandlers.handleLanguage(msg));
bot.onText(/\/admin/, (msg) => commandHandlers.handleAdmin(msg));
bot.onText(/\/stats/, (msg) => commandHandlers.handleStats(msg));
bot.onText(/\/broadcast/, (msg) => commandHandlers.handleBroadcast(msg));
bot.onText(/\/ban/, (msg) => commandHandlers.handleBan(msg));
bot.onText(/\/unban/, (msg) => commandHandlers.handleUnban(msg));

// Callback query handler
bot.on('callback_query', (query) => callbackHandlers.handleCallback(query));

// Message handler
bot.on('message', (msg) => {
  // Skip if it's a command
  if (msg.text && msg.text.startsWith('/')) return;
  
  messageHandlers.handleMessage(msg);
});

// Start cleanup service
cleanupService.start();

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Stopping bot...');
  cleanupService.stop();
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping bot...');
  cleanupService.stop();
  db.close();
  process.exit(0);
});

console.log('✅ Bot started successfully!');
console.log('📊 Database initialized');
console.log('🔄 Cleanup service running');
console.log('👋 Waiting for messages...');
