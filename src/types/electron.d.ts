export interface UpdateStatusData {
  status: "idle" | "checking" | "available" | "not-available" | "downloading" | "downloaded" | "error";
  version?: string;
  percent?: number;
  bytesPerSecond?: number;
  error?: string;
}

export interface SecurityStatusData {
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

export interface ElectronAPI {
  getAppInfo: () => Promise<{ version: string; platform: string; arch: string }>;
  openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
  checkForUpdates: () => Promise<{ success: boolean; error?: string }>;

  updater?: {
    getUpdateStatus: () => Promise<UpdateStatusData>;
    installNow: () => Promise<void>;
    onStatus: (callback: (data: UpdateStatusData) => void) => () => void;
  };

  security?: {
    getStatus: () => Promise<SecurityStatusData>;
    unlock: (input: string) => Promise<{ success: boolean; error?: string; lockoutRemaining?: number }>;
    changePassword: (currentPassword?: string, newPassword?: string) => Promise<{ success: boolean; error?: string }>;
    setupPin: (password: string, pin: string) => Promise<{ success: boolean; error?: string }>;
    generateRecoveryKey: () => Promise<{ success: boolean; recoveryKey?: string; error?: string }>;
    recoverAccess: (recoveryInput: string, newPassword: string, method: "key" | "questions") => Promise<{ success: boolean; error?: string }>;
    toggleLock: (enabled: boolean) => Promise<{ success: boolean }>;
    setLockMethod: (method: "password" | "pin") => Promise<{ success: boolean }>;
  };

  storage?: {
    selectFolder: () => Promise<{ canceled: boolean; filePaths: string[] }>;
    openFolder: (targetPath?: string) => Promise<{ success: boolean; error?: string }>;
  };

  db?: {
    selectFolder: () => Promise<{ canceled: boolean; filePaths: string[] }>;
    openFolder: (targetPath?: string) => Promise<{ success: boolean; error?: string }>;
  };

  onMenuNavigate?: (callback: (path: string) => void) => () => void;
  onOpenLibraryFolder?: (callback: () => void) => () => void;
  onOpenAboutDialog?: (callback: () => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    electron?: ElectronAPI;
  }
}
