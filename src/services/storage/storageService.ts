function getElectronStorageAPI() {
  if (typeof window === "undefined") return null;
  return (window as any).electronAPI?.storage || (window as any).electron?.storage || null;
}

export async function getStoragePath(): Promise<string | null> {
  const res = await fetch("/api/storage");
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to fetch storage path");
  }
  return data.storagePath;
}

export async function selectStorageFolder(): Promise<{ canceled: boolean; filePaths: string[] }> {
  const electronStorage = getElectronStorageAPI();
  if (electronStorage && typeof electronStorage.selectFolder === "function") {
    return electronStorage.selectFolder();
  }
  // Web fallback simulation
  return { canceled: true, filePaths: [] };
}

export async function setStoragePath(newPath: string): Promise<{ success: boolean; storagePath?: string; error?: string }> {
  const res = await fetch("/api/storage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storagePath: newPath }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    return { success: false, error: data.message || data.error || "Failed to set storage path" };
  }
  return data;
}

export async function moveLibrary(newPath: string): Promise<{ success: boolean; storagePath?: string; error?: string }> {
  const res = await fetch("/api/storage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storagePath: newPath, action: "move" }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    return { success: false, error: data.message || data.error || "Failed to move prompt library" };
  }
  return data;
}

export async function openStorageFolder(): Promise<{ success: boolean; error?: string }> {
  const storagePath = await getStoragePath();
  const electronStorage = getElectronStorageAPI();
  if (electronStorage && typeof electronStorage.openFolder === "function" && storagePath) {
    return electronStorage.openFolder(storagePath);
  }
  return { success: false, error: storagePath ? "Not running in Electron desktop environment." : "Storage path not configured." };
}
