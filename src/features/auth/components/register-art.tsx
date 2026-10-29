import {
  ArrowUpRight,
  BookOpen,
  Check,
  Headphones,
  Sparkles,
} from "lucide-react";
import { Brand } from "@/components/brand";

export function RegisterArt() {
  return (
    <aside className="auth-art register-art" aria-hidden="true">
      <div className="auth-art-top">
        <Brand />
        <span>A LITTLE EVERY DAY ↗</span>
      </div>
      <div className="register-art-orbit" />
      <div className="register-art-scene">
        <span className="register-art-caption">YOUR NEXT CHAPTER</span>
        <div className="register-paper-back" />
        <div className="register-learning-card">
          <div className="register-card-top">
            <span>MY LEARNING SPACE</span>
            <ArrowUpRight size={17} />
          </div>
          <div className="register-card-hello">
            hello<span>.</span>
            <Sparkles size={30} />
          </div>
          <p>
            Một chút mỗi ngày.
            <br />
            Một phiên bản mới của bạn.
          </p>
          <div className="register-card-divider" />
          <div className="register-card-topic">
            <span>
              <BookOpen size={17} />
            </span>
            <div>
              <strong>Xây nền từ vựng</strong>
              <small>Bắt đầu từ những điều gần gũi</small>
            </div>
            <Check size={15} />
          </div>
          <div className="register-card-topic">
            <span>
              <Headphones size={17} />
            </span>
            <div>
              <strong>Tự tin cùng TOEIC</strong>
              <small>Từng kỹ năng, từng bước nhỏ</small>
            </div>
            <ArrowUpRight size={15} />
          </div>
          <div className="register-card-bottom">
            <span>THIS IS YOUR BEGINNING</span>
            <span>01 / ∞</span>
          </div>
        </div>
        <span className="register-start-sticker">
          START
          <br />
          SOMETHING
          <br />
          <strong>good ↗</strong>
        </span>
        <span className="register-art-spark">✳</span>
      </div>
      <div className="auth-art-bottom register-art-bottom">
        <span>MỘT KHỞI ĐẦU NHỎ. MỘT HÀNH TRÌNH RIÊNG.</span>
        <h2>
          Không cần giỏi
          <br />
          <em>mới bắt đầu.</em>
        </h2>
        <p>
          Chỉ cần một chút tò mò, một mục tiêu của riêng bạn và một nơi để quay
          lại mỗi ngày.
        </p>
      </div>
    </aside>
  );
}
