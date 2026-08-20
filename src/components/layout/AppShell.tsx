"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { MobileSidebar } from "./MobileSidebar";
import { UpdateBanner } from "./UpdateBanner";
import { LockScreen } from "@/components/security/LockScreen";
import { AboutModal } from "@/components/modals/AboutModal";
import { QuickCaptureModal } from "@/components/quick-capture/QuickCaptureModal";
import { CommandPaletteModal } from "@/components/modals/CommandPaletteModal";
import { KeyboardShortcutsModal } from "@/components/modals/KeyboardShortcutsModal";

interface AppShellProps {
  children: React.ReactNode;
  session: {
    username: string;
    email: string;
  };
}

export function AppShell({ children, session }: AppShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const router = useRouter();

  const username = session?.username || "Developer";
  const email = session?.email || "developer@example.com";

  // Global Keyboard Shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      // Cmd/Ctrl + K: Command Palette
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Cmd/Ctrl + Shift + N: Quick Capture
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "N" || e.key === "n")) {
        e.preventDefault();
        setQuickCaptureOpen((prev) => !prev);
        return;
      }

      // '?' or Cmd/Ctrl + / : Keyboard Shortcuts Cheatsheet (when not typing in an input)
      if (
        ((e.ctrlKey || e.metaKey) && e.key === "/") ||
        (!isInput && e.key === "?")
      ) {
        e.preventDefault();
        setShortcutsModalOpen((prev) => !prev);
        return;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.electronAPI) {
      return;
    }

    const api = window.electronAPI;

    // Listen for native Electron menu navigation commands
    const unsubNavigate = api.onMenuNavigate?.((path: string) => {
      console.log("[AppShell] Native menu navigation:", path);
      if (path) {
        router.push(path);
      }
    });

    // Listen for open library folder command
    const unsubFolder = api.onOpenLibraryFolder?.(() => {
      if (api.storage?.openFolder) {
        api.storage.openFolder();
      }
    });

    // Listen for About dialog command
    const unsubAbout = api.onOpenAboutDialog?.(() => {
      setAboutModalOpen(true);
    });

    // Listen for Quick Capture command from system tray / menu
    const unsubCapture = api.onOpenQuickCapture?.(() => {
      setQuickCaptureOpen(true);
    });

    // Listen for Command Palette command
    const unsubPalette = (api as any).onOpenCommandPalette?.(() => {
      setCommandPaletteOpen(true);
    });

    // Listen for Shortcuts command
    const unsubShortcuts = (api as any).onOpenShortcuts?.(() => {
      setShortcutsModalOpen(true);
    });

    return () => {
      unsubNavigate?.();
      unsubFolder?.();
      unsubAbout?.();
      unsubCapture?.();
      unsubPalette?.();
      unsubShortcuts?.();
    };
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Fullscreen Application Lock Overlay */}
      <LockScreen />

      {/* Background Update Notification Banner & Shell Center */}
      <UpdateBanner />

      {/* Top Navbar */}
      <Navbar
        onMenuToggle={() => setMobileSidebarOpen(true)}
        onQuickCapture={() => setQuickCaptureOpen(true)}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        username={username}
        email={email}
      />

      {/* Main Layout Area */}
      <div className="flex flex-1 relative w-full overflow-hidden">
        {/* Mobile Sidebar overlay */}
        <MobileSidebar
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />

        {/* Desktop Sidebar (Left) */}
        <Sidebar />

        {/* Scrollable Content (Center/Right) */}
        <main className="flex-1 overflow-y-auto h-[calc(100vh-65px)] relative">
          {children}
        </main>
      </div>

      {/* Global Command Palette & Spotlight Search */}
      <CommandPaletteModal
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenQuickCapture={() => setQuickCaptureOpen(true)}
        onOpenShortcuts={() => setShortcutsModalOpen(true)}
      />

      {/* Global Keyboard Shortcuts Cheatsheet Modal */}
      <KeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />

      {/* Global Quick Capture Modal */}
      <QuickCaptureModal
        isOpen={quickCaptureOpen}
        onClose={() => setQuickCaptureOpen(false)}
        onSuccess={(promptId) => {
          router.push(`/prompts/${promptId}`);
        }}
      />

      {/* Native About AI Prompt Library Modal */}
      <AboutModal
        isOpen={aboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
        onCheckForUpdates={() => {
          if (window.electronAPI?.checkForUpdates) {
            window.electronAPI.checkForUpdates();
          }
        }}
      />
    </div>
  );
}
