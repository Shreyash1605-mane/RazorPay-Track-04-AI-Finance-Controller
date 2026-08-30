/**
 * Client-Side Local Encryption Engine
 * Uses Web Crypto API (PBKDF2 + AES-GCM 256-bit)
 * Ensures user statement and financial records remain zero-knowledge and encrypted locally.
 */

const SALT_STORAGE_KEY = 'niveshshathi_local_salt_v1';
const VAULT_STORAGE_KEY = 'niveshshathi_vault_payload_v1';
const AUTH_USERS_KEY = 'niveshshathi_registered_users_v1';

// Generate or retrieve persistent machine salt
function getOrCreateSalt(): Uint8Array {
  let saltStr = localStorage.getItem(SALT_STORAGE_KEY);
  if (!saltStr) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    saltStr = Array.from(salt).join(',');
    localStorage.setItem(SALT_STORAGE_KEY, saltStr);
    return salt;
  }
  return new Uint8Array(saltStr.split(',').map(Number));
}

// Derive a 256-bit AES-GCM key from password/PIN
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt plaintext or object to encrypted bundle { iv, ciphertext }
export async function encryptData(data: any, secretKey: string): Promise<string> {
  const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
  const enc = new TextEncoder();
  const salt = getOrCreateSalt();
  const key = await deriveKey(secretKey, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    enc.encode(plaintext)
  );

  const bundle = {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encryptedBuffer)),
    v: 1,
    timestamp: Date.now(),
  };

  return JSON.stringify(bundle);
}

// Decrypt encrypted bundle back to string or parsed object
export async function decryptData(encryptedBundleStr: string, secretKey: string): Promise<any> {
  try {
    const bundle = JSON.parse(encryptedBundleStr);
    const salt = getOrCreateSalt();
    const key = await deriveKey(secretKey, salt);
    const iv = new Uint8Array(bundle.iv);
    const data = new Uint8Array(bundle.data);

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      data
    );

    const dec = new TextDecoder();
    const text = dec.decode(decryptedBuffer);
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch (err) {
    throw new Error('Decryption failed. Incorrect secret key or corrupted data.');
  }
}

// Save encrypted app state to local storage
export function saveEncryptedVault(encryptedPayloadOrData: any, userKey?: string): void {
  if (typeof encryptedPayloadOrData === 'string' && !userKey) {
    localStorage.setItem(VAULT_STORAGE_KEY, encryptedPayloadOrData);
  } else {
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(encryptedPayloadOrData));
  }
}

// Load encrypted app state string from local storage
export function loadEncryptedVault(userKey?: string): string | null {
  const encrypted = localStorage.getItem(VAULT_STORAGE_KEY);
  return encrypted;
}

// Check if an encrypted vault exists
export function hasEncryptedVault(): boolean {
  return !!localStorage.getItem(VAULT_STORAGE_KEY);
}

// Completely clear all stored data
export function wipeAllLocalData(): void {
  localStorage.removeItem(VAULT_STORAGE_KEY);
  localStorage.removeItem('niveshshathi_session_v1');
}

export function clearLocalVault(): void {
  wipeAllLocalData();
}

// User accounts storage
export interface RegisteredUserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  employmentType: 'Salaried' | 'Self-Employed' | 'Business' | 'Professional' | 'Senior Citizen';
  taxRegimePreference: 'Old Regime' | 'New Regime' | 'Auto-Calculate Best';
  monthlyIncomeEstimate?: number;
  fixedMonthlyCommitments?: number;
  createdAt: string;
}

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = getOrCreateSalt();
  const combined = new Uint8Array([...salt, ...enc.encode(password)]);
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getRegisteredUsers(): RegisteredUserRecord[] {
  const raw = localStorage.getItem(AUTH_USERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveRegisteredUser(user: RegisteredUserRecord): void {
  const users = getRegisteredUsers();
  const index = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase() || u.phone === user.phone);
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}
