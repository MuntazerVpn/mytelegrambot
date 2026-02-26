import Database from 'better-sqlite3';
import { config } from '../config/config.js';
import fs from 'fs';
import path from 'path';

class DatabaseManager {
  constructor() {
    const dbDir = path.dirname(config.database.path);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    this.db = new Database(config.database.path);
    this.db.pragma('journal_mode = WAL');
    this.initTables();
  }
  
  initTables() {
    // Users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        language TEXT DEFAULT 'ar',
        role TEXT DEFAULT 'user',
        is_banned INTEGER DEFAULT 0,
        ban_reason TEXT,
        banned_at INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        last_active INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
    
    // Downloads table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS downloads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        url TEXT,
        title TEXT,
        platform TEXT,
        quality TEXT,
        format TEXT,
        file_size INTEGER,
        download_type TEXT,
        status TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )
    `);
    
    // Broadcasts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS broadcasts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT,
        scheduled_at INTEGER,
        sent_at INTEGER,
        total_users INTEGER,
        success_count INTEGER,
        failed_count INTEGER,
        status TEXT DEFAULT 'pending',
        created_by INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
    
    // Activity logs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT,
        details TEXT,
        ip_address TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
    
    // Rate limit table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        user_id INTEGER PRIMARY KEY,
        request_count INTEGER DEFAULT 0,
        window_start INTEGER DEFAULT (strftime('%s', 'now')),
        last_request INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
    
    // Spam detection table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS spam_detection (
        user_id INTEGER PRIMARY KEY,
        spam_count INTEGER DEFAULT 0,
        last_spam INTEGER,
        temp_ban_until INTEGER
      )
    `);
    
    // Settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);
  }
  
  // User methods
  getUser(userId) {
    return this.db.prepare('SELECT * FROM users WHERE user_id = ?').get(userId);
  }
  
  createUser(userId, userData) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO users (user_id, username, first_name, last_name, language, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      userId,
      userData.username || null,
      userData.first_name || null,
      userData.last_name || null,
      userData.language || 'ar',
      userData.role || 'user'
    );
  }
  
  updateUser(userId, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), userId];
    const stmt = this.db.prepare(`UPDATE users SET ${fields} WHERE user_id = ?`);
    return stmt.run(...values);
  }
  
  updateLastActive(userId) {
    const stmt = this.db.prepare('UPDATE users SET last_active = ? WHERE user_id = ?');
    return stmt.run(Math.floor(Date.now() / 1000), userId);
  }
  
  getAllUsers() {
    return this.db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  }
  
  getActiveUsers(hours = 24) {
    const timestamp = Math.floor(Date.now() / 1000) - (hours * 3600);
    return this.db.prepare('SELECT * FROM users WHERE last_active > ?').all(timestamp);
  }
  
  getBannedUsers() {
    return this.db.prepare('SELECT * FROM users WHERE is_banned = 1').all();
  }
  
  banUser(userId, reason) {
    const stmt = this.db.prepare(`
      UPDATE users SET is_banned = 1, ban_reason = ?, banned_at = ?
      WHERE user_id = ?
    `);
    return stmt.run(reason, Math.floor(Date.now() / 1000), userId);
  }
  
  unbanUser(userId) {
    const stmt = this.db.prepare(`
      UPDATE users SET is_banned = 0, ban_reason = NULL, banned_at = NULL
      WHERE user_id = ?
    `);
    return stmt.run(userId);
  }
  
  // Download methods
  addDownload(downloadData) {
    const stmt = this.db.prepare(`
      INSERT INTO downloads (user_id, url, title, platform, quality, format, file_size, download_type, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      downloadData.userId,
      downloadData.url,
      downloadData.title,
      downloadData.platform,
      downloadData.quality,
      downloadData.format,
      downloadData.fileSize,
      downloadData.downloadType,
      downloadData.status
    );
  }
  
  getUserDownloads(userId, limit = 10) {
    return this.db.prepare(`
      SELECT * FROM downloads WHERE user_id = ?
      ORDER BY created_at DESC LIMIT ?
    `).all(userId, limit);
  }
  
  clearUserDownloads(userId) {
    return this.db.prepare('DELETE FROM downloads WHERE user_id = ?').run(userId);
  }
  
  // Statistics methods
  getStats() {
    const totalUsers = this.db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const activeToday = this.getActiveUsers(24).length;
    const totalDownloads = this.db.prepare('SELECT COUNT(*) as count FROM downloads').get().count;
    const downloadsToday = this.db.prepare(`
      SELECT COUNT(*) as count FROM downloads
      WHERE created_at > ?
    `).get(Math.floor(Date.now() / 1000) - 86400).count;
    const bannedCount = this.db.prepare('SELECT COUNT(*) as count FROM users WHERE is_banned = 1').get().count;
    
    return {
      totalUsers,
      activeToday,
      totalDownloads,
      downloadsToday,
      bannedCount
    };
  }
  
  // Broadcast methods
  createBroadcast(broadcastData) {
    const stmt = this.db.prepare(`
      INSERT INTO broadcasts (message, scheduled_at, created_by, total_users)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(
      broadcastData.message,
      broadcastData.scheduledAt || null,
      broadcastData.createdBy,
      broadcastData.totalUsers
    );
  }
  
  updateBroadcast(id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), id];
    const stmt = this.db.prepare(`UPDATE broadcasts SET ${fields} WHERE id = ?`);
    return stmt.run(...values);
  }
  
  getPendingBroadcasts() {
    const now = Math.floor(Date.now() / 1000);
    return this.db.prepare(`
      SELECT * FROM broadcasts
      WHERE status = 'pending' AND scheduled_at <= ?
    `).all(now);
  }
  
  // Activity log methods
  addLog(userId, action, details = null) {
    const stmt = this.db.prepare(`
      INSERT INTO activity_logs (user_id, action, details)
      VALUES (?, ?, ?)
    `);
    return stmt.run(userId, action, details);
  }
  
  getLogs(limit = 100) {
    return this.db.prepare(`
      SELECT l.*, u.username, u.first_name
      FROM activity_logs l
      LEFT JOIN users u ON l.user_id = u.user_id
      ORDER BY l.created_at DESC
      LIMIT ?
    `).all(limit);
  }
  
  // Rate limit methods
  checkRateLimit(userId) {
    const now = Math.floor(Date.now() / 1000);
    const windowMs = config.rateLimit.windowMs / 1000;
    
    let record = this.db.prepare('SELECT * FROM rate_limits WHERE user_id = ?').get(userId);
    
    if (!record) {
      this.db.prepare(`
        INSERT INTO rate_limits (user_id, request_count, window_start)
        VALUES (?, 1, ?)
      `).run(userId, now);
      return { allowed: true, remaining: config.rateLimit.maxRequests - 1 };
    }
    
    if (now - record.window_start > windowMs) {
      this.db.prepare(`
        UPDATE rate_limits SET request_count = 1, window_start = ?
        WHERE user_id = ?
      `).run(now, userId);
      return { allowed: true, remaining: config.rateLimit.maxRequests - 1 };
    }
    
    if (record.request_count >= config.rateLimit.maxRequests) {
      const resetIn = windowMs - (now - record.window_start);
      return { allowed: false, resetIn };
    }
    
    this.db.prepare(`
      UPDATE rate_limits SET request_count = request_count + 1, last_request = ?
      WHERE user_id = ?
    `).run(now, userId);
    
    return { allowed: true, remaining: config.rateLimit.maxRequests - record.request_count - 1 };
  }
  
  // Spam detection methods
  checkSpam(userId) {
    const now = Math.floor(Date.now() / 1000);
    let record = this.db.prepare('SELECT * FROM spam_detection WHERE user_id = ?').get(userId);
    
    if (!record) {
      this.db.prepare(`
        INSERT INTO spam_detection (user_id, spam_count, last_spam)
        VALUES (?, 1, ?)
      `).run(userId, now);
      return { isSpam: false };
    }
    
    if (record.temp_ban_until && now < record.temp_ban_until) {
      return { isSpam: true, bannedUntil: record.temp_ban_until };
    }
    
    if (now - record.last_spam < 5) {
      const newCount = record.spam_count + 1;
      
      if (newCount >= config.antiSpam.threshold) {
        const banUntil = now + (config.antiSpam.banDuration / 1000);
        this.db.prepare(`
          UPDATE spam_detection SET spam_count = ?, last_spam = ?, temp_ban_until = ?
          WHERE user_id = ?
        `).run(newCount, now, banUntil, userId);
        return { isSpam: true, bannedUntil: banUntil };
      }
      
      this.db.prepare(`
        UPDATE spam_detection SET spam_count = ?, last_spam = ?
        WHERE user_id = ?
      `).run(newCount, now, userId);
    } else {
      this.db.prepare(`
        UPDATE spam_detection SET spam_count = 1, last_spam = ?
        WHERE user_id = ?
      `).run(now, userId);
    }
    
    return { isSpam: false };
  }
  
  close() {
    this.db.close();
  }
}

export default new DatabaseManager();
