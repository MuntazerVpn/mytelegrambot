import cron from 'node-cron';
import downloader from '../services/downloader.js';
import db from '../database/database.js';

class CleanupService {
  constructor() {
    this.scheduledTasks = [];
  }
  
  // Start cleanup scheduler
  start() {
    // Clean old files every hour
    const fileCleanupTask = cron.schedule('0 * * * *', () => {
      console.log('Running file cleanup...');
      const deletedCount = downloader.cleanOldFiles();
      console.log(`Deleted ${deletedCount} old files`);
    });
    
    this.scheduledTasks.push(fileCleanupTask);
    
    // Process scheduled broadcasts every minute
    const broadcastTask = cron.schedule('* * * * *', async () => {
      await this.processScheduledBroadcasts();
    });
    
    this.scheduledTasks.push(broadcastTask);
    
    console.log('Cleanup service started');
  }
  
  // Process scheduled broadcasts
  async processScheduledBroadcasts() {
    const broadcasts = db.getPendingBroadcasts();
    
    for (const broadcast of broadcasts) {
      try {
        const users = db.getAllUsers();
        let successCount = 0;
        let failedCount = 0;
        
        for (const user of users) {
          try {
            await this.bot.sendMessage(user.user_id, broadcast.message);
            successCount++;
          } catch (error) {
            failedCount++;
          }
          
          // Small delay
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        db.updateBroadcast(broadcast.id, {
          sent_at: Math.floor(Date.now() / 1000),
          success_count: successCount,
          failed_count: failedCount,
          status: 'completed'
        });
        
        console.log(`Scheduled broadcast ${broadcast.id} sent to ${successCount} users`);
      } catch (error) {
        console.error('Error processing scheduled broadcast:', error);
        db.updateBroadcast(broadcast.id, { status: 'failed' });
      }
    }
  }
  
  // Set bot instance
  setBot(bot) {
    this.bot = bot;
  }
  
  // Stop all scheduled tasks
  stop() {
    this.scheduledTasks.forEach(task => task.stop());
    console.log('Cleanup service stopped');
  }
}

export default new CleanupService();
