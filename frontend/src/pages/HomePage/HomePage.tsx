import { QUICK_LINKS, STATS } from "./types/HomePageConfig";

import Button from "../../components/Button/Button";
import CreateRepositoryModal from "@/components/Modals/CreateRepositoryModal/CreateRepositoryModal";
import QuickLink from "@/components/Cards/QuickLink/QuickLink";
import StatCard from "@/components/Cards/StatCard/StatCard";
import { useAuth } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { username } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="page-wrapper">
      <div
        className="relative w-full rounded-xl border border-border overflow-hidden px-8 py-10"
        style={{ background: "var(--color-bg-surface)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(var(--color-text-primary) 1px, transparent 1px),
                            linear-gradient(90deg, var(--color-text-primary) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-px bg-brand opacity-60" />

        <div className="relative">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                        text-[11px] font-medium mb-4 border border-brand-muted
                        bg-brand-subtle text-brand"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
            Docker Hub UKS
          </div>

          <h1 className="text-2xl font-semibold text-text-primary mb-2">
            Welcome back
          </h1>
          <p className="text-sm text-text-muted max-w-lg leading-relaxed mb-6">
            Manage your container images, explore public repositories, and
            collaborate with your team — all in one place.
          </p>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => setModalOpen(true)}
            >
              Create repository
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => navigate("/repositories")}
            >
              Explore images
            </Button>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-xs font-medium uppercase tracking-widest text-text-secondary mb-3">
          Overview
        </h2>
        <div className="card-grid grid-cols-2 sm:grid-cols-4">
          {STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-medium uppercase tracking-widest text-text-secondary mb-3">
          Quick actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {QUICK_LINKS.map((link) => (
            <QuickLink key={link.label} {...link} />
          ))}
        </div>
      </section>

      <CreateRepositoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={() => {
          setModalOpen(false);
          navigate("/repositories");
        }}
        username={username ?? ""}
      />
    </div>
  );
}
