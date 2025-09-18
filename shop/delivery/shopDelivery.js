

// Hiển thị thông báo
function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    // Ẩn thông báo sau 5 giây
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

// Tải danh sách đơn vị vận chuyển
async function loadDeliveryServices() {
    const listElement = document.getElementById('delivery-list');
    listElement.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i> Đang tải danh sách đơn vị vận chuyển...</div>';
    
    try {
        const response = await apiCall('/ShopDeliveryService', 'GET');
        
        if (response.success && Array.isArray(response)) {
            renderDeliveryList(response);
        } else if (response.success && Array.isArray(response.data)) {
            renderDeliveryList(response.data);
        } else {
            showNotification('Không thể tải danh sách đơn vị vận chuyển', 'error');
            listElement.innerHTML = '<p class="error-message">Không thể tải danh sách đơn vị vận chuyển</p>';
        }
    } catch (error) {
        console.error('Lỗi khi tải danh sách đơn vị vận chuyển:', error);
        showNotification('Đã xảy ra lỗi khi tải danh sách đơn vị vận chuyển', 'error');
        listElement.innerHTML = '<p class="error-message">Đã xảy ra lỗi khi tải dữ liệu</p>';
    }
}
// Hiển thị danh sách đơn vị vận chuyển
function renderDeliveryList(services) {
    const listElement = document.getElementById('delivery-list');
    
    if (!services || services.length === 0) {
        listElement.innerHTML = '<p class="empty-message">Không có đơn vị vận chuyển nào</p>';
        return;
    }
    
    let html = '';
    
    services.forEach(service => {
        // Xác định class CSS dựa trên tên đơn vị vận chuyển
        let serviceClass = 'other';
        if (service.name.includes('GHN') || service.name.includes('ghn')) serviceClass = 'ghn';
        else if (service.name.includes('GHTK') || service.name.includes('ghtk')) serviceClass = 'ghtk';
        else if (service.name.includes('J&T') || service.name.includes('j&t')) serviceClass = 'jt';
        else if (service.name.includes('VNPost') || service.name.includes('vnpost')) serviceClass = 'vnpost';
        
        html += `
            <div class="delivery-item">
                <div class="delivery-info">
                    <div class="delivery-icon ${serviceClass}">
                        <img src="${service.logo}" alt="${service.name}" onerror="this.style.display='none'; this.parentNode.innerHTML='${service.name.substring(0, 2).toUpperCase()}'">
                    </div>
                    <span class="delivery-name">${service.name}</span>
                </div>
                <label class="switch">
                    <input type="checkbox" id="service-${service.id}" ${service.enabled ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
        `;
    });
    
    listElement.innerHTML = html;
}

// Cập nhật danh sách đơn vị vận chuyển
async function updateDeliveryServices() {
    const updateButton = document.getElementById('updateButton');
    const checkboxes = document.querySelectorAll('.delivery-item input[type="checkbox"]');
    
    // Lấy danh sách ID của các dịch vụ được chọn
    const selectedServices = [];
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const id = parseInt(checkbox.id.replace('service-', ''));
            selectedServices.push(id);
        }
    });
    
    // Vô hiệu hóa nút cập nhật
    updateButton.disabled = true;
    updateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang cập nhật';
    
    try {
        // Gọi API cập nhật
        const response = await apiCall('/ShopDeliveryService', 'PUT', selectedServices);
        
        if (response.success) {
            showNotification('Cập nhật đơn vị vận chuyển thành công!', 'success');
        } else {
            showNotification('Cập nhật thất bại: ' + (response.message || 'Lỗi không xác định'), 'error');
        }
    } catch (error) {
        console.error('Lỗi khi cập nhật đơn vị vận chuyển:', error);
        showNotification('Đã xảy ra lỗi khi cập nhật đơn vị vận chuyển', 'error');
    } finally {
        updateButton.disabled = false;
        updateButton.innerHTML = '<i class="fas fa-save"></i> Cập nhật';
    }
}

// Đăng xuất
function logout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        // Xóa thông tin đăng nhập
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        // Chuyển hướng về trang đăng nhập
        window.location.href = '/login/login.html';
    }
}

// Hiển thị tên người dùng
function displayUsername() {
    const username = localStorage.getItem('username') || 'Seller';
    document.getElementById('username-display').textContent = `Xin chào, ${username}`;
}

// Tải dữ liệu khi trang được tải
document.addEventListener('DOMContentLoaded', function() {
    displayUsername();
    loadDeliveryServices();
});