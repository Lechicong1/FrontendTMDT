// Chuyển đổi tab
function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));

  document.getElementById(tabId).classList.add('active');
  document.querySelector(`.tab[onclick="showTab('${tabId}')"]`).classList.add('active');

  if (tabId === 'pending') {
    loadPendingRegistrations();
  } else if (tabId === 'approved') {
    loadApprovedRegistrations();
  }
}

// Tải danh sách đăng ký chờ phê duyệt
async function loadPendingRegistrations() {
  const listElement = document.getElementById('pending-list');
  listElement.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i> Đang tải...</div>';

  try {
    const response = await apiCall('/registerSeller/pending', 'GET');

    if (response.success && response.data && response.data.length > 0) {
      let html = '';
      response.data.forEach(registration => {
        html += `
          <div class="register-card" id="registration-${registration.id}">
            <div class="register-header">
              <div class="shop-name">${registration.shopName}</div>
              <div class="status pending">CHỜ DUYỆT</div>
            </div>
            <div class="register-details">
              <div class="detail-row">
                <div class="detail-label">Username:</div>
                <div class="detail-value">${registration.username}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Giấy tờ:</div>
                <div class="detail-value">
                  <a href="${registration.identityDocumentUrl}" target="_blank" class="document-link">Xem giấy tờ</a>
                </div>
              </div>
            </div>
            <div class="action-buttons">
              <button class="btn btn-approve" onclick="approveRegistration(${registration.id})">
                <i class="fas fa-check"></i> Xác nhận
              </button>
              <button class="btn btn-reject" onclick="rejectRegistration(${registration.id})">
                <i class="fas fa-times"></i> Từ chối
              </button>
            </div>
          </div>
        `;
      });
      listElement.innerHTML = html;
    } else {
      listElement.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-clipboard-check"></i>
          <p>Không có đăng ký nào chờ phê duyệt</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Lỗi khi tải danh sách chờ phê duyệt:', error);
    listElement.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Đã xảy ra lỗi khi tải dữ liệu</p>
      </div>
    `;
  }
}

// Tải danh sách đăng ký đã phê duyệt
async function loadApprovedRegistrations() {
  const listElement = document.getElementById('approved-list');
  listElement.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i> Đang tải...</div>';

  try {
    const response = await apiCall('/registerSeller/approved', 'GET');

    if (response.success && response.data && response.data.length > 0) {
      let html = '';
      response.data.forEach(registration => {
        html += `
          <div class="register-card">
            <div class="register-header">
              <div class="shop-name">${registration.shopName}</div>
              <div class="status approved">ĐÃ DUYỆT</div>
            </div>
            <div class="register-details">
              <div class="detail-row">
                <div class="detail-label">Username:</div>
                <div class="detail-value">${registration.username}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Giấy tờ:</div>
                <div class="detail-value">
                  <a href="${registration.identityDocumentUrl}" target="_blank" class="document-link">Xem giấy tờ</a>
                </div>
              </div>
            </div>
          </div>
        `;
      });
      listElement.innerHTML = html;
    } else {
      listElement.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-clipboard-list"></i>
          <p>Chưa có đăng ký nào được phê duyệt</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Lỗi khi tải danh sách đã phê duyệt:', error);
    listElement.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Đã xảy ra lỗi khi tải dữ liệu</p>
      </div>
    `;
  }
}

// Phê duyệt đăng ký
async function approveRegistration(id) {
  if (!confirm('Bạn có chắc chắn muốn phê duyệt đăng ký này?')) return;

  try {
    const response = await apiCall(`/registerSeller/${id}?option=1`, 'PUT');
    if (response.success) {
      alert('Đã phê duyệt đăng ký thành công!');
      document.getElementById(`registration-${id}`).remove();
      if (document.querySelectorAll('.register-card').length === 0) {
        loadPendingRegistrations();
      }
    } else {
      alert('Phê duyệt thất bại: ' + (response.message || 'Lỗi không xác định'));
    }
  } catch (error) {
    console.error('Lỗi khi phê duyệt:', error);
    alert('Đã xảy ra lỗi khi phê duyệt');
  }
}

// Từ chối đăng ký
async function rejectRegistration(id) {
  if (!confirm('Bạn có chắc chắn muốn từ chối đăng ký này?')) return;

  try {
    const response = await apiCall(`/registerSeller/${id}?option=0`, 'PUT');
    if (response.success) {
      alert('Đã từ chối đăng ký thành công!');
      document.getElementById(`registration-${id}`).remove();
      if (document.querySelectorAll('.register-card').length === 0) {
        loadPendingRegistrations();
      }
    } else {
      alert('Từ chối thất bại: ' + (response.message || 'Lỗi không xác định'));
    }
  } catch (error) {
    console.error('Lỗi khi từ chối:', error);
    alert('Đã xảy ra lỗi khi từ chối');
  }
}

// Đăng xuất
function logout() {
  if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
    localStorage.removeItem('adminToken');
    window.location.href = '/login/login.html';
  }
}

// Load dữ liệu khi trang mở
document.addEventListener('DOMContentLoaded', function() {
  loadPendingRegistrations();
});
