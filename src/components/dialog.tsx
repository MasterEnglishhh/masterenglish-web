"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

interface DialogProps {
  title: ReactNode;
  /** Dòng nhãn nhỏ phía trên tiêu đề. */
  kicker?: string;
  /** Đặt cạnh nhãn (vd. huy hiệu trạng thái). */
  kickerAside?: ReactNode;
  description?: ReactNode;
  /** Đang gửi: Esc và nhấp nền không đóng được, để không mất kết quả. */
  busy?: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Hộp thoại modal dựng trên `<dialog>` gốc: trình duyệt lo Esc, giữ focus trong hộp thoại
 * và khoá trang phía sau. Mount là mở, unmount là đóng, nên nơi dùng chỉ cần render có điều kiện.
 */
export function Dialog({
  title,
  kicker,
  kickerAside,
  description,
  busy = false,
  onClose,
  children,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const pressedOnBackdrop = useRef(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const opener = document.activeElement as HTMLElement | null;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
      opener?.focus?.(); // unmount không tự trả focus về nút đã mở hộp thoại
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Luôn chặn đóng mặc định: React unmount khi `onClose` đổi state.
        event.preventDefault();
        if (!busy) onClose();
      }}
      // Nhấp nền (::backdrop) trả về chính thẻ dialog. Phải bấm VÀ nhả trên nền, để việc
      // bôi đen chữ trong ô nhập rồi nhả chuột ra ngoài không đóng nhầm hộp thoại.
      onPointerDown={(event) => {
        pressedOnBackdrop.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (
          pressedOnBackdrop.current &&
          event.target === event.currentTarget &&
          !busy
        )
          onClose();
      }}
    >
      <div className="dialog-card">
        <div>
          {kicker &&
            (kickerAside ? (
              <div className="dialog-kicker-row">
                <span className="dialog-kicker">{kicker}</span>
                {kickerAside}
              </div>
            ) : (
              <span className="dialog-kicker">{kicker}</span>
            ))}
          <h2 id={titleId} className="dialog-title">
            {title}
          </h2>
          {description}
        </div>
        {children}
      </div>
    </dialog>
  );
}
