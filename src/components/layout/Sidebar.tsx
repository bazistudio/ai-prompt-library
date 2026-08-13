import { SidebarCategory } from "./SidebarCategory";
import { SidebarFooter } from "./SidebarFooter";

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-border bg-card p-4 hidden md:flex flex-col h-[calc(100vh-65px)] sticky top-[65px] shrink-0 overflow-y-auto z-30">
      <SidebarCategory />
      <SidebarFooter />
    </aside>
  );
}
