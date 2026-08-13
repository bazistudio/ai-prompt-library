"use client";

import { useEffect, useState } from "react";
import { SettingsSection } from "./SettingsSection";
import { SettingRow } from "./SettingRow";
import { User, Shield, KeyRound, LogOut, Trash2, Laptop } from "lucide-react";

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

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setProfile(data.user);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-8 max-w-2xl text-left">
      {/* 1. Account Profile Details */}
      <SettingsSection
        title="Profile Information"
        description="Your personal account parameters retrieved from MongoDB authentication session."
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

        <SettingRow title="Account Created" description="Date when this library workspace was registered.">
          <span className="text-sm font-semibold text-foreground">
            {loading ? "..." : formatDate(profile?.createdAt)}
          </span>
        </SettingRow>
      </SettingsSection>

      {/* 2. Security & Actions */}
      <SettingsSection
        title="Security & Actions"
        description="Manage security credentials and session authentications."
      >
        <SettingRow title="Edit Profile" description="Update your username or primary email address.">
          <div className="flex items-center gap-2">
            <button
              disabled
              className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground opacity-60 cursor-not-allowed flex items-center gap-1.5"
            >
              <User className="h-3.5 w-3.5" />
              <span>Edit Profile</span>
            </button>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground/50 border border-border">
              Soon
            </span>
          </div>
        </SettingRow>

        <SettingRow title="Change Password" description="Update your authentication password hash.">
          <div className="flex items-center gap-2">
            <button
              disabled
              className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground opacity-60 cursor-not-allowed flex items-center gap-1.5"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Change Password</span>
            </button>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground/50 border border-border">
              Soon
            </span>
          </div>
        </SettingRow>

        <SettingRow title="Logout All Devices" description="Revoke active HTTP-only session cookies across all browsers.">
          <div className="flex items-center gap-2">
            <button
              disabled
              className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground opacity-60 cursor-not-allowed flex items-center gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout All Devices</span>
            </button>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground/50 border border-border">
              Soon
            </span>
          </div>
        </SettingRow>
      </SettingsSection>

      {/* 3. Session details */}
      <SettingsSection
        title="Active Session"
        description="Information about your currently authenticated session."
      >
        <div className="glass-card p-4 rounded-xl border border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Laptop className="h-5 w-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground">Current Web Session</span>
              <span className="text-[10px] text-muted-foreground">HTTP-only cookie (auth_session)</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-status-online-foreground font-semibold px-2.5 py-1 rounded bg-status-online">
            <Shield className="h-3.5 w-3.5" />
            <span>Active</span>
          </div>
        </div>
      </SettingsSection>

      {/* 4. Danger Zone */}
      <SettingsSection
        title="Danger Zone"
        description="Irreversible account deletion actions."
      >
        <SettingRow title="Delete Account" description="Permanently delete your account and all associated prompts.">
          <div className="flex items-center gap-2">
            <button
              disabled
              className="px-3 py-1.5 rounded-lg border border-danger/30 bg-danger/10 text-xs font-semibold text-danger/60 opacity-50 cursor-not-allowed flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Account</span>
            </button>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground/50 border border-border">
              Soon
            </span>
          </div>
        </SettingRow>
      </SettingsSection>
    </div>
  );
}
