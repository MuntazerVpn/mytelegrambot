import ytdl from 'ytdl-core';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { config } from '../config/config.js';

class DownloaderService {
  constructor() {
    this.tempDir = config.download.tempDir;
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }
  
  // Detect platform from URL
  detectPlatform(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube';
    } else if (url.includes('instagram.com')) {
      return 'instagram';
    } else if (url.includes('tiktok.com')) {
      return 'tiktok';
    } else if (url.includes('facebook.com') || url.includes('fb.watch')) {
      return 'facebook';
    } else if (url.includes('twitter.com') || url.includes('x.com')) {
      return 'twitter';
    }
    return 'unknown';
  }
  
  // Validate URL
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  // Get video info for YouTube
  async getYouTubeInfo(url) {
    try {
      const info = await ytdl.getInfo(url);
      const formats = ytdl.filterFormats(info.formats, 'videoandaudio');
      
      const qualities = [];
      const qualityMap = new Map();
      
      formats.forEach(format => {
        const quality = format.qualityLabel || format.quality;
        if (!qualityMap.has(quality)) {
          qualityMap.set(quality, {
            quality,
            format: format.container,
            size: format.contentLength ? parseInt(format.contentLength) : 0,
            itag: format.itag
          });
          qualities.push(qualityMap.get(quality));
        }
      });
      
      // Sort by quality
      qualities.sort((a, b) => {
        const aNum = parseInt(a.quality) || 0;
        const bNum = parseInt(b.quality) || 0;
        return bNum - aNum;
      });
      
      return {
        title: info.videoDetails.title,
        duration: this.formatDuration(parseInt(info.videoDetails.lengthSeconds)),
        thumbnail: info.videoDetails.thumbnails[0]?.url,
        author: info.videoDetails.author.name,
        qualities,
        platform: 'youtube'
      };
    } catch (error) {
      throw new Error('Failed to fetch YouTube video info: ' + error.message);
    }
  }
  
  // Get info for other platforms (using generic approach)
  async getGenericInfo(url, platform) {
    // This is a placeholder - in production, you'd use specific APIs or scrapers
    return {
      title: 'Video from ' + platform,
      duration: 'Unknown',
      thumbnail: null,
      qualities: [
        { quality: 'HD', format: 'mp4', size: 0 },
        { quality: 'SD', format: 'mp4', size: 0 }
      ],
      platform
    };
  }
  
  // Get video info
  async getVideoInfo(url) {
    if (!this.isValidUrl(url)) {
      throw new Error('Invalid URL');
    }
    
    const platform = this.detectPlatform(url);
    
    if (platform === 'youtube') {
      return await this.getYouTubeInfo(url);
    } else {
      return await this.getGenericInfo(url, platform);
    }
  }
  
  // Download YouTube video
  async downloadYouTube(url, quality, onProgress) {
    try {
      const info = await ytdl.getInfo(url);
      const format = ytdl.chooseFormat(info.formats, { quality: quality || 'highest' });
      
      const fileName = `${Date.now()}_${this.sanitizeFilename(info.videoDetails.title)}.${format.container}`;
      const filePath = path.join(this.tempDir, fileName);
      
      return new Promise((resolve, reject) => {
        const stream = ytdl(url, { quality: quality || 'highest' });
        const writeStream = fs.createWriteStream(filePath);
        
        let downloadedBytes = 0;
        const totalBytes = format.contentLength ? parseInt(format.contentLength) : 0;
        
        stream.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          if (totalBytes && onProgress) {
            const progress = Math.floor((downloadedBytes / totalBytes) * 100);
            onProgress(progress);
          }
        });
        
        stream.on('error', (error) => {
          fs.unlinkSync(filePath);
          reject(error);
        });
        
        writeStream.on('finish', () => {
          resolve({
            filePath,
            fileName,
            fileSize: fs.statSync(filePath).size,
            title: info.videoDetails.title
          });
        });
        
        stream.pipe(writeStream);
      });
    } catch (error) {
      throw new Error('Download failed: ' + error.message);
    }
  }
  
  // Download from generic URL
  async downloadGeneric(url, onProgress) {
    try {
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream'
      });
      
      const fileName = `${Date.now()}_download.mp4`;
      const filePath = path.join(this.tempDir, fileName);
      const writeStream = fs.createWriteStream(filePath);
      
      const totalBytes = parseInt(response.headers['content-length']) || 0;
      let downloadedBytes = 0;
      
      response.data.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (totalBytes && onProgress) {
          const progress = Math.floor((downloadedBytes / totalBytes) * 100);
          onProgress(progress);
        }
      });
      
      return new Promise((resolve, reject) => {
        response.data.pipe(writeStream);
        
        writeStream.on('finish', () => {
          resolve({
            filePath,
            fileName,
            fileSize: fs.statSync(filePath).size,
            title: fileName
          });
        });
        
        writeStream.on('error', (error) => {
          fs.unlinkSync(filePath);
          reject(error);
        });
      });
    } catch (error) {
      throw new Error('Download failed: ' + error.message);
    }
  }
  
  // Main download method
  async download(url, quality, onProgress) {
    const platform = this.detectPlatform(url);
    
    if (platform === 'youtube') {
      return await this.downloadYouTube(url, quality, onProgress);
    } else {
      return await this.downloadGeneric(url, onProgress);
    }
  }
  
  // Generate direct link (upload to temporary hosting)
  async generateDirectLink(filePath) {
    // This is a placeholder - in production, you'd upload to a file hosting service
    // For now, we'll just return a local file path
    return {
      directLink: `file://${filePath}`,
      expiresIn: 3600 // 1 hour
    };
  }
  
  // Delete file
  deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
  
  // Clean old files
  cleanOldFiles() {
    try {
      const files = fs.readdirSync(this.tempDir);
      const now = Date.now();
      const maxAge = config.download.autoCleanupHours * 3600 * 1000;
      
      let deletedCount = 0;
      files.forEach(file => {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      });
      
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning old files:', error);
      return 0;
    }
  }
  
  // Helper methods
  sanitizeFilename(filename) {
    return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50);
  }
  
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
  
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

export default new DownloaderService();
