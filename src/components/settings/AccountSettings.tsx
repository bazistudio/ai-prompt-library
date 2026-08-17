"use client";

import { useEffect, useState } from "react";
import { SettingsSection } from "./SettingsSection";
import { SettingRow } from "./SettingRow";
import { User, Shield, KeyRound, Lock, RefreshCw, Copy, Check, Download, AlertCircle, PlusCircle, Trash2, Eye, EyeOff } from "lucide-react";

import { SecurityStatusData } from "@/types/electron";

interface UserProfile {
  id: string;
  email: string;
  username: string;
  status: string;
  createdAt?: string;
}

export function AccountSettings() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [secStatus, setSecStatus] = useState<SecurityStatusData | null>(null);

  // Eye toggles for settings modals
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPinPassword, setShowPinPassword] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);

  // Password Modal State (Create vs Change)
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // PIN Setup Modal State
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinPassword, setPinPassword] = useState("");
  const [newPin, setNewPin] = useState("");
  const [pinMsg, setPinMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  // Recovery Key Display Modal
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  // Remove Credentials Flow States
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [removeStep, setRemoveStep] = useState<1 | 2>(1);
  const [removeInput, setRemoveInput] = useState("");
  const [showRemoveInput, setShowRemoveInput] = useState(false);
  const [removeMsg, setRemoveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Guard warning state when trying to turn lock ON without credentials
  const [guardWarning, setGuardWarning] = useState<string | null>(null);

  const fetchSecurityStatus = async () => {
    if (typeof window !== "undefined" && window.electronAPI?.security) {
      try {
        const res = await window.electronAPI.security.getStatus();
        setSecStatus(res);
      } catch (err) {
        console.error("Failed to get security status:", err);
      }
    }
  };

  useEffect(() => {
    const isElectron = typeof window !== "undefined" && Boolean(window.electronAPI);
    if (isElectron) {
      setProfile({
        id: "local",
        username: "Local Workspace",
        email: "Offline Mode",
        status: "Active",
      });
      setLoading(false);
    } else {
      fetch("/api/auth/me")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setProfile(data.user);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }

    fetchSecurityStatus();
  }, []);

  const handleToggleLock = async (targetEnabled: boolean) => {
    setGuardWarning(null);

    // Guard: Application Lock cannot be enabled until a password or PIN is configured
    if (targetEnabled && !secStatus?.hasCredential) {
      setGuardWarning("You need to create an application password first before enabling Application Lock.");
      setShowPasswordModal(true);
      return;
    }

    if (window.electronAPI?.security) {
      await window.electronAPI.security.toggleLock(targetEnabled);
      await fetchSecurityStatus();
    }
  };

  const handleSetLockMethod = async (method: "password" | "pin") => {
    if (method === "pin" && (!secStatus || !secStatus.hasPin)) {
      setShowPinModal(true);
      return;
    }
    if (window.electronAPI?.security) {
      await window.electronAPI.security.setLockMethod(method);
      await fetchSecurityStatus();
    }
  };

  const handleRemoveCredentials = async () => {
    setRemoveLoading(true);
    setRemoveMsg(null);
    try {
      if (window.electronAPI?.security) {
        const res = await window.electronAPI.security.removeCredentials(removeInput);
        if (res.success) {
          setShowRemoveModal(false);
          await fetchSecurityStatus();
          window.dispatchEvent(new CustomEvent("app:lock-state-changed"));
        } else {
          setRemoveStep(1);
          setRemoveInput("");
          setRemoveMsg({ type: "error", text: res.error || "Incorrect credentials." });
        }
      }
    } catch (err: any) {
      console.error("Failed to remove credentials:", err);
      setRemoveStep(1);
      setRemoveInput("");
      setRemoveMsg({ type: "error", text: err?.message || "An error occurred." });
    } finally {
      setRemoveLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    const isCreating = !secStatus?.hasPassword;

    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "Password must be at least 6 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (!isCreating && !currentPassword) {
      setPasswordMsg({ type: "error", text: "Current password is required to change your password." });
      return;
    }

    setPasswordLoading(true);
    try {
      if (window.electronAPI?.security) {
        const res = await window.electronAPI.security.changePassword(
          isCreating ? undefined : currentPassword,
          newPassword
        );
        if (res.success) {
          if (isCreating) {
            await window.electronAPI.security.toggleLock(true);
          }
          setPasswordMsg({
            type: "success",
            text: isCreating ? "Application password created successfully!" : "Password changed successfully!",
          });
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setGuardWarning(null);
          setTimeout(() => setShowPasswordModal(false), 1200);
          await fetchSecurityStatus();
        } else {
          setPasswordMsg({ type: "error", text: res.error || "Failed to update password." });
        }
      }
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err?.message || "An error occurred." });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSetupPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinMsg(null);

    if (!/^\d{6}$/.test(newPin)) {
      setPinMsg({ type: "error", text: "PIN must be exactly 6 digits." });
      return;
    }

    setPinLoading(true);
    try {
      if (window.electronAPI?.security) {
        const res = await window.electronAPI.security.setupPin(pinPassword, newPin);
        if (res.success) {
          setPinMsg({ type: "success", text: "6-Digit PIN configured!" });
          setPinPassword("");
          setNewPin("");
          setTimeout(() => setShowPinModal(false), 1200);
          await fetchSecurityStatus();
        } else {
          setPinMsg({ type: "error", text: res.error || "Failed to setup PIN." });
        }
      }
    } catch (err: any) {
      setPinMsg({ type: "error", text: err?.message || "Error configuring PIN." });
    } finally {
      setPinLoading(false);
    }
  };

  const handleGenerateRecoveryKey = async () => {
    setRecoveryLoading(true);
    try {
      if (window.electronAPI?.security) {
        const res = await window.electronAPI.security.generateRecoveryKey();
        if (res.success && res.recoveryKey) {
          setGeneratedKey(res.recoveryKey);
          setShowRecoveryModal(true);
          await fetchSecurityStatus();
        }
      }
    } catch (err) {
      console.error("Failed to generate recovery key:", err);
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleCopyKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleDownloadKey = () => {
    if (generatedKey) {
      const warningText = `AI Prompt Library Recovery Key\nGenerated: ${new Date().toISOString()}\n\nRecovery Key: ${generatedKey}\n\nWARNING: Keep this Recovery Key somewhere safe. This is your primary recovery method if you forget your password or PIN.`;
      const blob = new Blob([warningText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ai-prompt-library-recovery-key.txt";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const hasPassword = Boolean(secStatus?.hasPassword);
  const minLengthValid = newPassword.length >= 6;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  return (
    <div className="space-y-8 max-w-2xl text-left">
      {/* 1. Account Profile Details */}
      <SettingsSection
        title="Profile Information"
        description="Personal account parameters retrieved from local workspace authentication session."
      >
        <div className="glass-card p-5 rounded-2xl border border-border flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <User className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-foreground">
                {loading ? "Loading..." : profile?.username || "Developer"}
              </span>
              <span className="text-xs text-muted-foreground">
                {loading ? "Loading..." : profile?.email || "developer@example.com"}
              </span>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-status-online text-status-online-foreground capitalize">
            {profile?.status || "Active"}
          </span>
        </div>

        <SettingRow title="Username" description="Your unique developer workspace handle.">
          <span className="text-sm font-semibold text-foreground">
            {loading ? "..." : profile?.username}
          </span>
        </SettingRow>

        <SettingRow title="Email Address" description="Primary account email used for sign in.">
          <span className="text-sm font-semibold text-foreground">
            {loading ? "..." : profile?.email}
          </span>
        </SettingRow>
      </SettingsSection>

      {/* 2. Application Security & Lock */}
      <SettingsSection
        title="Application Security"
        description="Configure your application password, application lock, and emergency recovery key."
      >
        {/* Guard Warning Banner */}
        {guardWarning && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{guardWarning}</span>
          </div>
        )}

        {/* Password Section (Create vs Change) */}
        <SettingRow
          title="Password"
          description={
            hasPassword
              ? "Application password is configured."
              : "No application password has been created yet."
          }
        >
          {hasPassword ? (
            <button
              onClick={() => {
                setGuardWarning(null);
                setShowPasswordModal(true);
              }}
              className="px-3.5 py-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-muted text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <KeyRound className="h-3.5 w-3.5 text-primary" />
              <span>Change Password</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setGuardWarning(null);
                setShowPasswordModal(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Create Password</span>
            </button>
          )}
        </SettingRow>

        {/* Application Lock Section */}
        <SettingRow
          title="Application Lock"
          description="Require authentication when starting or reopening the application."
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleToggleLock(!secStatus?.enabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                secStatus?.enabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                  secStatus?.enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-xs font-semibold text-foreground">
              {secStatus?.enabled ? "ON" : "OFF"}
            </span>
          </div>
        </SettingRow>

        {secStatus?.enabled && (
          <>
            <SettingRow title="Lock Method" description="Choose whether to unlock using your Application Password or a 6-Digit PIN.">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-xs text-foreground font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="lockMethod"
                    checked={secStatus.method === "password"}
                    onChange={() => handleSetLockMethod("password")}
                    className="accent-primary"
                  />
                  Password
                </label>

                <label className="flex items-center gap-1.5 text-xs text-foreground font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="lockMethod"
                    checked={secStatus.method === "pin"}
                    onChange={() => handleSetLockMethod("pin")}
                    className="accent-primary"
                  />
                  PIN {secStatus.hasPin ? "(Configured)" : "(Not Set)"}
                </label>
              </div>
            </SettingRow>

            {!secStatus.hasPin && (
              <SettingRow title="Configure 6-Digit PIN" description="Set up a 6-digit numerical PIN for quick unlocking.">
                <button
                  onClick={() => setShowPinModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-muted text-xs font-semibold border border-border cursor-pointer flex items-center gap-1.5"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Setup PIN</span>
                </button>
              </SettingRow>
            )}
          </>
        )}

        {secStatus?.hasCredential && (
          <SettingRow
            title="Remove Lock Credentials"
            description="Permanently remove saved PIN and Password credentials from this device."
          >
            <button
              onClick={() => {
                setRemoveStep(1);
                setRemoveInput("");
                setShowRemoveInput(false);
                setRemoveMsg(null);
                setShowRemoveModal(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 border border-danger/30 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Remove Lock Code</span>
            </button>
          </SettingRow>
        )}

        {/* Emergency Recovery Key Section */}
        <SettingRow
          title="Recovery Key"
          description="Generate a 24-character recovery key. This is your primary recovery method if you forget your password or PIN."
        >
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateRecoveryKey}
              disabled={recoveryLoading}
              className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {recoveryLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
              <span>{secStatus?.hasRecoveryKey ? "Regenerate Recovery Key" : "Generate Recovery Key"}</span>
            </button>
            {secStatus?.hasRecoveryKey && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Active
              </span>
            )}
          </div>
        </SettingRow>
      </SettingsSection>

      {/* Remove Credentials Confirmation Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="max-w-md w-full glass-card p-6 rounded-2xl border border-danger/30 shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-danger/10 border border-danger/30 flex items-center justify-center text-danger shadow-sm">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Remove Lock Code</h3>
                <p className="text-xs text-muted-foreground">Step {removeStep} of 2</p>
              </div>
            </div>

            {removeMsg && (
              <div className="p-3 rounded-xl text-xs bg-danger/10 text-danger border border-danger/20">
                {removeMsg.text}
              </div>
            )}

            {removeStep === 1 ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  To remove your lock credentials, you must first verify your identity.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground block">
                    {secStatus?.hasPin && !secStatus?.hasPassword
                      ? "Enter your current PIN"
                      : !secStatus?.hasPin && secStatus?.hasPassword
                      ? "Enter your current password"
                      : "Enter your current PIN or Password"}
                  </label>
                  <div className="relative">
                    <input
                      type={showRemoveInput ? "text" : "password"}
                      value={removeInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (secStatus?.hasPin && !secStatus?.hasPassword) {
                          setRemoveInput(val.replace(/\D/g, "").slice(0, 6));
                        } else {
                          setRemoveInput(val);
                        }
                      }}
                      placeholder={
                        secStatus?.hasPin && !secStatus?.hasPassword
                          ? "••••••"
                          : !secStatus?.hasPin && secStatus?.hasPassword
                          ? "••••••••••••"
                          : "PIN or Password"
                      }
                      maxLength={secStatus?.hasPin && !secStatus?.hasPassword ? 6 : 100}
                      className={`w-full pl-3 pr-10 py-2 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-danger/50 ${
                        secStatus?.hasPin && !secStatus?.hasPassword ? "text-center font-mono tracking-widest text-sm" : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRemoveInput(!showRemoveInput)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
                    >
                      {showRemoveInput ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowRemoveModal(false)}
                    className="px-3.5 py-2 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setRemoveStep(2)}
                    disabled={
                      secStatus?.hasPin && !secStatus?.hasPassword
                        ? removeInput.length !== 6
                        : !removeInput.trim()
                    }
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-lg cursor-pointer disabled:opacity-50"
                  >
                    Continue
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Remove Lock Code?<br />
                  Your saved security credential will be permanently removed. You will need to create a new credential before Application Lock can be enabled again.
                </p>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setRemoveStep(1)}
                    className="px-3.5 py-2 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveCredentials}
                    disabled={removeLoading}
                    className="px-4 py-2 rounded-lg bg-danger text-danger-foreground text-xs font-bold hover:bg-danger/90 transition-colors shadow-lg cursor-pointer flex items-center gap-1.5"
                  >
                    {removeLoading ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    <span>Remove Lock Code</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-card p-6 rounded-2xl border border-border shadow-2xl space-y-4 text-left">
            <h3 className="text-base font-bold text-foreground">
              {hasPassword ? "Change Password" : "Create Application Password"}
            </h3>

            <p className="text-xs text-muted-foreground">
              {hasPassword
                ? "Enter your current password to authorize changing your password."
                : "Create a password to protect your prompt library and enable application lock."}
            </p>

            {passwordMsg && (
              <div
                className={`p-3 rounded-xl text-xs ${
                  passwordMsg.type === "success"
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    : "bg-danger/10 text-danger border border-danger/20"
                }`}
              >
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              {hasPassword && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-3 pr-10 py-2 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  {hasPassword ? "New Password" : "Password"}
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-3 pr-10 py-2 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  {hasPassword ? "Confirm New Password" : "Confirm Password"}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-3 pr-10 py-2 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements Checklist */}
              <div className="p-3 rounded-xl bg-secondary/40 border border-border text-[11px] space-y-1">
                <span className="font-semibold text-muted-foreground block mb-1">Password requirements</span>
                <div className={`flex items-center gap-1.5 ${minLengthValid ? "text-emerald-500" : "text-muted-foreground"}`}>
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  <span>Minimum length of 6 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${passwordsMatch ? "text-emerald-500" : "text-muted-foreground"}`}>
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  <span>Passwords match</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading || !minLengthValid || !passwordsMatch}
                  className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {passwordLoading ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : hasPassword ? (
                    "Save Password"
                  ) : (
                    "Create Password"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PIN Setup Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-card p-6 rounded-2xl border border-border shadow-2xl space-y-4 text-left">
            <h3 className="text-base font-bold text-foreground">Configure 6-Digit PIN</h3>

            {pinMsg && (
              <div
                className={`p-3 rounded-xl text-xs ${
                  pinMsg.type === "success"
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    : "bg-danger/10 text-danger border border-danger/20"
                }`}
              >
                {pinMsg.text}
              </div>
            )}

            <form onSubmit={handleSetupPinSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Verify Password</label>
                <div className="relative">
                  <input
                    type={showPinPassword ? "text" : "password"}
                    value={pinPassword}
                    onChange={(e) => setPinPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-3 pr-10 py-2 rounded-lg border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinPassword(!showPinPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
                  >
                    {showPinPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">New 6-Digit PIN</label>
                <div className="relative">
                  <input
                    type={showNewPin ? "text" : "password"}
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full pl-3 pr-10 py-2 rounded-lg border border-border bg-card text-foreground text-xs text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPin(!showNewPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
                  >
                    {showNewPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pinLoading}
                  className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {pinLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : "Save PIN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recovery Key Modal */}
      {showRecoveryModal && generatedKey && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-card p-6 rounded-2xl border border-primary/30 shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Save Your Recovery Key</h3>
                <p className="text-xs text-muted-foreground">
                  Store this key in a safe offline location. This is your primary recovery method if you forget your password or PIN.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-secondary/50 border border-border font-mono text-center text-sm font-bold tracking-widest text-primary selection:bg-primary selection:text-primary-foreground">
              {generatedKey}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyKey}
                className="flex-1 py-2 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedKey ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                <span>{copiedKey ? "Copied to Clipboard" : "Copy Key"}</span>
              </button>

              <button
                onClick={handleDownloadKey}
                className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Save Key File</span>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setShowRecoveryModal(false);
                  setGeneratedKey(null);
                }}
                className="px-4 py-2 rounded-lg bg-secondary text-foreground text-xs font-semibold hover:bg-muted cursor-pointer"
              >
                I Have Saved My Recovery Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
