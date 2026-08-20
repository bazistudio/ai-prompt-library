import { LicenseInfo, DEFAULT_FREE_LICENSE, hasEntitlement } from "./licenseVerifier";

function isElectron(): boolean {
  return typeof window !== "undefined" && !!(window as any).electronAPI?.license;
}

export async function fetchLicenseStatus(): Promise<LicenseInfo> {
  if (isElectron()) {
    try {
      const res = await (window as any).electronAPI.license.getStatus();
      return res || DEFAULT_FREE_LICENSE;
    } catch (err) {
      console.error("[LicenseService] Electron getStatus failed:", err);
      return DEFAULT_FREE_LICENSE;
    }
  }

  try {
    const res = await fetch("/api/license");
    if (!res.ok) return DEFAULT_FREE_LICENSE;
    const data = await res.json();
    return data.license || DEFAULT_FREE_LICENSE;
  } catch (err) {
    console.error("[LicenseService] Web fetch license failed:", err);
    return DEFAULT_FREE_LICENSE;
  }
}

export async function activateLicense(licenseKey: string): Promise<{ success: boolean; license?: LicenseInfo; error?: string }> {
  if (isElectron()) {
    try {
      return await (window as any).electronAPI.license.activate(licenseKey);
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to activate license in desktop app." };
    }
  }

  try {
    const res = await fetch("/api/license", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Activation failed." };
    }
    return { success: true, license: data.license };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error during license activation." };
  }
}

export async function deactivateLicense(): Promise<{ success: boolean; error?: string }> {
  if (isElectron()) {
    try {
      return await (window as any).electronAPI.license.deactivate();
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to deactivate license." };
    }
  }

  try {
    const res = await fetch("/api/license", { method: "DELETE" });
    const data = await res.json();
    return { success: data.success ?? true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to deactivate license." };
  }
}

export { hasEntitlement };
