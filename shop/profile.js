// ==========================
// Hiển thị thông báo
// ==========================
function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    setTimeout(() => notification.style.display = 'none', 5000);
}

// ==========================
// API địa phương VN
// ==========================
async function loadProvinces(selectedProvince = "") {
    try {
        const res = await fetch("https://provinces.open-api.vn/api/p/");
        const data = await res.json();
        const select = document.getElementById("province");

        select.innerHTML = '<option value="">-- Chọn Tỉnh/Thành phố --</option>';
        data.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.code;
            opt.textContent = p.name;
            if (p.name === selectedProvince) opt.selected = true;
            select.appendChild(opt);
        });
    } catch (e) {
        console.error("Lỗi load provinces:", e);
    }
}

async function loadDistricts(provinceCode, selectedDistrict = "") {
    try {
        const res = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
        const data = await res.json();
        const select = document.getElementById("district");

        select.innerHTML = '<option value="">-- Chọn Quận/Huyện --</option>';
        data.districts.forEach(d => {
            const opt = document.createElement("option");
            opt.value = d.code;
            opt.textContent = d.name;
            if (d.name === selectedDistrict) opt.selected = true;
            select.appendChild(opt);
        });
    } catch (e) {
        console.error("Lỗi load districts:", e);
    }
}

async function loadWards(districtCode, selectedWard = "") {
    try {
        const res = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
        const data = await res.json();
        const select = document.getElementById("ward");

        select.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';
        data.wards.forEach(w => {
            const opt = document.createElement("option");
            opt.value = w.code;
            opt.textContent = w.name;
            if (w.name === selectedWard) opt.selected = true;
            select.appendChild(opt);
        });
    } catch (e) {
        console.error("Lỗi load wards:", e);
    }
}

// ==========================
// Load shop info từ BE
// ==========================
async function loadShopInfo() {
    try {
        const response = await apiCall('/shop/myShop', 'GET');
        if (response.success && response.data) {
            const shop = response.data;

            document.getElementById('shopName').value = shop.shopName || '';
            document.getElementById('shopDescription').value = shop.shopDescription || '';
            document.getElementById('streetAddress').value = shop.streetAddress || '';

            // Logo
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

            // Trạng thái
            const statusElement = document.getElementById('shopStatus');
            statusElement.textContent = getStatusText(shop.status);
            statusElement.className = `shop-status status-${shop.status?.toLowerCase() || 'inactive'}`;

            // Ngày tạo/cập nhật
            document.getElementById('createdAt').textContent = formatDate(shop.createdAt) || 'Chưa có thông tin';
            document.getElementById('updatedAt').textContent = formatDate(shop.updatedAt) || 'Chưa có thông tin';

            // Username
            const username = localStorage.getItem('username') || 'Seller';
            document.getElementById('username-display').textContent = `Xin chào, ${username}`;

            // Load địa chỉ VN
            await loadProvinces(shop.province);
            const provinceSelect = document.getElementById("province");
            const selectedProvince = provinceSelect.options[provinceSelect.selectedIndex];
            if (selectedProvince && selectedProvince.value) {
                await loadDistricts(selectedProvince.value, shop.district);
                const districtSelect = document.getElementById("district");
                const selectedDistrict = districtSelect.options[districtSelect.selectedIndex];
                if (selectedDistrict && selectedDistrict.value) {
                    await loadWards(selectedDistrict.value, shop.ward);
                }
            }

        } else {
            showNotification('Không thể tải thông tin shop: ' + (response.message || 'Lỗi không xác định'), 'error');
        }
    } catch (error) {
        console.error('Lỗi khi tải thông tin shop:', error);
        showNotification('Đã xảy ra lỗi khi tải thông tin shop', 'error');
    }
}

// ==========================
// Toggle Edit
// ==========================
function toggleEditMode() {
    document.querySelectorAll('.form-input').forEach(el => el.disabled = false);
    document.getElementById('logoFile').disabled = false;
    document.getElementById('editButton').style.display = 'none';
    document.getElementById('updateButton').style.display = 'flex';
    document.getElementById('cancelButton').style.display = 'flex';
}

// Cancel Edit
function cancelEdit() {
    document.querySelectorAll('.form-input').forEach(el => el.disabled = true);
    document.getElementById('logoFile').disabled = true;
    document.getElementById('editButton').style.display = 'flex';
    document.getElementById('updateButton').style.display = 'none';
    document.getElementById('cancelButton').style.display = 'none';
}

// ==========================
// Submit update
// ==========================
document.getElementById('shopForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const shopName = document.getElementById('shopName').value.trim();
    const shopDescription = document.getElementById('shopDescription').value.trim();
    const streetAddress = document.getElementById('streetAddress').value.trim();

    const provinceSelect = document.getElementById("province");
    const districtSelect = document.getElementById("district");
    const wardSelect = document.getElementById("ward");

    const provinceName = provinceSelect.options[provinceSelect.selectedIndex]?.text || '';
    const districtName = districtSelect.options[districtSelect.selectedIndex]?.text || '';
    const wardName = wardSelect.options[wardSelect.selectedIndex]?.text || '';

    const file = document.getElementById('logoFile').files[0];
    const updateButton = document.getElementById('updateButton');

    if (!shopName) {
        showNotification('Vui lòng nhập tên shop', 'error');
        return;
    }
    if (file && file.size > 2 * 1024 * 1024) {
        showNotification('Kích thước logo không được vượt quá 2MB', 'error');
        return;
    }

    const formData = new FormData();
    const req = {
        shopName,
        shopDescription,
        streetAddress,
        province: provinceName,
        district: districtName,
        ward: wardName
    };
    formData.append("req", JSON.stringify(req));
    if (file) formData.append("file", file);

    updateButton.disabled = true;
    updateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang cập nhật';

    try {
        const response = await apiCall('/shop', 'PUT', formData, { isFormData: true });
        if (response.success) {
            showNotification('Cập nhật thông tin shop thành công!', 'success');
            await loadShopInfo();
            cancelEdit();
        } else {
            showNotification('Cập nhật thất bại: ' + (response.message || 'Lỗi không xác định'), 'error');
        }
    } catch (err) {
        console.error("Update error:", err);
        showNotification('Đã xảy ra lỗi khi cập nhật thông tin shop', 'error');
    } finally {
        updateButton.disabled = false;
        updateButton.innerHTML = '<i class="fas fa-save"></i> Cập nhật';
    }
});

// ==========================
// Upload Logo Preview
// ==========================
document.getElementById('logoFile').addEventListener('change', function (e) {
    const fileName = e.target.files[0] ? e.target.files[0].name : 'Chưa có tệp nào được chọn';
    document.getElementById('fileName').textContent = fileName;
    if (e.target.files[0] && e.target.files[0].type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function (ev) {
            document.getElementById('logoImage').src = ev.target.result;
            document.getElementById('logoImage').style.display = 'block';
            document.getElementById('noLogoText').style.display = 'none';
        };
        reader.readAsDataURL(e.target.files[0]);
    }
});

// ==========================
// Logout
// ==========================
function logout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        window.location.href = '/login/login.html';
    }
}

// ==========================
// Utility
// ==========================
function formatDate(dateString) {
    if (!dateString) return null;
    const d = new Date(dateString);
    return d.toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function getStatusText(status) {
    switch (status) {
        case 'ACTIVE': return 'HOẠT ĐỘNG';
        case 'INACTIVE': return 'NGỪNG HOẠT ĐỘNG';
        case 'PENDING': return 'CHỜ DUYỆT';
        case 'BANNED': return 'BỊ CẤM';
        default: return status || 'KHÔNG XÁC ĐỊNH';
    }
}

// ==========================
// Sự kiện thay đổi province/district
// ==========================
document.getElementById("province").addEventListener("change", async function () {
    const code = this.value;
    document.getElementById("district").innerHTML = '<option value="">-- Chọn Quận/Huyện --</option>';
    document.getElementById("ward").innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';
    if (code) await loadDistricts(code);
});

document.getElementById("district").addEventListener("change", async function () {
    const code = this.value;
    document.getElementById("ward").innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';
    if (code) await loadWards(code);
});

// ==========================
// Init
// ==========================
document.addEventListener('DOMContentLoaded', loadShopInfo);
