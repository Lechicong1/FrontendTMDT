// Biến toàn cục để lưu trạng thái
let currentPage = 1;
let currentSize = 30;
let currentCategory = '';
let currentAddress = '';
let currentSort = 'price_asc';
let currentSearch = '';
let categories = [];
let totalResults = 0;

// Khi trang tải xong
document.addEventListener("DOMContentLoaded", () => {
   
    processUrlParameters();
    loadCategories();
    loadProducts();
    setupFilters();
});

// Xử lý tham số URL
function processUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);

    const searchQuery = urlParams.get('q');
    if (searchQuery) {
        currentSearch = searchQuery;

        const input = document.getElementById('mainSearchInput');
        if (input) input.value = searchQuery;

        const text = document.getElementById('searchQueryText');
        if (text) text.textContent = searchQuery;
    }

    const categoryId = urlParams.get('category');
    if (categoryId) {
        currentCategory = categoryId;

        const categorySelect = document.getElementById('categorySelect');
        if (categorySelect) categorySelect.value = categoryId;

        const categoryName = urlParams.get('categoryName');
        if (categoryName) {
            const searchTitle = document.getElementById('searchTitle');
            if (searchTitle) {
                searchTitle.innerHTML = `Danh mục: <strong>${decodeURIComponent(categoryName)}</strong>`;
            }
        }
    }

    const sort = urlParams.get('sort');
    if (sort) {
        currentSort = sort;
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) sortSelect.value = sort;
    }

    const address = urlParams.get('address');
    if (address) {
        currentAddress = address;
        const addressSelect = document.getElementById('addressSelect');
        if (addressSelect) addressSelect.value = address;
    }
}

// Cập nhật URL
function updateUrlParameters(params) {
    const urlParams = new URLSearchParams(window.location.search);

    for (const key in params) {
        if (params[key]) {
            urlParams.set(key, params[key]);
        } else {
            urlParams.delete(key);
        }
    }

    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
    window.location.reload();
}

// Bộ lọc
function setupFilters() {
    const sortSelect = document.getElementById('sortSelect');
    const categorySelect = document.getElementById('categorySelect');
    const addressSelect = document.getElementById('addressSelect');
    const applyFilters = document.getElementById('applyFilters');

    applyFilters.addEventListener('click', () => {
        currentSort = sortSelect.value;
        currentCategory = categorySelect.value;
        currentAddress = addressSelect.value;
        currentPage = 1;

        updateUrlParameters({
            sort: currentSort,
            category: currentCategory,
            address: currentAddress
        });
    });
}

// Load danh mục
async function loadCategories() {
    try {
        const response = await fetch(`${window.Base_Url}/category`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
            categories = data.data;
            populateCategoryFilter(data.data);
        } else {
            console.error("Không thể tải danh mục:", data.message);
        }
    } catch (error) {
        console.error("Lỗi khi tải danh mục:", error);
    }
}

function populateCategoryFilter(categories) {
    const categorySelect = document.getElementById('categorySelect');
    if (!categories || categories.length === 0) return;

    let options = '<option value="">Tất cả danh mục</option>';
    categories.forEach(category => {
        options += `<option value="${category.id}">${category.name}</option>`;
    });
    categorySelect.innerHTML = options;

    if (currentCategory) categorySelect.value = currentCategory;
}

// Load sản phẩm
async function loadProducts() {
    const container = document.getElementById('products-container');
    container.innerHTML = '<div class="loading">Đang tải sản phẩm...</div>';

    try {
        const params = new URLSearchParams({
            page: currentPage,
            size: currentSize,
            sortBy: currentSort
        });

        if (currentCategory) params.append('categoryId', currentCategory);
        if (currentAddress) params.append('shopAddress', currentAddress);
        if (currentSearch) params.append('name', currentSearch);

        const data = await fetch(`${window.Base_Url}/product?${params}`, {
            method : "GET",
            headers : {
                "Content-Type" : "application/json"
            }
        });
         const response = await data.json();
        console.log("call api ",`${window.Base_Url}/product?${params}` )
        console.log("respone" ,response.data )
        if (response.success && response.data) {
            renderProducts(response.data.content);
            renderPagination(response.data);
            updateResultsCount(response.data.totalElements);
        } else {
            container.innerHTML = '<div class="empty">Không có sản phẩm nào</div>';
            updateResultsCount(0);
        }
    } catch (error) {
        console.error('Lỗi khi tải sản phẩm:', error);
        container.innerHTML = '<div class="empty">Đã xảy ra lỗi khi tải sản phẩm</div>';
        updateResultsCount(0);
    }
}

function updateResultsCount(count) {
    totalResults = count;
    const resultsCount = document.getElementById('resultsCount');

    if (count > 0) {
        const start = (currentPage - 1) * currentSize + 1;
        const end = Math.min(currentPage * currentSize, count);
        resultsCount.textContent = `Hiển thị ${start}-${end} của ${count} kết quả`;
    } else {
        resultsCount.textContent = 'Không tìm thấy kết quả nào phù hợp';
    }
}

function renderProducts(products) {
    const container = document.getElementById('products-container');
    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>Không tìm thấy sản phẩm nào phù hợp</p>
                <p>Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>`;
        return;
    }

    let html = '';
    products.forEach(product => {
        html += `
            <div class="product-card" data-product-id="${product.id}" onclick="goToProductDetail(${product.id})">
                <div class="product-badge">Mới</div>
                <img class="product-image" src="${product.productImage}" alt="${product.name}" 
                     onerror="this.src='https://cf.shopee.vn/file/sg-11134201-23030-xtj9g4h2pylvb7_tn'">
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
            </div>`;
    });
    container.innerHTML = html;
    
    // Thêm sự kiện click cho các thẻ sản phẩm
    addProductClickEvents();
}

// Thêm sự kiện click cho các thẻ sản phẩm
function addProductClickEvents() {
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Ngăn chặn sự kiện click trên các phần tử con (như nút, link)
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('button') || e.target.closest('a')) {
                return;
            }
            
            const productId = card.getAttribute('data-product-id');
            if (productId) {
                goToProductDetail(productId);
            }
        });
    });
}

// Chuyển hướng đến trang chi tiết sản phẩm
function goToProductDetail(productId) {
    window.location.href = `/product/productDetails.html?id=${productId}`;
}

// Phân trang
function renderPagination(pageData) {
    const pagination = document.getElementById('pagination');
    if (!pageData || pageData.totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '';

    html += `
        <button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" 
                onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>`;

    for (let i = 1; i <= pageData.totalPages; i++) {
        html += `
            <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                ${i}
            </button>`;
    }

    html += `
        <button class="page-btn ${currentPage === pageData.totalPages ? 'disabled' : ''}" 
                onclick="changePage(${currentPage + 1})" ${currentPage === pageData.totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>`;

    pagination.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    loadProducts();
    window.scrollTo({ top: document.getElementById('products-container').offsetTop - 100, behavior: 'smooth' });
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN').format(price);
}