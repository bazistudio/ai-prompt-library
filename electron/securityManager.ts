import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getDefaultDatabasePath } from "../src/database/local/manager";
import { SETTING_KEYS } from "../src/database/local/settingsQueries";

const RECOVERY_KEY_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export interface SecurityStatus {
  enabled: boolean;
  method: "password" | "pin";
  requireStartup: boolean;
  isLocked: boolean;
  hasPassword: boolean;
  hasPin: boolean;
  hasRecoveryKey: boolean;
  hasSecurityQuestions: boolean;
  lockoutRemainingSeconds: number;
}

let isLockedState = false;

function getStoreFilePath(): string {
  const dbPath = getDefaultDatabasePath();
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, "security_settings.json");
}

function readSecurityStore(): Record<string, string> {
  try {
    const file = getStoreFilePath();
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, "utf8");
      return JSON.parse(content);
    }
  } catch {
    // Ignore read errors
  }
  return {};
}

function writeSecurityStore(store: Record<string, string>): void {
  try {
    const file = getStoreFilePath();
    fs.writeFileSync(file, JSON.stringify(store, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write security store:", err);
  }
}

function getSecuritySetting(key: string): string | null {
  const store = readSecurityStore();
  return store[key] ?? null;
}

function setSecuritySetting(key: string, value: string | null): void {
  const store = readSecurityStore();
  if (value === null || value === undefined) {
    delete store[key];
  } else {
    store[key] = value;
  }
  writeSecurityStore(store);
}

/** Generate a cryptographically secure 24-character recovery key formatted as XXXX-XXXX-XXXX-XXXX-XXXX-XXXX */
export function generateRecoveryKey(): string {
  const chars: string[] = [];
  const alphabetLen = RECOVERY_KEY_ALPHABET.length;

  // Use crypto.randomBytes for entropy
  const randomBytes = crypto.randomBytes(24);
  for (let i = 0; i < 24; i++) {
    const randomIndex = randomBytes[i] % alphabetLen;
    chars.push(RECOVERY_KEY_ALPHABET[randomIndex]);
  }

  // Format as 6 groups of 4 characters: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
  const rawKey = chars.join("");
  return rawKey.match(/.{1,4}/g)?.join("-") || rawKey;
}

/** Check lockout remaining seconds based on failed attempts */
export function getLockoutRemainingSeconds(): number {
  const lockoutUntilStr = getSecuritySetting(SETTING_KEYS.APP_LOCK_LOCKOUT_UNTIL);
  if (!lockoutUntilStr) return 0;

  const lockoutUntil = parseInt(lockoutUntilStr, 10);
  const now = Date.now();
  if (now >= lockoutUntil) {
    return 0;
  }
  return Math.ceil((lockoutUntil - now) / 1000);
}

/** Calculate lockout cooldown duration based on failed attempts count */
function calculateCooldownMs(failedCount: number): number {
  if (failedCount >= 15) return 10 * 60 * 1000; // 10 minutes
  if (failedCount >= 10) return 2 * 60 * 1000;  // 2 minutes
  if (failedCount >= 5) return 30 * 1000;       // 30 seconds
  return 0;
}

/** Handle failed unlock attempt and update lockout timer in DB */
function recordFailedAttempt(): number {
  const currentFails = parseInt(getSecuritySetting(SETTING_KEYS.APP_LOCK_FAILED_ATTEMPTS) || "0", 10) + 1;
  setSecuritySetting(SETTING_KEYS.APP_LOCK_FAILED_ATTEMPTS, currentFails.toString());

  const cooldownMs = calculateCooldownMs(currentFails);
  if (cooldownMs > 0) {
    const lockoutUntil = Date.now() + cooldownMs;
    setSecuritySetting(SETTING_KEYS.APP_LOCK_LOCKOUT_UNTIL, lockoutUntil.toString());
  }

  return getLockoutRemainingSeconds();
}

/** Reset failed attempts counter on successful unlock */
function resetFailedAttempts(): void {
  setSecuritySetting(SETTING_KEYS.APP_LOCK_FAILED_ATTEMPTS, "0");
  setSecuritySetting(SETTING_KEYS.APP_LOCK_LOCKOUT_UNTIL, "0");
}

export function isAppLocked(): boolean {
  try {
    const enabled = getSecuritySetting(SETTING_KEYS.APP_LOCK_ENABLED) === "1";
    const requireStartup = getSecuritySetting(SETTING_KEYS.REQUIRE_LOCK_ON_STARTUP) !== "0";

    if (!enabled || !requireStartup) {
      return false;
    }

    return isLockedState;
  } catch {
    return false;
  }
}

export function setAppLockedState(locked: boolean): void {
  isLockedState = locked;
}

export function getSecurityStatus(): SecurityStatus {
  try {
    const enabled = getSecuritySetting(SETTING_KEYS.APP_LOCK_ENABLED) === "1";
    const method = (getSecuritySetting(SETTING_KEYS.APP_LOCK_METHOD) as "password" | "pin") || "password";
    const requireStartup = getSecuritySetting(SETTING_KEYS.REQUIRE_LOCK_ON_STARTUP) !== "0";
    const hasPassword = Boolean(getSecuritySetting(SETTING_KEYS.APP_LOCK_PASSWORD_HASH));
    const hasPin = Boolean(getSecuritySetting(SETTING_KEYS.APP_LOCK_PIN_HASH));
    const hasRecoveryKey = Boolean(getSecuritySetting(SETTING_KEYS.APP_LOCK_RECOVERY_KEY_HASH));
    const hasSecurityQuestions = Boolean(getSecuritySetting(SETTING_KEYS.APP_LOCK_SECURITY_QUESTIONS));

    return {
      enabled,
      method,
      requireStartup,
      isLocked: isAppLocked(),
      hasPassword,
      hasPin,
      hasRecoveryKey,
      hasSecurityQuestions,
      lockoutRemainingSeconds: getLockoutRemainingSeconds(),
    };
  } catch {
    return {
      enabled: false,
      method: "password",
      requireStartup: true,
      isLocked: false,
      hasPassword: true,
      hasPin: false,
      hasRecoveryKey: false,
      hasSecurityQuestions: false,
      lockoutRemainingSeconds: 0,
    };
  }
}

export async function unlockApplication(input: string): Promise<{ success: boolean; error?: string; lockoutRemaining?: number }> {
  const lockoutRemaining = getLockoutRemainingSeconds();
  if (lockoutRemaining > 0) {
    return { success: false, error: `Application locked due to repeated failed attempts. Try again in ${lockoutRemaining} seconds.`, lockoutRemaining };
  }

  const method = getSecuritySetting(SETTING_KEYS.APP_LOCK_METHOD) || "password";

  let targetHash: string | null = null;
  if (method === "pin") {
    targetHash = getSecuritySetting(SETTING_KEYS.APP_LOCK_PIN_HASH);
  }
  if (!targetHash) {
    targetHash = getSecuritySetting(SETTING_KEYS.APP_LOCK_PASSWORD_HASH);
  }

  if (!targetHash) {
    // If no lock hash exists, unlock freely
    isLockedState = false;
    resetFailedAttempts();
    return { success: true };
  }

  const isValid = await bcrypt.compare(input, targetHash);
  if (isValid) {
    isLockedState = false;
    resetFailedAttempts();
    return { success: true };
  } else {
    const remaining = recordFailedAttempt();
    return {
      success: false,
      error: remaining > 0 ? `Incorrect credential. App locked for ${remaining} seconds.` : "Incorrect password or PIN.",
      lockoutRemaining: remaining,
    };
  }
}

export async function setupOrUpdatePassword(currentPassword?: string, newPassword?: string): Promise<{ success: boolean; error?: string }> {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "New password must be at least 6 characters." };
  }

  const existingHash = getSecuritySetting(SETTING_KEYS.APP_LOCK_PASSWORD_HASH);

  if (existingHash) {
    if (!currentPassword) {
      return { success: false, error: "Current password is required to change password." };
    }
    const isValid = await bcrypt.compare(currentPassword, existingHash);
    if (!isValid) {
      return { success: false, error: "Current password is incorrect." };
    }
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  setSecuritySetting(SETTING_KEYS.APP_LOCK_PASSWORD_HASH, newHash);
  return { success: true };
}

export async function setupOrUpdatePin(password: string, pin: string): Promise<{ success: boolean; error?: string }> {
  if (!pin || !/^\d{6}$/.test(pin)) {
    return { success: false, error: "PIN must be exactly 6 digits." };
  }

  const existingPasswordHash = getSecuritySetting(SETTING_KEYS.APP_LOCK_PASSWORD_HASH);
  if (existingPasswordHash) {
    const isValid = await bcrypt.compare(password, existingPasswordHash);
    if (!isValid) {
      return { success: false, error: "Password verification failed." };
    }
  }

  const pinHash = await bcrypt.hash(pin, 10);
  setSecuritySetting(SETTING_KEYS.APP_LOCK_PIN_HASH, pinHash);
  setSecuritySetting(SETTING_KEYS.APP_LOCK_METHOD, "pin");
  return { success: true };
}

export async function removePin(currentPinOrPassword: string): Promise<{ success: boolean; error?: string }> {
  if (!currentPinOrPassword) {
    return { success: false, error: "Current PIN or password is required to remove PIN." };
  }

  const existingPinHash = getSecuritySetting(SETTING_KEYS.APP_LOCK_PIN_HASH);
  const existingPasswordHash = getSecuritySetting(SETTING_KEYS.APP_LOCK_PASSWORD_HASH);

  if (!existingPinHash) {
    return { success: true };
  }

  let isValid = false;
  isValid = await bcrypt.compare(currentPinOrPassword, existingPinHash);

  if (!isValid && existingPasswordHash) {
    isValid = await bcrypt.compare(currentPinOrPassword, existingPasswordHash);
  }

  if (!isValid) {
    recordFailedAttempt();
    return { success: false, error: "Verification failed. Incorrect PIN or password." };
  }

  setSecuritySetting(SETTING_KEYS.APP_LOCK_PIN_HASH, null);
  setSecuritySetting(SETTING_KEYS.APP_LOCK_METHOD, "password");
  return { success: true };
}

export async function removePassword(currentPassword: string): Promise<{ success: boolean; error?: string }> {
  if (!currentPassword) {
    return { success: false, error: "Current password is required to remove password." };
  }

  const existingPasswordHash = getSecuritySetting(SETTING_KEYS.APP_LOCK_PASSWORD_HASH);
  if (!existingPasswordHash) {
    return { success: true };
  }

  const isValid = await bcrypt.compare(currentPassword, existingPasswordHash);
  if (!isValid) {
    recordFailedAttempt();
    return { success: false, error: "Verification failed. Current password is incorrect." };
  }

  setSecuritySetting(SETTING_KEYS.APP_LOCK_PASSWORD_HASH, null);

  const hasPin = Boolean(getSecuritySetting(SETTING_KEYS.APP_LOCK_PIN_HASH));
  if (!hasPin) {
    setSecuritySetting(SETTING_KEYS.APP_LOCK_ENABLED, "0");
    isLockedState = false;
  } else {
    setSecuritySetting(SETTING_KEYS.APP_LOCK_METHOD, "pin");
  }

  return { success: true };
}

export async function generateAndSaveRecoveryKey(): Promise<{ success: boolean; recoveryKey?: string; error?: string }> {
  const plainKey = generateRecoveryKey();
  const cleanKey = plainKey.replace(/-/g, ""); // Normalize for hashing
  const keyHash = await bcrypt.hash(cleanKey, 10);

  setSecuritySetting(SETTING_KEYS.APP_LOCK_RECOVERY_KEY_HASH, keyHash);
  return { success: true, recoveryKey: plainKey };
}

export async function recoverAndResetCredentials(
  recoveryInput: string,
  newPassword: string,
  method: "key" | "questions"
): Promise<{ success: boolean; error?: string }> {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "New password must be at least 6 characters." };
  }

  if (method === "key") {
    const keyHash = getSecuritySetting(SETTING_KEYS.APP_LOCK_RECOVERY_KEY_HASH);
    if (!keyHash) {
      return { success: false, error: "No recovery key has been configured on this device." };
    }

    const cleanInput = recoveryInput.replace(/[\s-]/g, "").toUpperCase();
    const isValid = await bcrypt.compare(cleanInput, keyHash);
    if (!isValid) {
      return { success: false, error: "Invalid Recovery Key." };
    }
  } else {
    const questionsJson = getSecuritySetting(SETTING_KEYS.APP_LOCK_SECURITY_QUESTIONS);
    if (!questionsJson) {
      return { success: false, error: "No security questions configured." };
    }

    try {
      const savedQuestions: Array<{ questionId: number; answerHash: string }> = JSON.parse(questionsJson);
      const userAnswers: Array<{ questionId: number; answer: string }> = JSON.parse(recoveryInput);

      for (const saved of savedQuestions) {
        const provided = userAnswers.find((a) => a.questionId === saved.questionId);
        if (!provided || !provided.answer) {
          return { success: false, error: "All security questions must be answered." };
        }
        const cleanAnswer = provided.answer.trim().toLowerCase();
        const matches = await bcrypt.compare(cleanAnswer, saved.answerHash);
        if (!matches) {
          return { success: false, error: "One or more security question answers are incorrect." };
        }
      }
    } catch {
      return { success: false, error: "Invalid security question parameters." };
    }
  }

  // Invalidate old password & PIN, set new password, unlock app
  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  setSecuritySetting(SETTING_KEYS.APP_LOCK_PASSWORD_HASH, newPasswordHash);
  setSecuritySetting(SETTING_KEYS.APP_LOCK_PIN_HASH, null);
  setSecuritySetting(SETTING_KEYS.APP_LOCK_METHOD, "password");

  isLockedState = false;
  resetFailedAttempts();
  return { success: true };
}

export function toggleAppLock(enabled: boolean): { success: boolean } {
  setSecuritySetting(SETTING_KEYS.APP_LOCK_ENABLED, enabled ? "1" : "0");
  if (!enabled) {
    isLockedState = false;
  }
  return { success: true };
}

export function setLockMethod(method: "password" | "pin"): { success: boolean } {
  setSecuritySetting(SETTING_KEYS.APP_LOCK_METHOD, method);
  return { success: true };
}
