// const origins = window.location.origin;

// const apiBaseUrl = origins + "/api";
const apiBaseUrl = "http://localhost:8080"
const API = apiBaseUrl;
// Hàm gọi API với xử lý token trong sessionStorage
async function apiCall(endpoint, method = "GET", data = null, options = {}) {
  let isFormData = false;
  let headers = {};

  if (!(options instanceof Object) || options instanceof FormData) {
    headers = options || {};
  } else {
    headers = options.headers || {};
    isFormData = options.isFormData || false;
  }

  const token = localStorage.getItem("authToken");
  console.log("token " , token)
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const fetchOptions = {
    method,
    headers: { ...headers },
  };

  if (data) {
    if (isFormData) {
      fetchOptions.body = data;
    } else {
      fetchOptions.headers["Content-Type"] = "application/json";
      fetchOptions.body = JSON.stringify(data);
    }
  }

  try {
    const response = await fetch(`${API}${endpoint}`, fetchOptions);
    console.log("call api : " + `${API}${endpoint}` )
    const responseText = await response.text();
    let result = {};
    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch {
      result = { success: false, message: "Phản hồi không phải JSON", raw: responseText };
    }

    // 👉 Luôn trả JSON, kèm status và ok
    return {
      ...result,
      status: response.status,
      ok: response.ok,
    };
  } catch (error) {
    console.error("API Error:", error);
    return { success: false, message: error.message || "Lỗi kết nối mạng", status: 0, ok: false };
  }
}


// Đăng xuất: xóa session/localStorage và điều hướng
async function logout() {
  localStorage.removeItem("token"); // Xóa token khi logout
  localStorage.removeItem("Role");
  localStorage  .removeItem("userInfo");
  window.location.href = "trangchu.html";
}
