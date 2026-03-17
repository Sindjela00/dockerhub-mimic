import { ChevronLeft, ChevronRight, LogOut, Menu } from "lucide-react";

import Button from "../Button/Button";
import Logo from "../Logo/Logo";
import { NAV_SECTIONS } from "./types/sidebarConfig";
import { Plan } from "./types/types";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export interface SidebarProps {
  activePath?: string;
  onNavigate?: (path: string) => void;
  username?: string;
  plan?: Plan;
}

export default function Sidebar({
  activePath = "/",
  onNavigate,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { clearAuth } = useAppContext();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    onNavigate?.(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/landing");
  };

  return (
    <>
      {/* Mobile open menu */}
      <Button
        size="sm"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        className="fixed top-3 left-5 z-50 border border-border
                   bg-bg-surface sm:hidden"
      >
        <Menu size={18} />
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 sm:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: collapsed ? "56px" : "232px",
          minWidth: collapsed ? "56px" : "232px",
        }}
        className={[
          "hidden sm:flex flex-col h-full overflow-hidden",
          "bg-bg-surface border-r border-border",
          "transition-[width,min-width] duration-200 ease-in-out",
          mobileOpen ? "flex! fixed inset-y-0 left-0 z-50 w-58! min-w-58!" : "",
        ].join(" ")}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-3.5 py-3.5 min-h-14
                        border-b border-border"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <Logo size="sm" />
            <span
              className="text-sm font-medium text-text-primary
                         whitespace-nowrap transition-opacity duration-150"
              style={{
                opacity: collapsed ? 0 : 1,
                width: collapsed ? 0 : "auto",
              }}
            >
              Docker Hub
            </span>
          </div>

          <Button
            size="sm"
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Toggle sidebar"
            className="hidden! sm:flex!"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 flex flex-col gap-1">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="px-2">
              <p
                className="text-[10px] font-medium tracking-widest uppercase px-2 py-1.5
                           whitespace-nowrap text-text-muted
                           transition-opacity duration-150"
                style={{ opacity: collapsed ? 0 : 1 }}
              >
                {section.title}
              </p>

              {section.items.map((item) => {
                const isActive = activePath === item.path;
                return (
                  <Button
                    key={item.path}
                    size="sm"
                    onClick={() => handleNavigate(item.path)}
                    title={collapsed ? item.label : undefined}
                    className={[
                      "w-full justify-start mb-0.5 px-2.5 py-2",
                      isActive ? "bg-brand-subtle text-brand!" : "",
                    ].join(" ")}
                  >
                    <span className="min-w-4 flex items-center justify-center">
                      {item.icon}
                    </span>

                    <span
                      className="transition-opacity duration-150"
                      style={{ opacity: collapsed ? 0 : 1 }}
                    >
                      {item.label}
                    </span>

                    {item.badge !== undefined && (
                      <span
                        className="ml-auto text-[10px] px-1.5 py-0.5
                                   rounded-full
                                   bg-brand-muted text-brand
                                   transition-opacity duration-150"
                        style={{ opacity: collapsed ? 0 : 1 }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-border cursor-pointer">
          <Button
            size="sm"
            className="w-full justify-start px-2.5 py-2"
            onClick={handleLogout}
          >
            <LogOut size={15} />
            Log out
          </Button>
        </div>
      </aside>
    </>
  );
}
