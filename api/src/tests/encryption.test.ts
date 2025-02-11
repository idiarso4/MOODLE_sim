import { EncryptionService } from '../services/encryption';

describe('Encryption Service Tests', () => {
  let encryptionService: EncryptionService;

  beforeAll(() => {
    encryptionService = EncryptionService.getInstance();
  });

  describe('Data Encryption', () => {
    it('should encrypt and decrypt data correctly', () => {
      const testData = 'sensitive test data';
      const encrypted = encryptionService.encrypt(testData);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(testData);
      expect(encrypted).not.toBe(testData);
    });

    it('should generate different ciphertexts for same plaintext', () => {
      const testData = 'sensitive test data';
      const encrypted1 = encryptionService.encrypt(testData);
      const encrypted2 = encryptionService.encrypt(testData);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should throw error when decrypting invalid data', () => {
      expect(() => {
        encryptionService.decrypt('invalid-encrypted-data');
      }).toThrow();
    });
  });

  describe('Password Hashing', () => {
    it('should hash password correctly', async () => {
      const password = 'test-password';
      const hash = await encryptionService.hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should verify correct password', async () => {
      const password = 'test-password';
      const hash = await encryptionService.hashPassword(password);
      const isValid = await encryptionService.verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'test-password';
      const hash = await encryptionService.hashPassword(password);
      const isValid = await encryptionService.verifyPassword('wrong-password', hash);

      expect(isValid).toBe(false);
    });
  });

  describe('Token Generation', () => {
    it('should generate secure random token', () => {
      const token1 = encryptionService.generateSecureToken(32);
      const token2 = encryptionService.generateSecureToken(32);

      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(64); // hex encoded, so length is doubled
    });

    it('should generate tokens of requested length', () => {
      const token16 = encryptionService.generateSecureToken(16);
      const token32 = encryptionService.generateSecureToken(32);

      expect(token16.length).toBe(32); // hex encoded
      expect(token32.length).toBe(64); // hex encoded
    });
  });
});
