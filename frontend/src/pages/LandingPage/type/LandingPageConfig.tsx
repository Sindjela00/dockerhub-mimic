import { Box, Shield, Users, Zap } from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface StatItemProps {
  value: string;
  label: string;
}

export const FEATURES: FeatureCardProps[] = [
  {
    icon: <Box size={18} />,
    title: "Container registry",
    description:
      "Store, manage and distribute your Docker images with a reliable and fast registry.",
  },
  {
    icon: <Shield size={18} />,
    title: "Security scanning",
    description:
      "Automatically scan images for vulnerabilities and keep your stack secure.",
  },
  {
    icon: <Zap size={18} />,
    title: "Fast pulls",
    description:
      "Optimized CDN delivery ensures your images are pulled quickly from anywhere in the world.",
  },
  {
    icon: <Users size={18} />,
    title: "Team collaboration",
    description:
      "Share repositories with your team, manage access and collaborate seamlessly.",
  },
];

export const STATS: StatItemProps[] = [
  { value: "10M+", label: "Repositories" },
  { value: "500B+", label: "Image pulls" },
  { value: "15M+", label: "Developers" },
  { value: "99.9%", label: "Uptime" },
];
