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
  },
  {
    href: "/admin/content",
    label: "Quản trị nội dung",
    kicker: "CONTENT OPS",
    iconName: "BookOpenCheck",
  },
  {
    href: "/admin/system",
    label: "Chính sách & Nhật ký",
    kicker: "SYSTEM & AUDIT",
    iconName: "Sliders",
  },
  {
    href: "/admin/notifications",
    label: "Thông báo & Nhắc học",
    kicker: "NOTIFICATIONS",
    iconName: "Bell",
  },
];

export function getAdminNavItems(isSystemAdmin: boolean) {
  return isSystemAdmin
    ? adminNavItems
    : adminNavItems.filter(
        ({ href }) =>
          !["/admin/users", "/admin/system", "/admin/notifications"].includes(
            href
          )
      );
}
