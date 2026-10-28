# MasterEnglish UI Prototype Implementation Plan

> **For agentic workers:** The user explicitly requested: "tạo ra 1 thư mục demo riêng không cần commit đâu" (Create in a dedicated `demo/` folder, no git commit). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone, high-fidelity, interactive HTML prototype containing all 4 MasterEnglish screens (Landing Page, Learning Dashboard, Auth Sign In/Sign Up, and User Profile) in a dedicated `demo/` directory with an interactive screen switcher and micro-interactions.

**Architecture:** Create self-contained files under `demo/`:
- `demo/index.html`: The main preview entry point with modern structure, semantic sections for all 4 screens, embedded SVG icons, interactive tab switchers, and a persistent floating demo controller.
- `demo/styles.css`: Complete modern styling with CSS variables (Emerald Green, Electric Indigo, Amber Flame, Slate 50-900), card elevation, glassmorphism, responsive grid/flexbox, and fluid animations.
- `demo/app.js`: Lightweight Vanilla JS handling screen switching, auth tab switching (Login vs Register), password show/hide, password strength calculation, profile tabs, interactive toasts, and demo state.

**Tech Stack:** HTML5, CSS3 (CSS Variables, Flexbox, Grid, Animations), Vanilla JavaScript (ES6+), Embedded SVG Vector Icons.

**Spec:** `docs/superpowers/specs/2026-10-27-masterenglish-ui-prototype-design.md`

## Global Constraints
- Target directory: `demo/` (dedicated separate folder as requested).
- No Git commit needed as explicitly instructed by the user.
- Color palette: Emerald (`#10B981`), Electric Indigo (`#6366F1`), Amber (`#F59E0B`), Slate (`#F8FAFC`, `#0F172A`).
- Zero external build tooling required: the prototype can be double-clicked in Windows Explorer or served via static server.
- High visual polish: distinct, non-templated typography, micro-interactions, responsive behavior.

## Review Focus
1. Screen Switcher: Switching between Landing Page, Dashboard, Auth, and Profile must smoothly fade/transition without broken scroll positions.
2. Auth Form Toggle: Switching between "Đăng nhập" and "Đăng ký" must smoothly toggle name input and update button CTA text with active tab indicator animation.
3. Password Strength Indicator: Typing into the password field dynamically updates the strength bar (Weak / Medium / Strong) with color feedback.
4. Profile Tabs: Switching between "Kỹ năng & Tiến độ", "Huy hiệu & Thành tích", "Lộ trình & Khóa học", and "Cài đặt" updates the active panel smoothly.
5. Interactive Action Feedback: Clicking buttons like "Tiếp tục học", "Bắt đầu học thử", "Lưu hồ sơ", "Đăng nhập" triggers a floating Toast notification so user feels the responsiveness.

---

### Task 1: Setup Demo Folder and Core CSS Design System

**Files:**
- Create: `demo/styles.css`

**Interfaces:**
- Produces: Complete CSS variable theme, typography styles, utility classes, card elevation shadows, keyframe animations (pulse, wave, fade-in, toast slide), and layout wrappers for all screens.

- [ ] **Step 1: Write `demo/styles.css` with Design System Tokens**
  - Define `:root` variables: colors (`--primary-500`, `--primary-600`, `--accent-500`, `--warning-500`, `--bg-main`, `--surface`, `--text-main`, `--text-muted`, `--border`).
  - Define reset, base typography (`font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`), container rules.
  - Implement reusable UI components: `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.card`, `.badge`, `.input-group`, `.nav-link`, `.pill-tab`.
  - Add micro-interaction keyframes (`@keyframes pulseFlame`, `@keyframes waveBar`, `@keyframes slideInRight`, `@keyframes floatOrbs`).
  - Add responsive styles for mobile, tablet, and desktop (max-width 1280px).

- [ ] **Step 2: Verify CSS structure and validity**
  - Ensure all classes needed for Landing, Dashboard, Auth, and Profile are provided with proper hover and active states.

---

### Task 2: Implement Interactive Logic & State Controller

**Files:**
- Create: `demo/app.js`

**Interfaces:**
- Consumes: DOM elements defined in Task 3.
- Produces: `switchScreen(screenId)`, `switchAuthTab(tab)`, `switchProfileTab(tabId)`, `showToast(title, message, type)`, `togglePasswordVisibility()`, and dynamic password strength calculator.

- [ ] **Step 1: Write `demo/app.js`**
  - Implement screen switcher listener attached to floating control buttons (`data-target-screen`).
  - Implement Auth switcher (Sign In vs Sign Up) toggling form state, field visibility, and heading text.
  - Implement password visibility toggler (Eye open/close SVG icon swap).
  - Implement dynamic password strength listener checking length, uppercase, numbers, and symbols.
  - Implement Profile tab switching between "overview", "badges", "courses", and "settings".
  - Implement floating Toast notification engine with automatic timeout removal (3.5 seconds).
  - Add interactive handlers for CTAs (simulating lesson launch, speech AI recording preview with soundwave animation, mock sign-in, settings save).

- [ ] **Step 2: Verify JS event listeners and error resilience**
  - Ensure DOMContentLoaded safely attaches listeners even if elements load asynchronously.

---

### Task 3: Build Complete HTML Prototype (`demo/index.html`)

**Files:**
- Create: `demo/index.html`

**Interfaces:**
- Consumes: `demo/styles.css`, `demo/app.js`.
- Produces: Full interactive experience with 4 complete screens and persistent bottom floating switcher bar.

- [ ] **Step 1: Structure HTML and Global Navigation**
  - Setup HTML5 doctype, UTF-8, responsive viewport, Google Fonts preload (`Plus Jakarta Sans`), link to `styles.css`.
  - Include embedded SVG icon sprites for crisp retina rendering (Fire streak, Star XP, Microphone, Sparkles, Trophy, Book, Check, Eye, Google, Apple, etc.).

- [ ] **Step 2: Build Screen 1: Landing Page Mode (`#screen-landing`)**
  - Header: Logo with AI soundwave icon, nav items, Sign In outline button, Start Free primary button.
  - Hero Section: Headline, value prop, CTA group, and interactive AI Speaking preview card (soundwave, 98% native match indicator, phonetic breakdown).
  - Metrics social proof strip (150,000+ learners, 95% fluency, 4.9/5 stars).
  - 3 Core feature cards (AI Speaking Coach, Adaptive SRS Spaced Repetition, Gamified Leaderboard).

- [ ] **Step 3: Build Screen 2: Learning Dashboard Mode (`#screen-dashboard`)**
  - Top greeting header: personalized greeting for Huy, level tag (B2).
  - Daily status bar: 🔥 14-day streak, ⭐ 1,850 XP, circular progress goal ring (15/20 mins - 75%).
  - Hero action card: "Unit 4: Airport Navigation & Customs Communication", "Tiếp tục học ngay" button.
  - 4 Skill training cards: 🎙️ Luyện nói AI, ⚡ Từ vựng Siêu tốc, 🎧 Luyện nghe Phản xạ, 🏆 Đấu trường Từ vựng.
  - Recent vocabulary activity feed & Daily leaderboard preview.

- [ ] **Step 4: Build Screen 3: Auth Screen (`#screen-auth`)**
  - Split-screen layout (50:50).
  * Left Brand Showcase: Gradient mesh background with ambient glowing particles, motivational quotes, student testimonial card with IELTS 7.5 achievement.
  * Right Interactive Auth Box:
    - Tab toggle (Đăng nhập / Đăng ký) with sliding pill effect.
    - Social login buttons (Google & Apple).
    - Email & dynamic password field with show/hide toggle and live strength meter.
    - Name field (revealed in Sign Up mode).
    - Remember me & Forgot password triggers.
    - Primary CTA button with interactive state.

- [ ] **Step 5: Build Screen 4: User Profile Screen (`#screen-profile`)**
  * Profile Hero Banner: Avatar with online badge and photo upload icon, full name (Trịnh Đăng Huy), handle (`@danghuy.master`), CEFR Level B2 tag, custom goal ("Target: IELTS 7.0").
  * 4 Key Stats KPI cards: 14 Days Streak, 48 Hours, 1,250 Words, Top 3 Diamond League.
  * 4 Interactive Tabs:
    1. Kỹ năng & Tiến độ: 4 skill bars (Speaking 82%, Listening 78%, Reading 88%, Writing 70%), GitHub-style Streak Heatmap calendar.
    2. Huy hiệu & Thành tích: 6 badges (Thợ săn từ vựng, Kẻ hủy diệt ngữ pháp, Ngọn lửa 14 ngày, Phản xạ siêu tốc, Cú đêm chăm chỉ, Nhà vô địch tuần).
    3. Lộ trình & Khóa học: 3 courses with progress bars.
    4. Cài đặt tài khoản: Personal info form, notifications toggle, daily learning goal selector.

- [ ] **Step 6: Build Persistent Floating Demo Control Bar (`#demo-switcher`)**
  - Floating pill fixed at bottom center with blur backdrop.
  - Buttons for all 4 screens with active highlight indicator.
  - Action trigger to show demo notifications.

---

### Task 4: Verification and Quality Polish

**Files:**
- Inspect & Test: `demo/index.html`, `demo/styles.css`, `demo/app.js`

- [ ] **Step 1: Check in browser & verify interactions**
  - Verify switching between all 4 screens works cleanly with zero flicker.
  - Verify Auth tab toggle switches between Sign In and Sign Up.
  - Verify password eye toggle and strength bar.
  - Verify profile tab navigation.
  - Verify Toast notification triggers.
  - Verify responsive mobile layout behaves cleanly.
