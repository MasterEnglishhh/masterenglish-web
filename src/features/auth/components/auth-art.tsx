import { Brand } from "@/components/brand";

export function AuthArt() {
  return (
    <aside className="auth-art" aria-hidden="true">
      <div className="auth-art-top">
        <Brand />
        <span>YOUR SPACE TO GROW ↗</span>
      </div>

      <div className="auth-art-orbit orbit-a" />
      <div className="auth-art-orbit orbit-b" />

      <div className="auth-art-center">
        <span className="auth-art-letter">
          a<span>✳</span>z
        </span>
        <span className="auth-art-sticker">
          KEEP
          <br />
          GOING ↗
        </span>
      </div>

      <div className="auth-art-bottom">
        <span>HỌC CÓ HƯỚNG / TIẾN BỘ CÓ LÝ DO</span>
        <h2>
          Mỗi lần quay lại,
          <br />
          <em>bạn tiến thêm một chút.</em>
        </h2>
        <p>
          Tiếng Anh không cần một bước nhảy thật lớn. Chỉ cần một nơi khiến bạn muốn học tiếp.
        </p>
      </div>
    </aside>
  );
}
