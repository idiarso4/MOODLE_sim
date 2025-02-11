import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { createAuditLog } from './auditLog';
import { EncryptionService } from './encryption';

const execAsync = promisify(exec);
const encryption = EncryptionService.getInstance();

interface BackupConfig {
  backupDir: string;
  databaseUrl: string;
  retentionDays: number;
  encryptBackups: boolean;
}

export class BackupService {
  private static instance: BackupService;
  private config: BackupConfig;

  private constructor() {
    this.config = {
      backupDir: process.env.BACKUP_DIR || './backups',
      databaseUrl: process.env.DATABASE_URL || '',
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '7'),
      encryptBackups: process.env.ENCRYPT_BACKUPS === 'true'
    };

    // Ensure backup directory exists
    if (!fs.existsSync(this.config.backupDir)) {
      fs.mkdirSync(this.config.backupDir, { recursive: true });
    }
  }

  public static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  /**
   * Creates a backup of the database
   */
  public async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    const filepath = path.join(this.config.backupDir, filename);

    try {
      // Create database dump
      await execAsync(`pg_dump "${this.config.databaseUrl}" > "${filepath}"`);

      // Encrypt backup if configured
      if (this.config.encryptBackups) {
        const fileContent = fs.readFileSync(filepath, 'utf8');
        const encryptedContent = encryption.encrypt(fileContent);
        fs.writeFileSync(`${filepath}.enc`, encryptedContent);
        fs.unlinkSync(filepath); // Remove unencrypted file
      }

      // Create audit log
      await createAuditLog({
        userId: 'SYSTEM',
        action: 'BACKUP_CREATED',
        resource: 'DATABASE',
        details: { filename },
        ipAddress: 'localhost',
        userAgent: 'BackupService'
      });

      return filepath;
    } catch (error) {
      console.error('Backup failed:', error);
      throw new Error('Failed to create backup');
    }
  }

  /**
   * Restores a backup
   */
  public async restoreBackup(filepath: string): Promise<void> {
    try {
      let restoreFilepath = filepath;

      // Decrypt backup if necessary
      if (filepath.endsWith('.enc')) {
        const encryptedContent = fs.readFileSync(filepath, 'utf8');
        const decryptedContent = encryption.decrypt(encryptedContent);
        restoreFilepath = filepath.replace('.enc', '');
        fs.writeFileSync(restoreFilepath, decryptedContent);
      }

      // Restore database
      await execAsync(`psql "${this.config.databaseUrl}" < "${restoreFilepath}"`);

      // Clean up decrypted file if it was created
      if (filepath.endsWith('.enc')) {
        fs.unlinkSync(restoreFilepath);
      }

      // Create audit log
      await createAuditLog({
        userId: 'SYSTEM',
        action: 'BACKUP_RESTORED',
        resource: 'DATABASE',
        details: { filename: path.basename(filepath) },
        ipAddress: 'localhost',
        userAgent: 'BackupService'
      });
    } catch (error) {
      console.error('Restore failed:', error);
      throw new Error('Failed to restore backup');
    }
  }

  /**
   * Cleans up old backups based on retention policy
   */
  public async cleanupOldBackups(): Promise<void> {
    try {
      const files = fs.readdirSync(this.config.backupDir);
      const now = new Date();

      for (const file of files) {
        const filepath = path.join(this.config.backupDir, file);
        const stats = fs.statSync(filepath);
        const daysOld = (now.getTime() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

        if (daysOld > this.config.retentionDays) {
          fs.unlinkSync(filepath);
          console.log(`Deleted old backup: ${file}`);
        }
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
      throw new Error('Failed to cleanup old backups');
    }
  }

  /**
   * Lists all available backups
   */
  public listBackups(): Array<{filename: string, size: number, created: Date}> {
    const files = fs.readdirSync(this.config.backupDir);
    return files.map(file => {
      const filepath = path.join(this.config.backupDir, file);
      const stats = fs.statSync(filepath);
      return {
        filename: file,
        size: stats.size,
        created: stats.mtime
      };
    }).sort((a, b) => b.created.getTime() - a.created.getTime());
  }
}
