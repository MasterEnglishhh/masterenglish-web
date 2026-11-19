// Toàn bộ chữ trên landing nằm ở đây. Quy tắc trung thực: không số liệu người dùng,
// không đánh giá/lời chứng thực/logo đối tác; mọi giao diện mô phỏng gắn "Ví dụ minh họa".

import type { Status } from "@/components/status-badge";

export const CTA_NOTE = "Miễn phí hoàn toàn · Đăng ký bằng email";

export const NAV_LINKS = [
  { href: "#cach-hoc", label: "Cách học" },
  { href: "#danh-cho-ai", label: "Dành cho ai" },
  { href: "#hoi-dap", label: "Hỏi đáp" },
];

export const HERO = {
  lead: "Miễn phí hoàn toàn. Luyện từ vựng nhớ đúng lúc và chuẩn bị cho hai kỹ năng Nghe – Đọc TOEIC, dành cho người ôn thi lẫn người học tiếng Anh mỗi ngày.",
  secondary: "Xem cách học",
};

export const WHY = {
  kicker: "01 / GIỚI THIỆU",
  body: "Bài thi đánh giá khả năng nghe và đọc hiểu tiếng Anh.",
  marquee: ["NGHE", "ĐỌC", "NHỚ"],
  pillars: [
    { name: "Nghe", note: "Luyện nghe Part 1–4.", status: "soon" as Status },
    { name: "Đọc", note: "Part 5 đã có câu mẫu, các Part còn lại đang mở dần.", status: "rolling" as Status },
    { name: "Nhớ", note: "Từ vựng và ôn tập ngắt quãng.", status: "available" as Status },
  ],
};

export const AUDIENCE = {
  kicker: "02 / DÀNH CHO AI",
  cards: [
    {
      tag: "Người ôn thi TOEIC",
      title: "Có mục tiêu điểm số",
      points: [
        "Đặt điểm TOEIC mong muốn và ngày thi dự kiến.",
        "Chia lượng học theo số phút mỗi ngày, từ nay đến ngày thi.",
        "Tập trung từ vựng sát đề, rồi tới các Part Nghe – Đọc khi được mở.",
      ],
    },
    {
      tag: "Người học mỗi ngày",
      title: "Học ngắn, đều, không áp lực",
      points: [
        "Giữ nhịp học vài phút mỗi ngày.",
        "Lưu từ mới vào sổ tay ngay khi gặp.",
        "Ôn lại đúng lúc sắp quên thay vì học lại từ đầu.",
      ],
    },
  ],
};

export const HOW = {
  kicker: "03 / CÁCH HỌC",
  steps: [
    { n: "01", title: "Chọn điều muốn học", body: "Một bộ từ, hoặc những từ bạn đã lưu trong sổ tay." },
    { n: "02", title: "Luyện trong ngữ cảnh", body: "Xem từ cùng ví dụ, nghe phát âm mẫu của từ." },
    { n: "03", title: "Ôn lại đúng lúc sắp quên", body: "Bạn tự chấm Quên, Khó hoặc Đã nhớ; hệ thống xếp lịch ôn kế tiếp." },
  ],
  demoHint: "Bấm vào thẻ để lật, rồi tự chấm.",
};

export interface SampleWord {
  lemma: string;
  ipa: string;
  pos: string;
  cefr: string;
  meaning: string;
  example: string;
}
export const SAMPLE_WORDS: SampleWord[] = [
  { lemma: "negotiate", ipa: "/nɪˈɡoʊʃieɪt/", pos: "v.", cefr: "B2", meaning: "đàm phán, thương lượng", example: "We need to negotiate the contract terms." },
  { lemma: "deadline", ipa: "/ˈdedlaɪn/", pos: "n.", cefr: "B1", meaning: "hạn chót", example: "The deadline for the report is Friday." },
  { lemma: "invoice", ipa: "/ˈɪnvɔɪs/", pos: "n.", cefr: "B2", meaning: "hóa đơn", example: "Please send the invoice by email." },
  { lemma: "reliable", ipa: "/rɪˈlaɪəbəl/", pos: "adj.", cefr: "B1", meaning: "đáng tin cậy", example: "She is a reliable colleague." },
];

export const RATINGS = [
  { key: "1", label: "Quên" },
  { key: "2", label: "Khó" },
  { key: "3", label: "Đã nhớ" },
];

export const FEATURES = {
  kicker: "04 / TRONG SẢN PHẨM",
  lead: "Dưới đây là bản dựng lại giao diện thật bằng dữ liệu giả. Bạn có thể bấm thử.",
  frames: [
    { id: "review", name: "Ôn tập ngắt quãng" },
    { id: "notebook", name: "Sổ tay từ vựng" },
    { id: "goal", name: "Mục tiêu cá nhân" },
    { id: "progress", name: "Tiến độ học tập" },
  ],
  progressStats: [
    ["Nghĩa đã học", 42],
    ["Đã thuộc (≥ 21 ngày)", 9],
    ["Đến hạn ôn", 6],
    ["Đã lưu", 18],
    ["Lượt ôn 7 ngày qua", 31],
    ["Tổng lượt ôn", 120],
  ] as [string, number][],
};

export const GOAL_LIMITS = {
  minScore: 10,
  maxScore: 990,
  stepScore: 5,
  minMinutes: 5,
  maxMinutes: 240,
};

export const ROADMAP = {
  kicker: "05 / ĐANG XÂY DỰNG",
  body: "Những phần sau đây chưa sẵn sàng. Chúng tôi ghi rõ để bạn biết hôm nay mình dùng được gì.",
  items: [
    { name: "Luyện nghe Part 1–4", note: "Chưa có. Hiện mới có phát âm mẫu từng từ.", status: "soon" as Status },
    { name: "Luyện đọc Part 5–7", note: "Mới có một câu Part 5 mẫu. Bộ đề đầy đủ sẽ mở dần.", status: "rolling" as Status },
    { name: "Ngữ pháp hệ thống", note: "Đang chuẩn bị.", status: "soon" as Status },
    { name: "AI Tutor", note: "Đang chuẩn bị.", status: "soon" as Status },
  ],
};

export const FAQ = {
  kicker: "06 / HỎI ĐÁP",
  items: [
    { q: "MasterEnglish miễn phí hoàn toàn không?", a: "Có. Bạn không phải trả phí để dùng những gì MasterEnglish đang có." },
    { q: "Có luyện phát âm hay luyện nói không?", a: "Chưa. MasterEnglish tập trung vào Nghe và Đọc. Hiện chỉ có phát âm mẫu của từng từ vựng để bạn nghe cách đọc; chưa có chấm điểm phát âm hay luyện nói." },
    { q: "Dùng được trên điện thoại không?", a: "Được. Trang chạy trên trình duyệt của điện thoại, máy tính bảng và máy tính, không cần cài ứng dụng." },
    { q: "Nội dung TOEIC đã đủ chưa?", a: "Chưa đủ. Hiện có từ vựng, ôn tập ngắt quãng và một câu Part 5 mẫu. Luyện nghe Part 1–4 và luyện đọc Part 5–7 đầy đủ sẽ được mở dần." },
  ],
};

export const FINAL = {
  body: "Vài phút mỗi ngày, đúng thứ cần ôn. Tạo tài khoản bằng email là học được ngay.",
};

export const FOOTER_LINKS = {
  explore: NAV_LINKS,
  account: [
    { href: "/login", label: "Đăng nhập" },
    { href: "/register", label: "Đăng ký" },
  ],
};
