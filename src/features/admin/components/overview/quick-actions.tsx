"use client";

import Link from "next/link";
import { BookOpen, FileText, Layers, PlusCircle, Sliders, UserPlus } from "lucide-react";
import { useAuthSession } from "@/features/auth";

/** Lối tắt theo vai trò: quản trị viên hệ thống và giảng viên thấy hai bộ tác vụ khác nhau. */
export function QuickActions() {
  const { user } = useAuthSession();
  const isSystemAdmin = Boolean(user?.roles?.includes("SYSTEM_ADMIN"));

  return (
    <section className="glass-card admin-card">
      <div className="admin-card-head">
        <div>
          <span className="admin-kicker">{isSystemAdmin ? "THAO TÁC QUẢN TRỊ VIÊN" : "THAO TÁC GIẢNG VIÊN"}</span>
          <h2>
            {isSystemAdmin ? "Tác vụ quản trị " : "Tác vụ biên soạn "}
            <em>{isSystemAdmin ? "thường dùng" : "học liệu"}</em>
          </h2>
        </div>
      </div>
      <div className="admin-actions-grid">
        {isSystemAdmin ? (
          <>
            <Link href="/admin/users" className="btn-primary">
              <UserPlus size={16} aria-hidden="true" /> Phân quyền người dùng
            </Link>
            <Link href="/admin/content" className="btn-lime">
              <PlusCircle size={16} aria-hidden="true" /> Quản lý nội dung học tập
            </Link>
            <Link href="/admin/system" className="btn-ghost">
              <Sliders size={16} aria-hidden="true" /> Điều chỉnh cờ tính năng
            </Link>
            <Link href="/admin/system" className="btn-ghost">
              <FileText size={16} aria-hidden="true" /> Xem nhật ký kiểm toán
            </Link>
          </>
        ) : (
          <>
            <Link href="/admin/content" className="btn-lime">
              <PlusCircle size={16} aria-hidden="true" /> Quản trị từ vựng & bộ thẻ
            </Link>
            <Link href="/admin/content" className="btn-primary">
              <Layers size={16} aria-hidden="true" /> Thẩm định nội dung chờ duyệt
            </Link>
            {user?.roles.includes("LEARNER") && (
              <Link href="/learn/vocabulary" className="btn-ghost">
                <BookOpen size={16} aria-hidden="true" /> Xem từ điển góc nhìn học viên
              </Link>
            )}
          </>
        )}
      </div>
    </section>
  );
}
