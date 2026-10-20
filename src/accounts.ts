import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

// Email accounts, kept on this device. There is no server yet, so an account made here only
// works on this phone or browser. Passwords are never stored: only a salted SHA-256 hash.

const KEY = 'studentDues.users.v1';
type User = { name: string; hash: string };

export const normEmail = (e: string) => e.trim().toLowerCase();
export const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
export const MIN_PASSWORD = 8;

async function load(): Promise<Record<string, User>> {
  try { return JSON.parse((await AsyncStorage.getItem(KEY)) || '{}') || {}; } catch { return {}; }
}
const hashOf = (email: string, password: string) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, 'student-dues:' + normEmail(email) + ':' + password);

/** Creates an account. Throws a message to show the user if it can't. */
export async function createAccount(name: string, email: string, password: string) {
  const users = await load();
  const key = normEmail(email);
  if (users[key]) throw new Error('An account with this email already exists. Log in instead.');
  users[key] = { name: name.trim(), hash: await hashOf(key, password) };
  await AsyncStorage.setItem(KEY, JSON.stringify(users));
}

/** Checks an email and password. Returns the account's name, or throws a message to show the user. */
export async function logIn(email: string, password: string): Promise<string> {
  const users = await load();
  const u = users[normEmail(email)];
  if (!u) throw new Error('No account with this email. Sign up first.');
  if (u.hash !== (await hashOf(email, password))) throw new Error('Wrong password. Try again.');
  return u.name;
}
