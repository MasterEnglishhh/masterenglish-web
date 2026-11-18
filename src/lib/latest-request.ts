/**
 * Chỉ cho phép kết quả của yêu cầu MỚI NHẤT được áp dụng vào state.
 *
 * Khi người dùng đổi bộ lọc liên tục, phản hồi của yêu cầu cũ có thể về sau
 * phản hồi của yêu cầu mới và ghi đè dữ liệu đang hiển thị. Gọi `begin()` trước
 * mỗi yêu cầu, rồi chỉ cập nhật state khi `isCurrent(ticket)` còn đúng.
 */
export function createLatestRequestTracker() {
  let latest = 0;
  return {
    begin(): number {
      latest += 1;
      return latest;
    },
    isCurrent(ticket: number): boolean {
      return ticket === latest;
    },
    /** Vô hiệu mọi yêu cầu đang bay (dùng khi component bị huỷ). */
    invalidate(): void {
      latest += 1;
    },
  };
}
