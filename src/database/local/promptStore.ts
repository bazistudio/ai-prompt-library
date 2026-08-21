import { getSQLiteDB } from "./db";
import { getSettingDb, SETTING_KEYS } from "./settingsQueries";
import {
  createPromptDb,
  addPromptVersionDb,
  updatePromptMetaDb,
  toggleFavoriteDb,
  deletePromptDb,
  getPromptsDb,
  getPromptByIdDb,
  getPromptStatsDb,
  incrementPromptUsageDb,
  CreatePromptPayload,
  AddVersionPayload,
  UpdateMetaPayload,
  GetPromptsOptions,
} from "./promptQueries";

export async function createPrompt(payload: CreatePromptPayload) {
  const db = getSQLiteDB();
  const storagePath = getSettingDb(db, SETTING_KEYS.PROMPT_LIBRARY_STORAGE_PATH);
  return createPromptDb(db, payload, storagePath);
}

export async function addPromptVersion(payload: AddVersionPayload) {
  const db = getSQLiteDB();
  const storagePath = getSettingDb(db, SETTING_KEYS.PROMPT_LIBRARY_STORAGE_PATH);
  return addPromptVersionDb(db, payload, storagePath);
}

export function updatePromptMeta(payload: UpdateMetaPayload) {
  const db = getSQLiteDB();
  return updatePromptMetaDb(db, payload);
}

export function toggleFavorite(promptId: string) {
  const db = getSQLiteDB();
  return toggleFavoriteDb(db, promptId);
}

export function deletePrompt(promptId: string) {
  const db = getSQLiteDB();
  return deletePromptDb(db, promptId);
}

export function incrementPromptUsage(promptId: string) {
  const db = getSQLiteDB();
  return incrementPromptUsageDb(db, promptId);
}

export function getPrompts(options: GetPromptsOptions = {}) {
  const db = getSQLiteDB();
  return getPromptsDb(db, options);
}

export function getPromptById(promptId: string) {
  const db = getSQLiteDB();
  return getPromptByIdDb(db, promptId);
}

export function getPromptStats() {
  const db = getSQLiteDB();
  return getPromptStatsDb(db);
}
