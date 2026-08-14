import { getSQLiteDB } from "./db";
import {
  createPromptDb,
  addPromptVersionDb,
  updatePromptMetaDb,
  toggleFavoriteDb,
  deletePromptDb,
  getPromptsDb,
  getPromptByIdDb,
  CreatePromptPayload,
  AddVersionPayload,
  UpdateMetaPayload,
  GetPromptsOptions,
} from "./promptQueries";

export function createPrompt(payload: CreatePromptPayload) {
  const db = getSQLiteDB();
  return createPromptDb(db, payload);
}

export function addPromptVersion(payload: AddVersionPayload) {
  const db = getSQLiteDB();
  return addPromptVersionDb(db, payload);
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

export function getPrompts(options: GetPromptsOptions = {}) {
  const db = getSQLiteDB();
  return getPromptsDb(db, options);
}

export function getPromptById(promptId: string) {
  const db = getSQLiteDB();
  return getPromptByIdDb(db, promptId);
}
