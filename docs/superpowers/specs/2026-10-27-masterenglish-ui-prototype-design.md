# MasterEnglish Web UI Prototype Design Specification

- **Date:** 2026-10-27
- **Project:** MasterEnglish Web Platform (`masterenglish-web`)
- **Status:** Approved
- **Design Theme:** Vibrant Modern EdTech (Inspired by Duolingo, Speak, and Linear)

---

## 1. Executive Summary & Objective

This specification defines the high-fidelity interactive HTML/CSS prototype for **MasterEnglish**, an AI-powered English language learning web platform. 

The primary deliverable is an interactive, standalone HTML prototype enabling stakeholders to inspect, test, and approve all core screens, micro-interactions, responsive layouts, and visual design tokens before full React/Next.js component implementation.

---

## 2. Design System & Visual Foundations

### 2.1 Color Palette
* **Primary Brand (Emerald & Mint):**
  * `Primary 500`: `#10B981` (Vibrant emerald representing progress, success, and vitality)
  * `Primary 600`: `#059669` (Hover and active states)
  * `Primary 50`: `#ECFDF5` (Subtle tint for badges, active navigation items)
* **Accent Tech (Electric Indigo & Violet):**
  * `Accent 500`: `#6366F1` (AI features, speech recognition, smart diagnostics)
  * `Accent 600`: `#4F46E5` (Hover states)
  * `Accent 50`: `#EEF2FF` (Glows and soft backdrops)
* **Gamification & Emotion (Amber & Orange):**
  * `Warning / Streak`: `#F59E0B` (Daily streak flame, XP points, gold badges)
* **Neutral Backgrounds & Surfaces:**
  * `Background`: `#F8FAFC` (Clean, warm slate canvas reducing eye strain)
  * `Surface`: `#FFFFFF` (Crisp white elevated cards)
  * `Border`: `#E2E8F0` (Subtle 1px refined dividing lines)
  * `Text Primary`: `#0F172A` (Slate 900, optimal legibility)
  * `Text Muted`: `#64748B` (Slate 500, secondary labels)

### 2.2 Typography & Shadows
* **Font Family:** Modern system geometric sans-serif stack (`Inter`, `Plus Jakarta Sans`, system-ui).
* **Elevation / Shadows:**
  * `Soft Card`: `0 10px 25px -5px rgba(16, 185, 129, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)`
  * `Card Hover`: `0 20px 30px -10px rgba(99, 102, 241, 0.12), 0 10px 12px -5px rgba(0, 0, 0, 0.04)`
  * `Pill Glow`: `0 0 15px rgba(16, 185, 129, 0.35)`

### 2.3 Motion & Micro-interactions
* **Hover Lift:** `transform: translateY(-3px)` with smooth cubic-bezier easing (`0.2, 0.8, 0.2, 1`).
* **Active Press:** `transform: scale(0.98)` for tactile button responses.
* **Transitions:** Standard 200ms–300ms transitions on color, transform, and box-shadow.
* **Toast System:** Top-right floating feedback toast for interactive actions (e.g., "Logged in successfully", "Profile updated").

---

## 3. Screen Specifications

### 3.1 Screen A: Main Screen — Landing Page Mode
* **Header / Navigation:**
  * Brand logo: Modern typographic logo with an AI soundwave emblem.
  * Nav links: Learning Roadmap, AI Speaking Lab, Features, Pricing.
  * Actions: "Sign In" button (outline) + "Start Free Trial" button (primary emerald with soft glow).
* **Hero Section:**
  * Headline: *"Làm chủ tiếng Anh phản xạ tự nhiên cùng Trợ lý AI thế hệ mới"*.
  * Subtitle: Concise value proposition highlighting 15-minute daily practice, SRS vocabulary, and real-time IPA speech analysis.
  * CTA Group: Primary button with instant preview modal trigger + secondary "Watch 1-min Demo" button.
  * Interactive Preview Card (Right): Live audio waveform animation, pronunciation score breakdown (*98% Native Match*), IPA phoneme color codes.
* **Social Proof Strip:** Key metrics counters (150K+ learners, 95% fluency improvement, 4.9/5 rating).
* **Feature Grid:**
  * AI Speaking Coach with simulated feedback dialog.
  * Adaptive SRS Spaced Repetition vocabulary engine.
  * Gamified Leaderboards & Badge tournaments.

### 3.2 Screen B: Main Screen — Learning Dashboard Mode
* **Student Welcome Header:** Personalized greeting, current level tag (*B2 Upper-Intermediate*), and continuous motivation message.
* **Daily Stats Strip:**
  * Streak Counter: 🔥 **14 Days Streak** with animated flame pulse.
  * Experience Points: ⭐ **1,850 XP**.
  * Daily Goal Ring: Circular SVG progress ring showing 15/20 mins (75%).
* **Hero Next Lesson Card:**
  * Banner highlight: *"Unit 4: Airport Navigation & Customs Communication"*.
  * Progress indicator, estimated duration (10 mins), and prominent "Continue Learning" button.
* **Core Skill Training Grid (4 Interactive Cards):**
  1. 🎙️ **Luyện nói AI (Speaking Coach):** Real-time conversational AI session.
  2. ⚡ **Từ vựng Siêu tốc (Smart Flashcards):** SRS algorithm-driven memory cards.
  3. 🎧 **Luyện nghe Phản xạ (Listening Lab):** Real-world podcasts and dictation exercises.
  4. 🏆 **Đấu trường Từ vựng (Vocabulary Arena):** 60-second multiplayer live challenge.

### 3.3 Screen C: Authentication Screen (Sign In & Sign Up)
* **Layout:** Split-screen 50:50 presentation.
* **Left Panel (Brand Showcase):**
  * Soft gradient mesh backdrop (Emerald into Indigo) with ambient floating orbs.
  * Inspiring quote on language fluency and international career growth.
  * Student testimonial card with real avatar and IELTS score achievement.
* **Right Panel (Interactive Auth Box):**
  * Sliding pill tab switcher between **"Đăng nhập" (Sign In)** and **"Đăng ký" (Sign Up)**.
  * One-tap social authentication buttons: Google and Apple.
  * Subtle divider: *"Hoặc tiếp tục với email"*.
  * Form inputs with floating labels, input focus glow rings, and dynamic validation:
    * Full name input (revealed conditionally in Sign Up tab).
    * Email field with instant format validation check icon.
    * Password field with toggle visibility eye icon and multi-step password strength meter (Weak / Medium / Strong).
  * Checkbox for "Remember me" and "Forgot password?" modal trigger.
  * Primary submit button with responsive loading and success state simulation.

### 3.4 Screen D: User Profile Screen
* **Profile Header:**
  * High-res avatar with online status badge and camera overlay icon for photo update.
  * User identity: Full name (*Trịnh Đăng Huy*), username (`@danghuy.master`), and academic badge (*CEFR Level B2*).
  * Custom target goal: *"Target: IELTS 7.0 in Q3 2026"*.
* **Key Academic KPI Cards:**
  1. 🔥 14 Days Active Streak.
  2. ⏱️ 48 Total Learning Hours.
  3. 📚 1,250 Mastered Words.
  4. 🎖️ Top 3 Diamond League Standing.
* **Tabbed Content Sections:**
  * **Tab 1: Kỹ năng & Tiến độ (Skills & Progress):**
    * Proficiency progress bars for Speaking (82%), Listening (78%), Reading (88%), and Writing (70%).
    * Monthly Streak Activity Heatmap (GitHub/Duolingo style commit calendar).
  * **Tab 2: Huy hiệu & Thành tích (Badges & Achievements):**
    * Grid of collectible achievement badges (Unlocked in vibrant gold/emerald, locked in frosted monochrome).
  * **Tab 3: Lộ trình & Khóa học (Enrolled Courses):**
    * Enrolled courses with completion percentage and certificate preview links.
  * **Tab 4: Cài đặt (Account Settings):**
    * Profile info edit form, daily reminder toggle, and notification settings.

### 3.5 Global Interactive Prototype Switcher
* Fixed floating control bar positioned at the bottom-center of the viewport.
* Quick-switch buttons:
  * `[Landing Page]`
  * `[Learning Dashboard]`
  * `[Đăng nhập / Đăng ký]`
  * `[Hồ sơ cá nhân]`
* Visual badge indicator showing the active screen.
* Toast notification dispatch mechanism showing real-time interactive feedback on user actions.

---

## 4. Technical Architecture of Deliverable

* **File Location:** Standalone HTML file at `public/prototype.html` and root preview `prototype.html` for instant accessibility.
* **Dependencies:** Zero external heavy framework runtime dependencies; fully self-contained using:
  * Modern CSS3 (CSS Variables, Flexbox, CSS Grid, keyframes).
  * Embedded vector SVGs for crisp iconography.
  * Lightweight Vanilla JavaScript (DOM event listeners, class toggle, tab transitions).
* **Browser Compatibility:** Works across modern Evergreen desktop and mobile browsers (Chrome, Edge, Safari, Firefox).

---

## 5. Verification & Acceptance Criteria

1. **Completeness:** All 4 screens (Landing, Dashboard, Auth, Profile) are fully styled and navigable.
2. **Visual Fidelity:** Colors match Vibrant Modern Edtech specs; typography and spacing feel polished and consistent.
3. **Micro-interactions:** Interactive elements (buttons, inputs, tabs, modal toggles, password eye toggle, notifications) respond fluidly without lag.
4. **Standalone Portability:** The HTML file can be opened directly via file double-click or served via any static web server / Next.js dev server.
