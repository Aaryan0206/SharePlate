const crypto = require('crypto');

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function getSecret() {
  const configured = process.env.PICKUP_CODE_SECRET || process.env.JWT_SECRET;
  if (!configured) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('PICKUP_CODE_SECRET or JWT_SECRET must be configured in production.');
    }
    return 'shareplate_dev_pickup_secret_2026';
  }
  return configured;
}

function getAesKey() {
  return crypto.createHash('sha256').update(getSecret()).digest();
}

/**
 * Generates an unpredictable 8-character alphanumeric pickup verification code (e.g., "K7M3-P9Q2").
 */
function generatePickupCode() {
  const bytes = crypto.randomBytes(8);
  let raw = '';
  for (let i = 0; i < 8; i++) {
    raw += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

/**
 * Normalizes a submitted pickup code (trims whitespace, uppercases).
 */
function normalizeCode(code) {
  if (typeof code !== 'string') return '';
  return code.trim().toUpperCase();
}

/**
 * Computes an HMAC-SHA256 hash of the pickup code for secure storage and verification.
 */
function hashPickupCode(code) {
  const normalized = normalizeCode(code);
  return crypto.createHmac('sha256', getSecret()).update(normalized).digest('hex');
}

/**
 * Constant-time comparison between a submitted pickup code and a stored HMAC-SHA256 hash.
 */
function verifyPickupCode(submittedCode, storedHash) {
  if (!submittedCode || !storedHash) return false;
  const candidateHash = hashPickupCode(submittedCode);
  const a = Buffer.from(candidateHash, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Encrypts the pickup code with AES-256-GCM so MongoDB never stores plaintext,
 * while allowing only the authorized recipient endpoint to decrypt and display it.
 */
function encryptPickupCode(code) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getAesKey(), iv);
  let encrypted = cipher.update(normalizeCode(code), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted pickup code for the authorized recipient.
 */
function decryptPickupCode(payload) {
  if (!payload || typeof payload !== 'string') return null;
  const parts = payload.split(':');
  if (parts.length !== 3) return null;
  const [ivHex, authTagHex, ciphertextHex] = parts;
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getAesKey(),
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = {
  generatePickupCode,
  hashPickupCode,
  verifyPickupCode,
  encryptPickupCode,
  decryptPickupCode,
};
