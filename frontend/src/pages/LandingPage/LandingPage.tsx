import { Box, Shield, UserPlus, Users, Zap } from "lucide-react";
import { FEATURES, STATS } from "./type/LandingPageConfig";

import Button from "../../components/Button/Button";
import FeatureCard from "@/components/Cards/FeatureCard/FeatureCard";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <main className="flex-1 flex flex-col">
        <section className="flex flex-col items-center text-center px-6 pt-12 pb-20">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px]
                          font-medium mb-6 border border-brand-muted bg-brand-subtle text-brand"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
            The container image registry
          </div>

          <h1 className="text-4xl font-semibold text-text-primary max-w-xl leading-tight mb-4">
            Build, share and run{" "}
            <span style={{ color: "var(--color-brand)" }}>
              container images
            </span>
          </h1>

          <p className="text-sm text-text-muted max-w-md leading-relaxed mb-8">
            Docker Hub is the world's largest library and community for
            container images. Explore, manage and distribute your images with
            ease.
          </p>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate("/register")}
            >
              <UserPlus size={15} />
              Get started for free
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => navigate("/login")}
            >
              Sign in
            </Button>
          </div>
        </section>

        <section className="border-y border-border bg-bg-surface py-12 px-6">
          <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div className="flex flex-col items-center gap-1">
                <span className="text-3xl font-semibold text-text-primary">
                  {stat.value}
                </span>
                <span className="text-xs text-text-muted">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="max-w-3xl mx-auto">
            <h2
              className="text-xs font-medium uppercase tracking-widest
                           text-text-muted text-center mb-10"
            >
              Everything you need
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FEATURES.map((feature) => (
                <FeatureCard key={feature.title} {...feature} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
