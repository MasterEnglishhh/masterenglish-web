import { Mascot, type MascotExpression } from "@/components/mascot";
import { RouteTransition } from "@/components/route-transition";
import type { AuthMode } from "../types/auth";

const STAGE: Record<
  AuthMode,
  { expression: MascotExpression; lead: string; accent: string; body: string }
> = {
  login: {
    expression: "happy",
    lead: "Mỗi lần quay lại,",
    accent: "bạn tiến thêm một chút.",
    body: "Tiếng Anh không cần một bước nhảy thật lớn. Chỉ cần một nơi khiến bạn muốn học tiếp.",
  },
  register: {
    expression: "celebrating",
    lead: "Không cần giỏi",
    accent: "mới bắt đầu.",
    body: "Chỉ cần một chút tò mò, một mục tiêu của riêng bạn và một nơi để quay lại mỗi ngày.",
  },
  forgot: {
    expression: "thinking",
    lead: "Quên cũng không sao,",
    accent: "mình cùng bắt đầu lại.",
    body: "Xác minh email bằng mã OTP, rồi chọn một mật khẩu mới để quay lại nhịp học của bạn.",
  },
};

const MODE_ORDER: Record<AuthMode, number> = { login: 0, register: 1, forgot: 2 };
const CHIPS = ["Từ vựng", "Ôn đúng lúc", "Mục tiêu của bạn"];

/** Sân khấu bên trái của các trang tài khoản (chỉ hiện ở màn rộng): linh vật đổi biểu cảm theo chế độ. */
export function AuthStage({ mode }: { mode: AuthMode }) {
  const stage = STAGE[mode];
  return (
    <aside className="auth-stage" aria-hidden="true">
      <div className="glass-card auth-stage-card">
        <span className="auth-stage-blob auth-stage-blob-a" />
        <span className="auth-stage-blob auth-stage-blob-b" />
        {CHIPS.map((chip, i) => (
          <span key={chip} className={`auth-stage-chip auth-stage-chip-${i}`}>
            {chip}
          </span>
        ))}
        <span className="auth-stage-star auth-stage-star-a">✳</span>
        <span className="auth-stage-star auth-stage-star-b">✳</span>
        <RouteTransition transitionKey={mode} order={MODE_ORDER[mode]} className="auth-stage-content">
          <Mascot expression={stage.expression} idSuffix="-auth" className="auth-stage-mascot" />
          <div className="auth-stage-copy">
            <h2>
              {stage.lead} <em>{stage.accent}</em>
            </h2>
            <p>{stage.body}</p>
          </div>
        </RouteTransition>
      </div>
    </aside>
  );
}
