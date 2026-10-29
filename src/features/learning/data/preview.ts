import type { Flashcard } from "../types/flashcard";
import type { LearningPlaceholder } from "../types/learning";
import type { ToeicOption, ToeicOptionKey } from "../types/toeic";

export const flashcards = [
  { word: "approach", type: "noun", ipa: "/əˈprəʊtʃ/", meaning: "cách tiếp cận", example: "We need a new approach to this problem.", translation: "Chúng ta cần một cách tiếp cận mới cho vấn đề này." },
  { word: "schedule", type: "noun", ipa: "/ˈʃedjuːl/", meaning: "lịch trình", example: "The meeting is on our schedule for Friday.", translation: "Cuộc họp nằm trong lịch trình của chúng ta vào thứ Sáu." },
  { word: "confirm", type: "verb", ipa: "/kənˈfɜːm/", meaning: "xác nhận", example: "Please confirm your appointment by email.", translation: "Vui lòng xác nhận lịch hẹn qua email." },
] as const satisfies readonly Flashcard[];

export const toeicOptions = [
  { key: "A", text: "complete" },
  { key: "B", text: "completed" },
  { key: "C", text: "completing" },
  { key: "D", text: "completion" },
] as const satisfies readonly ToeicOption[];

export const toeicAnswer: ToeicOptionKey = "B";

export const placeholderSections: Record<string, LearningPlaceholder> = {
  "review": { kicker: "ÔN TẬP / TRỞ LẠI ĐÚNG LÚC", title: "Nhớ lâu hơn,", emphasis: "không cần vội.", description: "Những từ đến hạn ôn sẽ xuất hiện tại đây theo tiến độ thực tế của bạn.", empty: "Chưa có thẻ cần ôn trong bản xem trước.", next: "Khám phá từ vựng", href: "/learn/vocabulary" },
  "results": { kicker: "KẾT QUẢ / NHÌN LẠI ĐỂ ĐI TIẾP", title: "Mỗi lần luyện,", emphasis: "một điều hiểu thêm.", description: "Kết quả bài làm, câu cần xem lại và tiến bộ theo thời gian sẽ nằm tại đây.", empty: "Chưa có kết quả học tập để hiển thị.", next: "Xem bài TOEIC mẫu", href: "/learn/toeic" },
  "ai-tutor": { kicker: "AI TUTOR / HIỂU SÂU CÂU ĐÃ LÀM", title: "Còn thắc mắc?", emphasis: "Cùng tìm lời giải.", description: "Sau khi hoàn thành bài luyện, bạn có thể hỏi thêm về một câu đã nộp và đọc lời giải chuẩn ngay tại đó.", empty: "Chưa có câu đã nộp để hỏi AI Tutor.", next: "Xem bài TOEIC mẫu", href: "/learn/toeic" },
};
