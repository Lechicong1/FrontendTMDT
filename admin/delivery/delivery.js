
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
    listElement.innerHTML = '<tr><td colspan="8" class="loading"><i class="fas fa-spinner"></i> Đang tải danh sách...</td></tr>';
    
    try {
        const response = await apiCall('/DeliveryService', 'GET');
        
        if (response.success && Array.isArray(response.data)) {
            // Lưu danh sách vào biến toàn cục để sử dụng cho chỉnh sửa
            window.currentServices = response.data;
            renderDeliveryList(response.data);
        } else {
            showNotification('Không thể tải danh sách đơn vị vận chuyển', 'error');
            listElement.innerHTML = '<tr><td colspan="8">Không có dữ liệu</td></tr>';
        }
    } catch (error) {
        console.error('Lỗi khi tải danh sách đơn vị vận chuyển:', error);
        showNotification('Đã xảy ra lỗi khi tải danh sách', 'error');
        listElement.innerHTML = '<tr><td colspan="8">Đã xảy ra lỗi khi tải dữ liệu</td></tr>';
    }
}

// Hiển thị danh sách đơn vị vận chuyển
function renderDeliveryList(services) {
    const listElement = document.getElementById('delivery-list');
    
    if (!services || services.length === 0) {
        listElement.innerHTML = '<tr><td colspan="8">Không có đơn vị vận chuyển nào</td></tr>';
        return;
    }
    
    let html = '';
    
    services.forEach(service => {
        html += `
            <tr>
                <td>${service.id}</td>
                <td>
                    ${service.logoUrl ? 
                        `<img src="${service.logoUrl}" alt="${service.name}" class="delivery-logo" onerror="this.style.display='none'">` : 
                        '<span>N/A</span>'
                    }
                </td>
                <td>${service.name}</td>
                <td>${service.code || 'N/A'}</td>
                <td class="token-cell">${service.token ? `${service.token.substring(0, 10)}...` : 'N/A'}</td>
                <td class="api-cell">${service.apiUrlCalculateFee ? `${service.apiUrlCalculateFee.substring(0, 30)}...` : 'N/A'}</td>
                <td>
                    <span class="status-badge ${service.active ? 'status-active' : 'status-inactive'}">
                        ${service.active ? 'Hoạt động' : 'Ngừng hoạt động'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn btn-edit" onclick="editDelivery(${service.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn btn-delete" onclick="openDeleteModal(${service.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    listElement.innerHTML = html;
}

// Mở modal thêm mới
function openCreateModal() {
    document.getElementById('modalTitle').textContent = 'Thêm đơn vị vận chuyển';
    document.getElementById('deliveryForm').reset();
    document.getElementById('deliveryId').value = '';
    document.getElementById('fileName').textContent = 'Chưa có tệp nào được chọn';
    document.getElementById('active').checked = true;
    document.getElementById('deliveryModal').style.display = 'block';
}

// Mở modal chỉnh sửa
// Mở modal chỉnh sửa (sửa lại không cần gọi API GET)
function editDelivery(id) {
    // Tìm service trong danh sách đã load
    const services = window.currentServices || [];
    const service = services.find(s => s.id === id);
    
    if (service) {
        document.getElementById('modalTitle').textContent = 'Chỉnh sửa đơn vị vận chuyển';
        document.getElementById('deliveryId').value = service.id;
        document.getElementById('name').value = service.name || '';
        document.getElementById('description').value = service.description || '';
        document.getElementById('code').value = service.code || '';
        document.getElementById('token').value = service.token || '';
        document.getElementById('apiUrlCalculateFee').value = service.apiUrlCalculateFee || '';
        document.getElementById('apiUrlCreateOrder').value = service.apiUrlCreateOrder || '';
        document.getElementById('apiUrlTracking').value = service.apiUrlTracking || '';
        document.getElementById('service_type_id').value = service.service_type_id || '';
        document.getElementById('active').checked = service.active;
        document.getElementById('fileName').textContent = 'Chưa có tệp nào được chọn';
        
        document.getElementById('deliveryModal').style.display = 'block';
    } else {
        showNotification('Không thể tìm thấy thông tin đơn vị vận chuyển', 'error');
    }
}
// Đóng modal
function closeModal() {
    document.getElementById('deliveryModal').style.display = 'none';
}

// Mở modal xóa
function openDeleteModal(id) {
    window.currentDeleteId = id;
    document.getElementById('deleteModal').style.display = 'block';
}

// Đóng modal xóa
function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    window.currentDeleteId = null;
}

// Xác nhận xóa
async function confirmDelete() {
    if (!window.currentDeleteId) return;
    
    try {
        const response = await apiCall(`/DeliveryService/${window.currentDeleteId}`, 'DELETE');
        
        if (response.success) {
            showNotification('Xóa đơn vị vận chuyển thành công!', 'success');
            loadDeliveryServices();
        } else {
            showNotification('Xóa thất bại: ' + (response.message || 'Lỗi không xác định'), 'error');
        }
    } catch (error) {
        console.error('Lỗi khi xóa đơn vị vận chuyển:', error);
        showNotification('Đã xảy ra lỗi khi xóa', 'error');
    } finally {
        closeDeleteModal();
    }
}

// Xử lý gửi form
// Xử lý gửi form
document.getElementById('deliveryForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const id = document.getElementById('deliveryId').value;
    const name = document.getElementById('name').value.trim();
    const description = document.getElementById('description').value.trim();
    const code = document.getElementById('code').value.trim();
    const token = document.getElementById('token').value.trim();
    const apiUrlCalculateFee = document.getElementById('apiUrlCalculateFee').value.trim();
    const apiUrlCreateOrder = document.getElementById('apiUrlCreateOrder').value.trim();
    const apiUrlTracking = document.getElementById('apiUrlTracking').value.trim();
    const service_type_id = document.getElementById('service_type_id').value;
    const active = document.getElementById('active').checked;
    const fileInput = document.getElementById('logoFile');
    const file = fileInput.files[0];
    
    // Validate
    if (!name) {
        showNotification('Vui lòng nhập tên đơn vị vận chuyển', 'error');
        return;
    }
    
    if (!apiUrlCalculateFee) {
        showNotification('Vui lòng nhập API tính phí', 'error');
        return;
    }
    
    // Kiểm tra kích thước file nếu có
    if (file && file.size > 2 * 1024 * 1024) {
        showNotification('Kích thước logo không được vượt quá 2MB', 'error');
        return;
    }
    
    // Chuẩn bị dữ liệu
    const requestData = {
        name,
        description: description || null,
        code: code || null,
        token: token || null,
        apiUrlCalculateFee,
        apiUrlCreateOrder: apiUrlCreateOrder || null,
        apiUrlTracking: apiUrlTracking || null,
        service_type_id: service_type_id ? parseInt(service_type_id) : null,
        active
    };
    
    const formData = new FormData();
    formData.append('req', JSON.stringify(requestData));
    if (file) {
        formData.append('file', file);
    }
    
    const submitButton = this.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý';
    
    try {
        let response;
        if (id) {
            // Cập nhật - sửa endpoint thành đúng format
            response = await apiCall(`/DeliveryService/${id}`, 'PUT', formData, { isFormData: true });
        } else {
            // Tạo mới
            response = await apiCall('/DeliveryService', 'POST', formData, { isFormData: true });
        }
        
        if (response.success) {
            showNotification(`${id ? 'Cập nhật' : 'Thêm'} đơn vị vận chuyển thành công!`, 'success');
            closeModal();
            loadDeliveryServices();
        } else {
            showNotification(`${id ? 'Cập nhật' : 'Thêm'} thất bại: ` + (response.message || 'Lỗi không xác định'), 'error');
        }
    } catch (error) {
        console.error(`Lỗi khi ${id ? 'cập nhật' : 'thêm'} đơn vị vận chuyển:`, error);
        showNotification(`Đã xảy ra lỗi khi ${id ? 'cập nhật' : 'thêm'}`, 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Lưu';
    }
});

// Hiển thị tên file khi chọn
document.getElementById('logoFile').addEventListener('change', function(e) {
    const fileName = e.target.files[0] ? e.target.files[0].name : 'Chưa có tệp nào được chọn';
    document.getElementById('fileName').textContent = fileName;
});

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
    const username = localStorage.getItem('username') || 'Admin';
    document.getElementById('username-display').textContent = `Xin chào, ${username}`;
}

// Đóng modal khi click bên ngoài
window.onclick = function(event) {
    const modal = document.getElementById('deliveryModal');
    const deleteModal = document.getElementById('deleteModal');
    
    if (event.target === modal) {
        closeModal();
    }
    
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
}

// Tải dữ liệu khi trang được tải
document.addEventListener('DOMContentLoaded', function() {
    displayUsername();
    loadDeliveryServices();
});