import type { Metadata } from "next";
import { AccountSettings } from "@/features/auth";

export const metadata: Metadata = { title: "Tài khoản | MasterEnglish" };

export default function AdminAccountPage() {
  return (
    <>
      <div className="admin-heading">
        <h1 className="admin-title">Tài khoản của tôi</h1>
        <p className="admin-description">Cập nhật thông tin cá nhân và đổi mật khẩu.</p>
      </div>
      <AccountSettings />
    </>
  );
}
