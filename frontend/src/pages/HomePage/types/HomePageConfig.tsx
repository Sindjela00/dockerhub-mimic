import { BookMarked, Download, Star } from "lucide-react";

export const STATS = [
  { label: "Repositories", value: "12" },
  { label: "Total pulls", value: "4.2k" },
  { label: "Stars", value: "38" },
  { label: "Teams", value: "2" },
];

export const QUICK_LINKS = [
  {
    icon: <BookMarked size={16} />,
    label: "My repositories",
    description: "View and manage all your public and private images.",
    link: "/repositories",
  },
  {
    icon: <Download size={16} />,
    label: "Recent pulls",
    description: "See which images were recently pulled from your account.",
  },
  {
    icon: <Star size={16} />,
    label: "Starred images",
    description: "Quickly access repositories you've marked as favorite.",
  },
];
