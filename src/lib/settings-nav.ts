import {
  Heart,
  User,
  Lock,
  Palette,
  Tv,
  Globe,
  Film,
  Star,
  Bell,
  Shield,
  Monitor,
  Info,
  type LucideIcon,
} from "lucide-react";

export interface SettingsLink {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const settingsLinks: SettingsLink[] = [
  {
    href: "/activity",
    label: "Your Activity",
    description: "Liked, saved and commented content",
    icon: Heart,
  },
  {
    href: "/settings/profile",
    label: "Edit Profile",
    description: "Update your name and username",
    icon: User,
  },
  {
    href: "/settings/account",
    label: "Account",
    description: "Change password or delete account",
    icon: Lock,
  },
  {
    href: "/settings/genres",
    label: "Genre Preferences",
    description: "Choose your favorite genres",
    icon: Palette,
  },
  {
    href: "/settings/subscriptions",
    label: "Streaming Services",
    description: "Manage your subscriptions",
    icon: Tv,
  },
  {
    href: "/settings/preferences",
    label: "Language & Region",
    description: "Set your language and region",
    icon: Globe,
  },
  {
    href: "/settings/media",
    label: "Media Preferences",
    description: "Duration and release year ranges",
    icon: Film,
  },
  {
    href: "/settings/content-rating",
    label: "Content Rating",
    description: "Maximum content maturity level",
    icon: Star,
  },
  {
    href: "/settings/notifications",
    label: "Notifications",
    description: "Manage notification preferences",
    icon: Bell,
  },
  {
    href: "/settings/privacy",
    label: "Privacy",
    description: "Control account visibility",
    icon: Shield,
  },
  {
    href: "/settings/sessions",
    label: "Active Sessions",
    description: "Manage your login sessions",
    icon: Monitor,
  },
  {
    href: "/settings/about",
    label: "About",
    description: "App version and legal information",
    icon: Info,
  },
];
