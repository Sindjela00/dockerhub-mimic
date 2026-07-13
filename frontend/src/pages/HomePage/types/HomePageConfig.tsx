import { BookMarked, Download, Star } from "lucide-react";

export const QUICK_LINKS = [
  {
    icon: <BookMarked size={16} />,
    label: "My repositories",
    description: "View and manage all your public and private images.",
    link: "/repositories",
  },
  {
    icon: <Download size={16} />,
    label: "Most pulled",
    description: "Browse the most pulled repositories on the platform.",
    link: "/repositories?sortBy=pulls&sortDir=desc",
  },
  {
    icon: <Star size={16} />,
    label: "Starred images",
    description: "Quickly access repositories you've marked as favorite.",
    link: "/repositories?starred=true",
  },
];
