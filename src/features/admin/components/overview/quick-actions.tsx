"use client";

import Link from "next/link";
import { UserPlus, PlusCircle, Sliders, FileText, BookOpen, Layers } from "lucide-react";
import { useAuthSession } from "@/features/auth/hooks/use-auth-session";

export function QuickActions() {
  const { user } = useAuthSession();
  const isSystemAdmin = Boolean(user?.roles?.includes("SYSTEM_ADMIN"));

  if (!isSystemAdmin) {
    return (
      <div className="admin-card" style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <span className="admin-kicker">THAO TÁC GIẢNG VIÊN</span>
            <h2 style={{ fontSize: 18, fontWeight: 750, margin: 0 }}>
              Tác vụ biên soạn <em>học liệu</em>
            </h2>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          <Link href="/admin/content" className="btn-3d-lime" style={{ justifyContent: "flex-start" }}>
            <PlusCircle size={16} /> Quản trị từ vựng & bộ thẻ
          </Link>
          <Link href="/admin/content" className="btn-3d-dark" style={{ justifyContent: "flex-start" }}>
            <Layers size={16} /> Thẩm định nội dung chờ duyệt
          </Link>
          <Link href="/learn/vocabulary" className="btn-3d-outline" style={{ justifyContent: "flex-start" }}>
            <BookOpen size={16} /> Xem từ điển góc nhìn học viên
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-card" style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <span className="admin-kicker">THAO TÁC QUẢN TRỊ VIÊN</span>
          <h2 style={{ fontSize: 18, fontWeight: 750, margin: 0 }}>
            Tác vụ quản trị <em>thường dùng</em>
          </h2>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        <Link href="/admin/users" className="btn-3d-dark" style={{ justifyContent: "flex-start" }}>
          <UserPlus size={16} /> Phân quyền người dùng
        </Link>
        <Link href="/admin/content" className="btn-3d-lime" style={{ justifyContent: "flex-start" }}>
          <PlusCircle size={16} /> Quản lý nội dung học tập
        </Link>
        <Link href="/admin/system" className="btn-3d-outline" style={{ justifyContent: "flex-start" }}>
          <Sliders size={16} /> Điều chỉnh cờ tính năng
        </Link>
        <Link href="/admin/system" className="btn-3d-outline" style={{ justifyContent: "flex-start" }}>
          <FileText size={16} /> Xem nhật ký kiểm toán
        </Link>
      </div>
    </div>
  );
}
