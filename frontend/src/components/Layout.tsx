import Navbar from "./Navbar/Navbar";
import Sidebar from "./Sidebar/Sidebar";
import { useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
  pageTitle: string;
  showSidebar?: boolean;
}

export default function Layout({ pageTitle, children }: LayoutProps) {
  const [activePath, setActivePath] = useState("/");
  const [showSidebar, setShowSidebar] = useState("true");

  return (
    <div className="flex h-screen overflow-hidden bg-(--color-bg-base)">
      {showSidebar && (
        <Sidebar activePath={activePath} onNavigate={setActivePath} />
      )}

      <div className="px-5 flex flex-col flex-1 overflow-hidden">
        <Navbar title={pageTitle} isLoggedIn={false} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
