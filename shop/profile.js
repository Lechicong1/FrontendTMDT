
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

// Tải thông tin shop
async function loadShopInfo() {
    try {
        const response = await apiCall('/shop/myShop', 'GET');
        
        if (response.success && response.data) {
            const shop = response.data;
            
            // Điền thông tin vào form
            document.getElementById('shopName').value = shop.shopName || '';
            document.getElementById('shopDescription').value = shop.shopDescription || '';
            document.getElementById('shopAddress').value = shop.shopAddress || '';
            
            // Hiển thị logo nếu có
            const logoImage = document.getElementById('logoImage');
            const noLogoText = document.getElementById('noLogoText');
            
            if (shop.shopLogoUrl) {
                logoImage.src = shop.shopLogoUrl;
                logoImage.style.display = 'block';
                noLogoText.style.display = 'none';
            } else {
                logoImage.style.display = 'none';
                noLogoText.style.display = 'block';
            }
            
            // Hiển thị trạng thái
            const statusElement = document.getElementById('shopStatus');
            statusElement.textContent = getStatusText(shop.status);
            statusElement.className = `shop-status status-${shop.status?.toLowerCase() || 'inactive'}`;
            
            // Hiển thị ngày tạo và cập nhật
            document.getElementById('createdAt').textContent = formatDate(shop.createdAt) || 'Chưa có thông tin';
            document.getElementById('updatedAt').textContent = formatDate(shop.updatedAt) || 'Chưa có thông tin';
            
            // Hiển thị tên người dùng nếu có
            const username = localStorage.getItem('username') || 'Seller';
            document.getElementById('username-display').textContent = `Xin chào, ${username}`;
        } else {
            showNotification('Không thể tải thông tin shop: ' + (response.message || 'Lỗi không xác định'), 'error');
        }
    } catch (error) {
        console.error('Lỗi khi tải thông tin shop:', error);
        showNotification('Đã xảy ra lỗi khi tải thông tin shop', 'error');
    }
}

// Chuyển đổi chế độ chỉnh sửa
function toggleEditMode() {
    const inputs = document.querySelectorAll('.form-input');
    const fileInput = document.getElementById('logoFile');
    const editButton = document.getElementById('editButton');
    const updateButton = document.getElementById('updateButton');
    const cancelButton = document.getElementById('cancelButton');
    
    // Lưu giá trị hiện tại để có thể hủy
    window.originalValues = {
        shopName: document.getElementById('shopName').value,
        shopDescription: document.getElementById('shopDescription').value,
        shopAddress: document.getElementById('shopAddress').value
    };
    
    // Bật chế độ chỉnh sửa
    inputs.forEach(input => input.disabled = false);
    fileInput.disabled = false;
    
    // Ẩn nút chỉnh sửa, hiện nút cập nhật và hủy
    editButton.style.display = 'none';
    updateButton.style.display = 'flex';
    cancelButton.style.display = 'flex';
}

// Hủy chỉnh sửa
function cancelEdit() {
    const inputs = document.querySelectorAll('.form-input');
    const fileInput = document.getElementById('logoFile');
    const editButton = document.getElementById('editButton');
    const updateButton = document.getElementById('updateButton');
    const cancelButton = document.getElementById('cancelButton');
    
    // Khôi phục giá trị ban đầu
    if (window.originalValues) {
        document.getElementById('shopName').value = window.originalValues.shopName;
        document.getElementById('shopDescription').value = window.originalValues.shopDescription;
        document.getElementById('shopAddress').value = window.originalValues.shopAddress;
    }
    
    // Reset file input
    document.getElementById('logoFile').value = '';
    document.getElementById('fileName').textContent = 'Chưa có tệp nào được chọn';
    
    // Tắt chế độ chỉnh sửa
    inputs.forEach(input => input.disabled = true);
    fileInput.disabled = true;
    
    // Hiện nút chỉnh sửa, ẩn nút cập nhật và hủy
    editButton.style.display = 'flex';
    updateButton.style.display = 'none';
    cancelButton.style.display = 'none';
}

// Xử lý gửi form cập nhật
document.getElementById('shopForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const shopName = document.getElementById('shopName').value.trim();
    const shopDescription = document.getElementById('shopDescription').value.trim();
    const shopAddress = document.getElementById('shopAddress').value.trim();
    const fileInput = document.getElementById('logoFile');
    const file = fileInput.files[0];
    const updateButton = document.getElementById('updateButton');
    
    // Validate
    if (!shopName) {
        showNotification('Vui lòng nhập tên shop', 'error');
        return;
    }
    
    // Kiểm tra kích thước file nếu có
    if (file && file.size > 2 * 1024 * 1024) {
        showNotification('Kích thước logo không được vượt quá 2MB', 'error');
        return;
    }
    
    // Chuẩn bị dữ liệu gửi
    const formData = new FormData();
    const requestData = {
        shopName: shopName,
        shopDescription: shopDescription,
        shopAddress: shopAddress
    };
    
    formData.append('req', JSON.stringify(requestData));
    if (file) {
        formData.append('file', file);
    }
    
    // Vô hiệu hóa nút cập nhật
    updateButton.disabled = true;
    updateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang cập nhật';
    
    try {
        // Gọi API cập nhật shop
        const response = await apiCall('/shop', 'PUT', formData, { isFormData: true });
        
        if (response.success) {
            showNotification('Cập nhật thông tin shop thành công!', 'success');
            
            // Tải lại thông tin shop
            await loadShopInfo();
            
            // Quay lại chế độ xem
            cancelEdit();
        } else {
            showNotification('Cập nhật thất bại: ' + (response.message || 'Lỗi không xác định'), 'error');
        }
    } catch (error) {
        console.error('Lỗi khi cập nhật shop:', error);
        showNotification('Đã xảy ra lỗi khi cập nhật thông tin shop', 'error');
    } finally {
        updateButton.disabled = false;
        updateButton.innerHTML = '<i class="fas fa-save"></i> Cập nhật';
    }
});

// Hiển thị tên file khi chọn
document.getElementById('logoFile').addEventListener('change', function(e) {
    const fileName = e.target.files[0] ? e.target.files[0].name : 'Chưa có tệp nào được chọn';
    document.getElementById('fileName').textContent = fileName;
    
    // Xem trước ảnh nếu là file ảnh
    if (e.target.files[0] && e.target.files[0].type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const logoImage = document.getElementById('logoImage');
            const noLogoText = document.getElementById('noLogoText');
            
            logoImage.src = e.target.result;
            logoImage.style.display = 'block';
            noLogoText.style.display = 'none';
        };
        reader.readAsDataURL(e.target.files[0]);
    }
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

// Hàm utility: Định dạng ngày
function formatDate(dateString) {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Hàm utility: Chuyển đổi trạng thái sang tiếng Việt
function getStatusText(status) {
    switch (status) {
        case 'ACTIVE': return 'HOẠT ĐỘNG';
        case 'INACTIVE': return 'NGỪNG HOẠT ĐỘNG';
        case 'PENDING': return 'CHỜ DUYỆT';
        case 'BANNED': return 'BỊ CẤM';
        default: return status || 'KHÔNG XÁC ĐỊNH';
    }
}

// Tải thông tin khi trang được tải
document.addEventListener('DOMContentLoaded', function() {
    loadShopInfo();
});