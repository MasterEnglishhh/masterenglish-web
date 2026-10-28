/**
 * MasterEnglish TOEIC - Interactive UI Prototype Logic
 * Handles screen switching, TOEIC interactive question & AI diagnostic explainer, auth tabs, and toast alerts.
 */

document.addEventListener('DOMContentLoaded', () => {
  initScreenSwitcher();
  initToeicQuestionDemo();
  initAuthForm();
  initProfileTabs();
  initInteractiveTriggers();
});

/* =================================================== */
/* 1. SCREEN SWITCHER                                  */
/* =================================================== */
function initScreenSwitcher() {
  const switcherBtns = document.querySelectorAll('.demo-screen-btn');

  switcherBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetScreenId = btn.getAttribute('data-target-screen');
      switchScreen(targetScreenId);
    });
  });

  // Global links with data-navigate
  document.addEventListener('click', (e) => {
    const navTrigger = e.target.closest('[data-navigate]');
    if (navTrigger) {
      e.preventDefault();
      const targetScreen = navTrigger.getAttribute('data-navigate');
      switchScreen(targetScreen);
    }
  });
}

function switchScreen(screenId) {
  const screens = document.querySelectorAll('.screen-wrapper');
  const switcherBtns = document.querySelectorAll('.demo-screen-btn');

  screens.forEach((screen) => {
    screen.classList.remove('active');
  });

  const targetScreen = document.getElementById(screenId);
  if (targetScreen) {
    targetScreen.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  switcherBtns.forEach((btn) => {
    if (btn.getAttribute('data-target-screen') === screenId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const screenNames = {
    'screen-landing': 'Màn chính (Landing Page TOEIC)',
    'screen-dashboard': 'Màn chính (Dashboard Luyện TOEIC)',
    'screen-auth': 'Màn Đăng nhập & Đăng ký',
    'screen-profile': 'Màn Hồ sơ người dùng & Điểm TOEIC',
  };
  showToast('Chuyển màn hình', `Đang xem: ${screenNames[screenId] || screenId}`, 'primary');
}

/* =================================================== */
/* 2. TOEIC INTERACTIVE QUESTION & AI EXPLAINER        */
/* =================================================== */
function initToeicQuestionDemo() {
  const optionBtns = document.querySelectorAll('.option-btn');
  const explainerDrawer = document.getElementById('ai-explainer-drawer');
  const questionBlank = document.getElementById('question-blank-target');

  if (!optionBtns.length || !explainerDrawer) return;

  optionBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      // Clear previous states
      optionBtns.forEach((b) => {
        b.classList.remove('selected-correct', 'selected-wrong');
      });

      const isCorrect = btn.getAttribute('data-correct') === 'true';
      const chosenWord = btn.querySelector('.option-text').textContent.trim();

      if (isCorrect) {
        btn.classList.add('selected-correct');
        if (questionBlank) questionBlank.textContent = chosenWord;
        showToast('Chính xác! 🎯', 'AI đã mở phân tích ngữ pháp & bẫy đề TOEIC chi tiết bên dưới.', 'primary');
      } else {
        btn.classList.add('selected-wrong');
        // Highlight correct option too
        const correctBtn = document.querySelector('.option-btn[data-correct="true"]');
        if (correctBtn) correctBtn.classList.add('selected-correct');
        if (questionBlank) questionBlank.textContent = 'recently (B)';
        showToast('Chưa chính xác! 💡', 'Xem ngay AI phân tích lý do câu này là bẫy ngữ pháp.', 'accent');
      }

      // Smoothly reveal AI Diagnostic
      explainerDrawer.style.display = 'flex';
    });
  });
}

/* =================================================== */
/* 3. AUTH FORM INTERACTIONS                          */
/* =================================================== */
function initAuthForm() {
  const tabLogin = document.getElementById('auth-tab-login');
  const tabRegister = document.getElementById('auth-tab-register');
  const nameField = document.getElementById('auth-name-field');
  const submitBtn = document.getElementById('auth-submit-btn');
  const authTitle = document.getElementById('auth-title');
  const authSubtitle = document.getElementById('auth-subtitle');
  const rememberRow = document.getElementById('auth-remember-row');
  const passwordInput = document.getElementById('auth-password-input');
  const passwordStrengthBox = document.getElementById('password-strength-box');
  const togglePassBtn = document.getElementById('toggle-password-btn');

  if (!tabLogin || !tabRegister) return;

  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    nameField.style.display = 'none';
    rememberRow.style.display = 'flex';
    passwordStrengthBox.classList.remove('visible');
    authTitle.textContent = 'Chào mừng trở lại! 👋';
    authSubtitle.textContent = 'Đăng nhập để tiếp tục hành trình bứt phá điểm TOEIC cùng AI.';
    submitBtn.textContent = 'Đăng nhập vào tài khoản';
  });

  tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    nameField.style.display = 'flex';
    rememberRow.style.display = 'none';
    passwordStrengthBox.classList.add('visible');
    authTitle.textContent = 'Khởi đầu bứt phá TOEIC 🚀';
    authSubtitle.textContent = 'Tạo tài khoản miễn phí để nhận trọn bộ giải thích lỗi sai AI cho 10 đề ETS.';
    submitBtn.textContent = 'Tạo tài khoản luyện thi miễn phí';
  });

  // Password visibility toggle
  if (togglePassBtn && passwordInput) {
    togglePassBtn.addEventListener('click', () => {
      const currentType = passwordInput.getAttribute('type');
      if (currentType === 'password') {
        passwordInput.setAttribute('type', 'text');
        togglePassBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
            <line x1="2" y1="2" x2="22" y2="22"/>
          </svg>
        `;
      } else {
        passwordInput.setAttribute('type', 'password');
        togglePassBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        `;
      }
    });
  }

  // Live password strength calculation
  if (passwordInput && passwordStrengthBox) {
    passwordInput.addEventListener('input', () => {
      const val = passwordInput.value;
      if (val.length === 0) {
        updateStrengthMeter(0, 'Nhập mật khẩu ít nhất 8 ký tự');
        return;
      }
      let score = 0;
      if (val.length >= 6) score++;
      if (val.length >= 8 && /[A-Z]/.test(val)) score++;
      if (/[0-9]/.test(val) && /[^A-Za-z0-9]/.test(val)) score++;

      if (score === 1) {
        updateStrengthMeter(1, 'Độ mạnh: Yếu (Cần thêm chữ in hoa hoặc số)');
      } else if (score === 2) {
        updateStrengthMeter(2, 'Độ mạnh: Khá tốt (Thêm ký tự đặc biệt để an toàn nhất)');
      } else if (score >= 3) {
        updateStrengthMeter(3, 'Độ mạnh: Rất mạnh! ✨');
      }
    });
  }

  // Mock Form Submit
  const authForm = document.getElementById('auth-form-element');
  if (authForm) {
    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const isLogin = tabLogin.classList.contains('active');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Đang xử lý...';

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = isLogin ? 'Đăng nhập vào tài khoản' : 'Tạo tài khoản luyện thi miễn phí';
        showToast(
          isLogin ? 'Đăng nhập thành công' : 'Đăng ký thành công',
          'Chào mừng bạn đến với MasterEnglish TOEIC Workspace!',
          'primary'
        );
        switchScreen('screen-dashboard');
      }, 650);
    });
  }
}

function updateStrengthMeter(level, text) {
  const bar1 = document.getElementById('strength-bar-1');
  const bar2 = document.getElementById('strength-bar-2');
  const bar3 = document.getElementById('strength-bar-3');
  const label = document.getElementById('strength-label');

  [bar1, bar2, bar3].forEach((b) => {
    b.className = 'strength-meter-bar';
  });

  if (label) label.textContent = text;

  if (level === 1) {
    bar1.classList.add('active-weak');
  } else if (level === 2) {
    bar1.classList.add('active-med');
    bar2.classList.add('active-med');
  } else if (level === 3) {
    bar1.classList.add('active-strong');
    bar2.classList.add('active-strong');
    bar3.classList.add('active-strong');
  }
}

/* =================================================== */
/* 4. USER PROFILE TABS                                */
/* =================================================== */
function initProfileTabs() {
  const profileTabBtns = document.querySelectorAll('.profile-tab-item');
  const profilePanels = document.querySelectorAll('.profile-tab-panel');

  profileTabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetPanel = btn.getAttribute('data-profile-tab');

      profileTabBtns.forEach((b) => b.classList.remove('active'));
      profilePanels.forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      const panel = document.getElementById(`profile-panel-${targetPanel}`);
      if (panel) {
        panel.classList.add('active');
      }
    });
  });
}

/* =================================================== */
/* 5. INTERACTIVE TRIGGERS & TOAST NOTIFICATION       */
/* =================================================== */
function initInteractiveTriggers() {
  // Test Start
  const startTestBtns = document.querySelectorAll('.btn-start-test');
  startTestBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      showToast('Khởi động bài thi', 'Đang nạp đề ETS 2024 Test 3 (Part 5 & 6) kèm AI Trợ lý...', 'primary');
    });
  });

  // Profile save settings
  const saveSettingsBtn = document.getElementById('btn-save-settings');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
      showToast('Cập nhật hồ sơ', 'Mục tiêu điểm số TOEIC 850+ đã được lưu thành công!', 'primary');
    });
  }

  // Social login buttons
  const socialBtns = document.querySelectorAll('.social-btn');
  socialBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const provider = btn.textContent.trim();
      showToast('Xác thực liên kết', `Đang chuyển hướng kết nối tài khoản ${provider}...`, 'accent');
    });
  });
}

/**
 * Toast Notification Dispatcher
 * @param {string} title
 * @param {string} message
 * @param {'primary' | 'accent' | 'amber'} type
 */
function showToast(title, message, type = 'primary') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconSvg = '';
  if (type === 'primary') {
    iconSvg = '🎯';
  } else if (type === 'accent') {
    iconSvg = '🤖';
  } else {
    iconSvg = '🔥';
  }

  toast.innerHTML = `
    <div class="toast-icon">${iconSvg}</div>
    <div class="toast-body">
      <h5>${title}</h5>
      <p>${message}</p>
    </div>
  `;

  toastContainer.appendChild(toast);

  // Auto remove after 3.2s
  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => {
      toast.remove();
    }, 250);
  }, 3200);
}
