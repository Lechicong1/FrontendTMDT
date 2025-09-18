// Hiển thị tên file khi chọn
document.getElementById('fileInput').addEventListener('change', function(e) {
    const fileName = e.target.files[0] ? e.target.files[0].name : 'Chưa có tệp nào được chọn';
    document.getElementById('fileName').textContent = fileName;
});

// Xử lý gửi form
document.getElementById('sellerRegisterForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const shopName = document.getElementById('shopName').value.trim();
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    const submitButton = document.getElementById('submitButton');
    
    if (!shopName) {
        showNotification('Vui lòng nhập tên shop', 'error');
        return;
    }
    
    if (!file) {
        showNotification('Vui lòng chọn tệp giấy tờ', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Kích thước tệp không được vượt quá 5MB', 'error');
        return;
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
        showNotification('Chỉ chấp nhận file JPG, PNG hoặc PDF', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('req', JSON.stringify({ shopName }));
    formData.append('file', file);
    
    submitButton.disabled = true;
    submitButton.textContent = 'Đang gửi...';
    
    try {
        const response = await apiCall('/registerSeller', 'POST', formData, { isFormData: true });
        if (response.success) {
            showNotification('Đăng ký thành công! Yêu cầu của bạn đang được xét duyệt.', 'success');
            document.getElementById('sellerRegisterForm').reset();
            document.getElementById('fileName').textContent = 'Chưa có tệp nào được chọn';
        } else {
            showNotification(response.message || 'Đăng ký thất bại. Vui lòng thử lại.', 'error');
        }
    } catch (error) {
        console.error('Lỗi khi đăng ký:', error);
        showNotification('Có lỗi xảy ra. Vui lòng thử lại sau.', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Gửi đăng ký';
    }
});

// Hiển thị thông báo
function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}
