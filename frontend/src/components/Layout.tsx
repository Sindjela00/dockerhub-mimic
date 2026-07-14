import { useLocation, useNavigate } from "react-router-dom";

import Navbar from "./Navbar/Navbar";
import Sidebar from "./Sidebar/Sidebar";
import { useAuth } from "../context/AppContext";
import { useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  showSidebar?: boolean;
}

export default function Layout({
  pageTitle,
  children,
  showSidebar = true,
}: LayoutProps) {
  const { isLoggedIn } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const displaySidebar = showSidebar && isLoggedIn;

  return (
    <div className="flex h-screen overflow-hidden bg-(--color-bg-base)">
      {displaySidebar && (
        <Sidebar activePath={pathname} onNavigate={navigate} />
      )}

      <div className="flex flex-col flex-1 overflow-hidden px-5">
        <Navbar title={pageTitle} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
