import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

interface BackupOptions {
  outputDir: string;
  filename?: string;
  includeTables?: string[];
}

interface BackupResult {
  filename: string;
  path: string;
  size: number;
  timestamp: Date;
}

export class BackupService {
  private readonly defaultBackupDir: string;

  constructor() {
    this.defaultBackupDir = path.join(process.cwd(), 'backups');
  }

  async createBackup(options: BackupOptions): Promise<BackupResult> {
    const {
      outputDir = this.defaultBackupDir,
      filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`,
      includeTables = []
    } = options;

    // Ensure backup directory exists
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, filename);
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Parse database URL
    const url = new URL(databaseUrl);
    const dbName = url.pathname.slice(1);
    const host = url.hostname;
    const port = url.port;
    const user = url.username;
    const password = url.password;

    // Build pg_dump command
    let command = `pg_dump -h ${host} -p ${port} -U ${user} -d ${dbName}`;

    if (includeTables.length > 0) {
      command += ` -t ${includeTables.join(' -t ')}`;
    }

    command += ` -f ${outputPath}`;

    try {
      // Set PGPASSWORD environment variable for authentication
      process.env.PGPASSWORD = password;

      // Execute backup command
      await execAsync(command);

      // Get file stats
      const stats = await fs.stat(outputPath);

      // Create backup record in database
      await prisma.backup.create({
        data: {
          filename,
          path: outputPath,
          size: stats.size,
          includedTables: includeTables,
          status: 'COMPLETED'
        }
      });

      return {
        filename,
        path: outputPath,
        size: stats.size,
        timestamp: new Date()
      };
    } catch (error) {
      // Log error and create failed backup record
      if (error instanceof Error) {
        await prisma.backup.create({
          data: {
            filename,
            path: outputPath,
            size: 0,
            includedTables: includeTables,
            status: 'FAILED',
            error: error.message
          }
        });
        throw new Error(`Backup failed: ${error.message}`);
      }
      throw error;
    } finally {
      // Clear PGPASSWORD environment variable
      delete process.env.PGPASSWORD;
    }
  }

  async restoreBackup(backupPath: string): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Verify backup file exists
    try {
      await fs.access(backupPath);
    } catch {
      throw new Error('Backup file not found');
    }

    // Parse database URL
    const url = new URL(databaseUrl);
    const dbName = url.pathname.slice(1);
    const host = url.hostname;
    const port = url.port;
    const user = url.username;
    const password = url.password;

    // Build psql command
    const command = `psql -h ${host} -p ${port} -U ${user} -d ${dbName} -f ${backupPath}`;

    try {
      // Set PGPASSWORD environment variable for authentication
      process.env.PGPASSWORD = password;

      // Execute restore command
      await execAsync(command);

      // Create restore record in database
      await prisma.backup.create({
        data: {
          filename: path.basename(backupPath),
          path: backupPath,
          size: (await fs.stat(backupPath)).size,
          status: 'RESTORED'
        }
      });
    } catch (error) {
      // Log error and create failed restore record
      if (error instanceof Error) {
        await prisma.backup.create({
          data: {
            filename: path.basename(backupPath),
            path: backupPath,
            size: (await fs.stat(backupPath)).size,
            status: 'RESTORE_FAILED',
            error: error.message
          }
        });
        throw new Error(`Restore failed: ${error.message}`);
      }
      throw error;
    } finally {
      // Clear PGPASSWORD environment variable
      delete process.env.PGPASSWORD;
    }
  }

  async listBackups(): Promise<BackupResult[]> {
    const backups = await prisma.backup.findMany({
      where: {
        status: 'COMPLETED'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return backups.map(backup => ({
      filename: backup.filename,
      path: backup.path,
      size: backup.size,
      timestamp: backup.createdAt
    }));
  }

  async deleteBackup(filename: string): Promise<void> {
    const backup = await prisma.backup.findFirst({
      where: {
        filename
      }
    });

    if (!backup) {
      throw new Error('Backup not found');
    }

    try {
      // Delete file
      await fs.unlink(backup.path);

      // Update database record
      await prisma.backup.update({
        where: { id: backup.id },
        data: { status: 'DELETED' }
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete backup: ${error.message}`);
      }
      throw error;
    }
  }
}
