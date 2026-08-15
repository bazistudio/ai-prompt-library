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
  const router = useRouter();

  const username = session?.username || "Developer";
  const email = session?.email || "developer@example.com";

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

    return () => {
      unsubNavigate?.();
      unsubFolder?.();
      unsubAbout?.();
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
