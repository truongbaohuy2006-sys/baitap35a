const STORAGE_KEY = "registered_users_demo_v1";

const form = document.getElementById("registerForm");
const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const agreeTermsInput = document.getElementById("agreeTerms");
const togglePasswordBtn = document.getElementById("togglePasswordBtn");
const successBox = document.getElementById("successBox");

const fieldEls = {
  fullName: {
    input: fullNameInput,
    error: document.getElementById("fullNameError")
  },
  email: {
    input: emailInput,
    error: document.getElementById("emailError")
  },
  password: {
    input: passwordInput,
    error: document.getElementById("passwordError")
  },
  terms: {
    input: agreeTermsInput,
    error: document.getElementById("termsError")
  }
};

// Regex đơn giản, không lồng lặp để tránh ReDoS
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HAS_UPPER = /[A-Z]/;
const HAS_LOWER = /[a-z]/;
const HAS_DIGIT = /\d/;

// Mã hóa nhẹ dữ liệu mô phỏng (không thay thế hash/mã hóa phía server thực tế)
function encodeMockSecret(plainText) {
  const bytes = new TextEncoder().encode(plainText);
  let binary = "";
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary);
}

function setFieldError(key, message) {
  const { input, error } = fieldEls[key];
  error.textContent = message;
  if (input.type !== "checkbox") {
    input.classList.toggle("invalid", Boolean(message));
  }
}

function validateFullName() {
  const val = fullNameInput.value.trim().replace(/\s+/g, " ");
  fullNameInput.value = val;
  if (!val) {
    setFieldError("fullName", "Vui lòng nhập họ và tên.");
    return false;
  }
  if (val.length < 2) {
    setFieldError("fullName", "Họ và tên cần có ít nhất 2 ký tự.");
    return false;
  }
  setFieldError("fullName", "");
  return true;
}

function validateEmail() {
  const val = emailInput.value.trim().toLowerCase();
  emailInput.value = val;
  if (!val) {
    setFieldError("email", "Vui lòng nhập địa chỉ email.");
    return false;
  }
  if (!EMAIL_REGEX.test(val)) {
    setFieldError("email", "Địa chỉ email không hợp lệ (ví dụ: ten@domain.com).");
    return false;
  }
  setFieldError("email", "");
  return true;
}

function validatePassword() {
  const val = passwordInput.value;
  if (!val) {
    setFieldError("password", "Vui lòng nhập mật khẩu.");
    return false;
  }
  if (val.length < 8) {
    setFieldError("password", "Mật khẩu phải có ít nhất 8 ký tự.");
    return false;
  }
  if (!HAS_UPPER.test(val) || !HAS_LOWER.test(val) || !HAS_DIGIT.test(val)) {
    setFieldError("password", "Mật khẩu cần có ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số.");
    return false;
  }
  setFieldError("password", "");
  return true;
}

function validateTerms() {
  if (!agreeTermsInput.checked) {
    setFieldError("terms", "Bạn cần đồng ý với điều khoản để đăng ký.");
    return false;
  }
  setFieldError("terms", "");
  return true;
}

function readStoredUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUserToLocalStorage(userPayload) {
  const users = readStoredUsers();
  const filtered = users.filter((u) => u.email !== userPayload.email);
  filtered.push(userPayload);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

function showSuccessMessage(name, email) {
  successBox.hidden = false;
  successBox.replaceChildren();

  const title = document.createElement("p");
  title.style.fontWeight = "700";
  title.textContent = "Đăng ký thành công và đã lưu vào LocalStorage!";

  const detail = document.createElement("p");
  // Dùng textContent để tránh XSS khi hiển thị lại dữ liệu người dùng
  detail.textContent = `Tài khoản: ${name} (${email})`;

  successBox.append(title, detail);
}

togglePasswordBtn.addEventListener("click", () => {
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";
  togglePasswordBtn.textContent = isHidden ? "Ẩn" : "Hiện";
  togglePasswordBtn.setAttribute("aria-pressed", String(isHidden));
});

fullNameInput.addEventListener("blur", validateFullName);
emailInput.addEventListener("blur", validateEmail);
passwordInput.addEventListener("input", () => {
  if (fieldEls.password.error.textContent) {
    validatePassword();
  }
});
agreeTermsInput.addEventListener("change", validateTerms);

form.addEventListener("submit", (event) => {
  // Chặn reload trang mặc định để kiểm tra dữ liệu và lưu LocalStorage bằng JS
  event.preventDefault();
  successBox.hidden = true;

  const isNameOk = validateFullName();
  const isEmailOk = validateEmail();
  const isPassOk = validatePassword();
  const isTermsOk = validateTerms();

  if (!(isNameOk && isEmailOk && isPassOk && isTermsOk)) {
    const firstInvalid = [
      { ok: isNameOk, el: fullNameInput },
      { ok: isEmailOk, el: emailInput },
      { ok: isPassOk, el: passwordInput },
      { ok: isTermsOk, el: agreeTermsInput }
    ].find((item) => !item.ok);

    if (firstInvalid) {
      firstInvalid.el.focus();
    }
    return;
  }

  const cleanName = fullNameInput.value.trim();
  const cleanEmail = emailInput.value.trim().toLowerCase();
  const rawPassword = passwordInput.value;

  const record = {
    name: cleanName,
    email: cleanEmail,
    passwordEncoded: encodeMockSecret(rawPassword),
    agreedTerms: true,
    createdAt: new Date().toISOString()
  };

  try {
    saveUserToLocalStorage(record);
    showSuccessMessage(cleanName, cleanEmail);
    form.reset();
    passwordInput.type = "password";
    togglePasswordBtn.textContent = "Hiện";
    togglePasswordBtn.setAttribute("aria-pressed", "false");
  } catch {
    setFieldError("terms", "Không thể lưu dữ liệu vào LocalStorage (kiểm tra quyền lưu trữ trình duyệt).");
  }
});