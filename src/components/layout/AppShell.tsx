"use client";

import * as React from "react";
import { useState } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { MobileSidebar } from "./MobileSidebar";

interface AppShellProps {
  children: React.ReactNode;
  session: {
    username: string;
    email: string;
  };
}

export function AppShell({ children, session }: AppShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const username = session?.username || "Developer";
  const email = session?.email || "developer@example.com";

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
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
    </div>
  );
}
