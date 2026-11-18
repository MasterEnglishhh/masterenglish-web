"use client";

import { useEffect, useRef } from "react";

/**
 * Trả focus về nút đã mở hộp thoại, kể cả khi hộp thoại đóng sau khi lưu thành công.
 * Nếu nút đã mở không còn trong trang thì dùng nút dự phòng (`fallbackRef`).
 * Gọi `remember()` ngay trước khi mở hộp thoại.
 */
export function useFocusReturn(isOpen: boolean) {
  const opener = useRef<HTMLElement | null>(null);
  const fallbackRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (wasOpen.current && !isOpen) {
      const target = opener.current?.isConnected ? opener.current : fallbackRef.current;
      target?.focus();
    }
    wasOpen.current = isOpen;
  }, [isOpen]);

  const remember = () => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  };

  return { fallbackRef, remember };
}
