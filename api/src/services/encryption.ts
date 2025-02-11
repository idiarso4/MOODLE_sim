import crypto from 'crypto';
import bcrypt from 'bcrypt';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-256-bit-secret';
const IV_LENGTH = 16; // For AES, this is always 16
const ALGORITHM = 'aes-256-cbc';
const SALT_ROUNDS = 10;

export class EncryptionService {
  private static instance: EncryptionService;
  private key: Buffer;

  private constructor() {
    // Convert encryption key to buffer of correct length
    this.key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  }

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Encrypts sensitive data
   */
  public encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
    
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  /**
   * Decrypts encrypted data
   */
  public decrypt(text: string): string {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift() || '', 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
    
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  }

  /**
   * Hashes sensitive data (one-way encryption)
   */
  public hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * Creates a secure random token
   */
  public generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Validates if a string is encrypted
   */
  public isEncrypted(text: string): boolean {
    try {
      const parts = text.split(':');
      return parts.length === 2 && parts[0].length === IV_LENGTH * 2;
    } catch {
      return false;
    }
  }

  /**
   * Hash a password using bcrypt
   */
  public async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Verify a password against its hash
   */
  public async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate a secure random token (alias for generateToken)
   */
  public generateSecureToken(length: number = 32): string {
    return this.generateToken(length);
  }
}
