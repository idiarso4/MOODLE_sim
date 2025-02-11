import { BackupService } from '../services/backup';
import cron from 'node-cron';

const backupService = BackupService.getInstance();

// Schedule daily backup at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Starting scheduled backup...');
  try {
    await backupService.createBackup();
    console.log('Backup completed successfully');
    
    // Cleanup old backups
    await backupService.cleanupOldBackups();
    console.log('Old backups cleaned up');
  } catch (error) {
    console.error('Scheduled backup failed:', error);
  }
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT signal');
  process.exit(0);
});
