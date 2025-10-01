// ==============================
// Xử lý Header chung (Auth + Search)
// ==============================

// Khởi tạo header sau khi load xong
function initHeader() {
  renderAuthArea();
  initSearchBar();
}

// ==============================
// Xử lý login/logout
// ==============================
function renderAuthArea() {
  const authArea = document.getElementById("authArea");
  if (!authArea) return;

  const info = localStorage.getItem("Info");

  if (info) {
    authArea.innerHTML = `
      <div class="top-nav-item"><span>Xin chào, ${info}</span></div>
      <div class="top-nav-item" id="logoutBtn"><span>Đăng xuất</span></div>
    `;
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", logout);
    }
  } else {
    authArea.innerHTML = `
      <div class="top-nav-item"><a href="register.html">Đăng ký</a></div>
      <div class="top-nav-item"><a href="login.html">Đăng nhập</a></div>
    `;
  }
}

function logout() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("Info");
  location.reload();
}

// ==============================
// Xử lý Search Bar
// ==============================
function performMainSearch() {
  const input = document.getElementById("mainSearchInput");
  if (!input) return;

  const searchValue = input.value.trim();
  if (searchValue) {
    // Chuyển đến trang tìm kiếm kèm query
    window.location.href = `/index/search.html?q=${encodeURIComponent(searchValue)}`;
  }
}

function initSearchBar() {
  const btn = document.getElementById("mainSearchButton");
  const input = document.getElementById("mainSearchInput");

  if (!btn || !input) return;

  btn.addEventListener("click", performMainSearch);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") performMainSearch();
  });
}

// ==============================
// Hàm load component dùng chung
// ==============================
async function loadComponent(id, file) {
  try {
    const res = await fetch(file);
    const html = await res.text();
    document.getElementById(id).innerHTML = html;

    // Sau khi header load xong → khởi tạo
    if (id === "header") {
      initHeader();
     if (typeof processUrlParameters === "function") {
    setTimeout(processUrlParameters, 0); // gọi sau khi header đã render
  }
    }
  } catch (err) {
    console.error(`Lỗi khi load component ${id} từ ${file}:`, err);
  }
}
// Hàm cập nhật số lượng giỏ hàng trên header
async function updateCartCount() {
  const cartCountElement = document.getElementById('cartCount');
  if (!cartCountElement) return;
  
  const userInfo = localStorage.getItem('Info');
  if (!userInfo) {
    cartCountElement.textContent = '0';
    return;
  }
  
  try {
    const userData = JSON.parse(userInfo);
    const res = await fetch(`${window.Base_Url}/Cart`, {
      headers: {
        'Authorization': `Bearer ${userData.token}`
      }
    });
    
    const data = await res.json();
    
    if (data.success && data.data) {
      const totalItems = data.data.reduce((sum, item) => sum + item.quantityOrdered, 0);
      cartCountElement.textContent = totalItems;
    } else {
      cartCountElement.textContent = '0';
    }
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật số lượng giỏ hàng:", error);
    cartCountElement.textContent = '0';
  }
}

// Gọi hàm này sau khi đăng nhập thành công
function onLoginSuccess() {
  updateCartCount();
  // Các xử lý khác sau khi đăng nhập
}