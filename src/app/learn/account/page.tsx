import type { Metadata } from "next";
import { AccountSettings } from "@/features/auth";
import { AccountGoalForm } from "@/features/learning";

export const metadata: Metadata = { title: "Tài khoản | MasterEnglish" };

export default function AccountPage() {
  return (
    <main className="learning-content inner-page">
      <div className="page-heading">
        <span className="section-kicker">TÀI KHOẢN / THÔNG TIN CỦA BẠN</span>
        <h1>
          Hồ sơ và
          <br />
          <em>mục tiêu học tập.</em>
        </h1>
        <p>Cập nhật thông tin cá nhân, đổi mật khẩu và đặt mục tiêu TOEIC.</p>
      </div>
      <AccountSettings>
        <AccountGoalForm />
      </AccountSettings>
    </main>
  );
}
