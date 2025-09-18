
document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  loadProducts();

});

// Biến toàn cục để lưu trạng thái
let currentPage = 1; // Trang bắt đầu từ 1 (theo backend)
let currentSize = 30;
let currentCategory = '';
let currentAddress = '';
let currentSort = 'price_asc';
let currentSearch = '';
let categories = [];



// Hàm tải danh mục
async function loadCategories() {
    try {
        const response = await fetch(`${window.Base_Url}/category`,{
            method : "GET",
            headers : {
                "Content-Type" : "application/json"
            }
        });
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
            categories = data.data;
            renderCategories(data.data);
        } else {
            console.error('Không thể tải danh mục:', data.message);
        }
    } catch (error) {
        console.error('Lỗi khi tải danh mục:', error);
    }
}

// Hiển thị danh mục
function renderCategories(categories) {
    const container = document.getElementById('categories-container');
    
    if (!categories || categories.length === 0) {
        container.innerHTML = '<div class="empty">Không có danh mục nào</div>';
        return;
    }
    
    let html = '';
    categories.forEach(category => {
        html += `
            <div class="category-item" data-category-id="${category.id}">
                <img src="${category.imageCategory}" alt="${category.name}" onerror="this.src='https://cf.shopee.vn/file/687f3967b7c2fe6a134a2c11894eea4b_tn'">
                <span>${category.name}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Thêm sự kiện click cho danh mục
    container.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', () => {
            const categoryId = item.getAttribute('data-category-id');
            const category = categories.find(c => c.id == categoryId);
            if (category) {
                // Chuyển đến trang tìm kiếm với danh mục được chọn
                window.location.href = `/search.html?category=${categoryId}&categoryName=${encodeURIComponent(category.name)}`;
            }
        });
    });
}

// Hàm tải sản phẩm
async function loadProducts() {
    const container = document.getElementById('products-container');
    container.innerHTML = '<div class="loading">Đang tải sản phẩm...</div>';
    
    try {
        const params = new URLSearchParams({
            page: currentPage, // Gửi trang bắt đầu từ 1
            size: currentSize,
            sortBy: currentSort
        });
        
        if (currentCategory) params.append('categoryId', currentCategory);
        if (currentAddress) params.append('shopAddress', currentAddress);
        if (currentSearch) params.append('name', currentSearch);
        
        const response = await apiCall(`/product?${params}`, 'GET');
        
        if (response.success && response.data) {
            renderProducts(response.data.content);
            renderPagination(response.data);
        } else {
            container.innerHTML = '<div class="empty">Không có sản phẩm nào</div>';
        }
    } catch (error) {
        console.error('Lỗi khi tải sản phẩm:', error);
        container.innerHTML = '<div class="empty">Đã xảy ra lỗi khi tải sản phẩm</div>';
    }
}

// Hiển thị sản phẩm
function renderProducts(products) {
    const container = document.getElementById('products-container');
    
    if (!products || products.length === 0) {
        container.innerHTML = '<div class="empty">Không có sản phẩm nào</div>';
        return;
    }
    
    let html = '';
    products.forEach(product => {
        html += `
            <div class="product-card">
                <div class="product-badge">Mới</div>
                <img class="product-image" src="${product.productImage}" alt="${product.name}" onerror="this.src='https://cf.shopee.vn/file/sg-11134201-23030-xtj9g4h2pylvb7_tn'">
                <div class="product-info">
                    <p class="product-name">${product.name}</p>
                    <div class="product-price">
                        <span class="current-price">${formatPrice(product.price)}đ</span>
                    </div>
                    <div class="product-rating">
                        <div class="stars">
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star-half-alt"></i>
                        </div>
                        <span class="rating-count">(999+)</span>
                    </div>
                    <div class="product-location">${product.shopName || 'Shop'}</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Hiển thị phân trang
function renderPagination(pageData) {
    const pagination = document.getElementById('pagination');
    
    if (!pageData || pageData.totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Nút previous
    html += `
        <button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" 
                onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Các nút trang (hiển thị từ 1 đến totalPages)
    for (let i = 1; i <= pageData.totalPages; i++) {
        html += `
            <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }
    
    // Nút next
    html += `
        <button class="page-btn ${currentPage === pageData.totalPages ? 'disabled' : ''}" 
                onclick="changePage(${currentPage + 1})" ${currentPage === pageData.totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    pagination.innerHTML = html;
}

// Chuyển trang
function changePage(page) {
    currentPage = page;
    loadProducts();
    window.scrollTo({ top: document.getElementById('products-container').offsetTop - 100, behavior: 'smooth' });
}

// Hàm utility: Định dạng giá
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN').format(price);
}