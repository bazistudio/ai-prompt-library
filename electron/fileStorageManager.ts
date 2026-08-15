import fs from "fs/promises";
import fsSync from "fs";
import path from "path";

const RESERVED_WINDOWS_NAMES = new Set([
  "CON", "PRN", "AUX", "NUL",
  "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
  "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"
]);

const INVALID_CHARS_REGEX = /[\\/:\*\?"<>\|]/;

export function sanitizeFilename(name: string): string {
  if (!name) return "untitled";
  let clean = name.replace(INVALID_CHARS_REGEX, "-").trim();
  clean = clean.replace(/[\. ]+$/, "");
  if (!clean || RESERVED_WINDOWS_NAMES.has(clean.toUpperCase())) {
    clean = `prompt_${clean || "file"}`;
  }
  return clean.slice(0, 80);
}

/** Check if path exists asynchronously */
export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

/** Ensure library manifest identity file exists in storage root */
export async function ensureLibraryManifest(storagePath: string | null): Promise<void> {
  if (!storagePath || !storagePath.trim()) return;

  const root = path.resolve(storagePath);
  if (!(await pathExists(root))) {
    await fs.mkdir(root, { recursive: true });
  }

  const manifestDir = path.join(root, ".ai-prompt-library");
  if (!(await pathExists(manifestDir))) {
    await fs.mkdir(manifestDir, { recursive: true });
  }

  const manifestFile = path.join(manifestDir, "library.json");
  if (!(await pathExists(manifestFile))) {
    const manifestContent = JSON.stringify(
      {
        libraryId: `lib_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`,
        libraryName: "AI Prompt Library",
        formatVersion: "1.0.0",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      null,
      2
    );
    await fs.writeFile(manifestFile, manifestContent, "utf-8");
    console.log(`[FileStorageManager] Created Library Manifest at: ${manifestFile}`);
  }
}

/** Ensure category subfolders exist in storage root */
export async function ensureCategoryFolders(
  storagePath: string | null,
  categories: Array<{ folder_name: string }>
): Promise<void> {
  if (!storagePath || !storagePath.trim()) return;

  const root = path.resolve(storagePath);
  if (!(await pathExists(root))) {
    await fs.mkdir(root, { recursive: true });
  }

  await ensureLibraryManifest(storagePath);

  for (const cat of categories) {
    if (!cat.folder_name) continue;
    const catDir = path.join(root, cat.folder_name);
    if (!(await pathExists(catDir))) {
      await fs.mkdir(catDir, { recursive: true });
    }
  }
}

/** Rename physical category folder asynchronously */
export async function renameCategoryFolder(
  storagePath: string | null,
  oldFolderName: string,
  newFolderName: string
): Promise<{ success: boolean; error?: string }> {
  if (!storagePath || !storagePath.trim()) {
    return { success: true }; // No physical folder to rename if no storage path
  }

  const root = path.resolve(storagePath);
  const oldPath = path.join(root, oldFolderName);
  const newPath = path.join(root, newFolderName);

  if (oldPath === newPath) return { success: true };

  try {
    if (await pathExists(oldPath)) {
      await fs.rename(oldPath, newPath);
    } else {
      await fs.mkdir(newPath, { recursive: true });
    }
    return { success: true };
  } catch (err: any) {
    console.error(`[FileStorageManager] Failed to rename category folder from ${oldPath} to ${newPath}:`, err);
    return { success: false, error: err.message || "Failed to rename physical folder." };
  }
}

/** Save prompt file asynchronously as Markdown inside category folder */
export async function savePromptFile(
  storagePath: string | null,
  categoryFolderName: string,
  promptId: string,
  title: string,
  content: string
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  if (!storagePath || !storagePath.trim()) {
    return { success: false, error: "Prompt library storage location is not configured." };
  }

  if (!categoryFolderName || !categoryFolderName.trim()) {
    return { success: false, error: "Category folder could not be resolved." };
  }

  try {
    const root = path.resolve(storagePath);
    const categoryDir = path.join(root, categoryFolderName.trim());

    if (!(await pathExists(categoryDir))) {
      await fs.mkdir(categoryDir, { recursive: true });
    }

    const cleanTitle = sanitizeFilename(title);
    const shortId = promptId.slice(0, 8);
    const fileName = `${cleanTitle}-${shortId}.md`;
    const filePath = path.join(categoryDir, fileName);

    const markdownContent = `# ${title}\n\n${content}\n`;
    await fs.writeFile(filePath, markdownContent, "utf-8");

    console.log(`[FileStorageManager] Prompt markdown file saved at: ${filePath}`);
    return { success: true, filePath };
  } catch (err: any) {
    console.error("[FileStorageManager] Failed to save prompt file:", err);
    return { success: false, error: err.message || "Failed to write prompt file to disk." };
  }
}

/** Helper: Copy directory recursively asynchronously */
async function copyDirRecursive(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/** Move/copy Prompt Library with explicit verification contract */
export async function moveLibrary(
  oldStoragePath: string,
  newStoragePath: string,
  categories: Array<{ folder_name: string }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const oldRoot = path.resolve(oldStoragePath);
    const newRoot = path.resolve(newStoragePath);

    if (oldRoot === newRoot) return { success: true };

    if (!(await pathExists(newRoot))) {
      await fs.mkdir(newRoot, { recursive: true });
    }

    // Step 1: Copy all contents from oldRoot to newRoot
    if (await pathExists(oldRoot)) {
      await copyDirRecursive(oldRoot, newRoot);
    }

    // Step 2: Initialize any missing category folders in newRoot
    await ensureCategoryFolders(newRoot, categories);

    // Step 3: Verification - check that newRoot exists and contains initialized category folders
    for (const cat of categories) {
      if (!cat.folder_name) continue;
      const catDir = path.join(newRoot, cat.folder_name);
      if (!(await pathExists(catDir))) {
        throw new Error(`Verification failed: Expected category folder "${cat.folder_name}" not found in destination.`);
      }
    }

    console.log(`[FileStorageManager] Successfully verified library copy to: ${newRoot}`);
    return { success: true };
  } catch (err: any) {
    console.error("[FileStorageManager] Move library failed verification:", err);
    return {
      success: false,
      error: err.message || "Failed to copy and verify prompt library to new location.",
    };
  }
}
