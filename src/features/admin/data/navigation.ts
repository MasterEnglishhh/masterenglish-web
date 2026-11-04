import type { NavItem } from "../types/admin";

export const adminNavItems: NavItem[] = [
  {
    href: "/admin",
    label: "Tổng quan",
    kicker: "DASHBOARD",
    iconName: "LayoutDashboard",
  },
  {
    href: "/admin/users",
    label: "Người dùng & Quyền",
    kicker: "USERS & ROLES",
    iconName: "Users",
    badge: "M09.01",
  },
  {
    href: "/admin/content",
    label: "Quản trị nội dung",
    kicker: "CONTENT OPS",
    iconName: "BookOpenCheck",
    badge: "M08",
  },
  {
    href: "/admin/system",
    label: "Chính sách & Nhật ký",
    kicker: "SYSTEM & AUDIT",
    iconName: "Sliders",
    badge: "M09.09",
  },
];
