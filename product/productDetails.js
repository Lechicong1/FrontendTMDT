// Biến toàn cục
let productData = null;
let selectedVariant = null;
let selectedAttributes = {};
let currentQuantity = 1;

/* ========= INIT ========= */
document.addEventListener("DOMContentLoaded", () => {
  const productId = getProductIdFromUrl();
  if (productId) {
    loadProductDetails(productId);
  } else {
    showError("Không tìm thấy sản phẩm");
  }
});

// Lấy ID sản phẩm từ URL
function getProductIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id");
}

/* ========= CHUẨN HÓA DỮ LIỆU ========= */
function normalizeVariants(rawData) {
  const variants = {};
  rawData.forEach(row => {
    if (!variants[row.variantId]) {
      variants[row.variantId] = {
        variantId: row.variantId,
        productImage: row.productImage,
        variantImage: row.variantImage,
        variantQuantity: row.variantQuantity,
        priceVariant: row.priceVariant,
        nameProduct: row.nameProduct,
        nameCategory: row.nameCategory,
        description: row.description,
        attributes: {}
      };
    }
    if (row.attributeType && row.value) {
      variants[row.variantId].attributes[row.attributeType] = row.value;
    }
  });
  return Object.values(variants);
}

/* ========= LOAD PRODUCT ========= */
async function loadProductDetails(productId) {
  try {
    console.log("Đang tải chi tiết sản phẩm với ID:", productId);

    const response = await fetch(`${window.Base_Url}/product/details/${productId}`);
    const data = await response.json();

    console.log("Dữ liệu nhận được:", data);

    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      productData = normalizeVariants(data.data);
      renderProductDetails();
    } else {
      showError("Không tìm thấy thông tin sản phẩm");
    }
  } catch (error) {
    console.error("❌ Lỗi khi tải chi tiết sản phẩm:", error);
    showError("Đã xảy ra lỗi khi tải thông tin sản phẩm");
  }
}

/* ========= RENDER PRODUCT ========= */
function renderProductDetails() {
  if (!productData || productData.length === 0) return;

  const firstVariant = productData[0];
  const container = document.getElementById("productDetailsContent");

  // Cập nhật breadcrumb
  document.getElementById("categoryBreadcrumb").textContent = firstVariant.nameCategory;
  document.getElementById("categoryBreadcrumb").href =
    `/search.html?category=${firstVariant.idProduct}&categoryName=${encodeURIComponent(firstVariant.nameCategory)}`;
  document.getElementById("productBreadcrumb").textContent = firstVariant.nameProduct;

  // Gom nhóm attribute
  const attributeGroups = extractAttributeGroups();

  // Render HTML
  container.innerHTML = `
    <div class="product-main">
      <div class="product-images">
        <div class="main-image">
          <img src="${firstVariant.variantImage || firstVariant.productImage}" 
              alt="${firstVariant.nameProduct}" 
              id="mainProductImage"
              onerror="this.src='https://via.placeholder.com/400x400'">
        </div>
      </div>
      
      <div class="product-info">
        <h1 class="product-title">${firstVariant.nameProduct}</h1>
        <div class="product-category">Danh mục: ${firstVariant.nameCategory}</div>

        <div class="product-description">
          ${firstVariant.description || "Sản phẩm chất lượng cao"}
        </div>

        <div class="product-price">
          <span class="current-price" id="currentPrice">${formatPrice(firstVariant.priceVariant)}đ</span>
          <span class="original-price" id="originalPrice">${formatPrice(firstVariant.priceVariant * 1.2)}đ</span>
          <span class="discount-badge">-20%</span>
        </div>

        ${renderAttributeGroups(attributeGroups)}

        <div class="quantity-section">
          <span class="quantity-label">Số lượng:</span>
          <div class="quantity-controls">
            <button class="quantity-btn" onclick="changeQuantity(-1)">-</button>
            <input type="number" class="quantity-input" id="quantityInput" value="1" min="1" max="100" onchange="validateQuantity()">
            <button class="quantity-btn" onclick="changeQuantity(1)">+</button>
          </div>
          <span class="stock-info" id="stockInfo">Còn ${firstVariant.variantQuantity} sản phẩm</span>
        </div>

        <div class="action-buttons">
          <button class="btn-primary" onclick="addToCart()">
            <i class="fas fa-shopping-cart"></i> Thêm vào giỏ hàng
          </button>
          <button class="btn-secondary" onclick="buyNow()">
            <i class="fas fa-bolt"></i> Mua ngay
          </button>
        </div>
      </div>
    </div>
  `;

  selectedVariant = firstVariant;
  updateVariantSelection();
}

/* ========= ATTRIBUTE HANDLING ========= */
function extractAttributeGroups() {
  const groups = {}; // { color:[{value,image}], size:[{value,image?}] }

  productData.forEach(variant => {
    for (const [type, value] of Object.entries(variant.attributes)) {
      if (!groups[type]) groups[type] = [];
      if (!groups[type].some(v => v.value === value)) {
        groups[type].push({
          value,
          image: type === "color" ? variant.variantImage : null
        });
      }
    }
  });
  return groups;
}

function renderAttributeGroups(attributeGroups) {
  let html = "";
  for (const [type, values] of Object.entries(attributeGroups)) {
    html += `
      <div class="variants-section">
        <div class="variant-group">
          <span class="variant-label">${type.toUpperCase()}:</span>
          <div class="variant-options" data-type="${type}">
            ${values.map(v => `
              <div class="variant-option" 
                   data-type="${type}" 
                   data-value="${v.value}" 
                   data-image="${v.image || ""}">
                ${v.value}
              </div>`).join("")}
          </div>
        </div>
      </div>
    `;
  }

  setTimeout(() => {
    document.querySelectorAll(".variant-option").forEach(opt => {
      opt.addEventListener("click", () => selectVariantOption(opt));
    });
  }, 0);

  return html;
}

/* ========= CHỌN OPTION ========= */
function selectVariantOption(option) {
  const type = option.dataset.type;
  const value = option.dataset.value;
  const image = option.dataset.image;

  // bỏ chọn cùng type
  document.querySelectorAll(`.variant-option[data-type="${type}"]`).forEach(opt => opt.classList.remove("selected"));
  option.classList.add("selected");

  selectedAttributes[type] = value;

  // Nếu chọn màu (hoặc attr có ảnh) → đổi ảnh ngay
  if (image) {
    document.getElementById("mainProductImage").src = image;
  }

  findMatchingVariant();
}

/* ========= TÌM BIẾN THỂ ========= */
function findMatchingVariant() {
  const matched = productData.find(variant =>
    Object.entries(selectedAttributes).every(([t, v]) => variant.attributes[t] === v)
  );

  if (matched) {
    selectedVariant = matched;
    updateVariantSelection();
    updateProductDisplay();
  }
}

/* ========= UPDATE UI ========= */
function updateProductDisplay() {
  if (!selectedVariant) return;

  const mainImage = document.getElementById("mainProductImage");
  if (mainImage && selectedVariant.variantImage) {
    mainImage.src = selectedVariant.variantImage;
  }

  document.getElementById("currentPrice").textContent = `${formatPrice(selectedVariant.priceVariant)}đ`;
  document.getElementById("originalPrice").textContent = `${formatPrice(selectedVariant.priceVariant * 1.2)}đ`;
}

function updateVariantSelection() {
  const stockInfo = document.getElementById("stockInfo");
  if (stockInfo && selectedVariant) {
    stockInfo.textContent = `Còn ${selectedVariant.variantQuantity} sản phẩm`;
    if (selectedVariant.variantQuantity === 0) {
      stockInfo.classList.add("out");
      stockInfo.textContent = "Hết hàng";
    }
  }
}

/* ========= QUANTITY ========= */
function changeQuantity(amount) {
  const input = document.getElementById("quantityInput");
  let newVal = parseInt(input.value) + amount;
  if (newVal < 1) newVal = 1;
  if (selectedVariant && newVal > selectedVariant.variantQuantity) {
    newVal = selectedVariant.variantQuantity;
  }
  input.value = newVal;
  currentQuantity = newVal;
}

function validateQuantity() {
  const input = document.getElementById("quantityInput");
  let val = parseInt(input.value);
  if (isNaN(val) || val < 1) val = 1;
  if (selectedVariant && val > selectedVariant.variantQuantity) {
    val = selectedVariant.variantQuantity;
  }
  input.value = val;
  currentQuantity = val;
}

/* ========= CART / BUY ========= */
function addToCart() {
  if (!selectedVariant) return alert("Chọn biến thể trước!");
  console.log("🛒 Thêm giỏ:", {
    variantId: selectedVariant.variantId,
    quantity: currentQuantity,
    attributes: selectedAttributes
  });
  alert("Đã thêm vào giỏ!");
}

function buyNow() {
  if (!selectedVariant) return alert("Chọn biến thể trước!");
  console.log("⚡ Mua ngay:", {
    variantId: selectedVariant.variantId,
    quantity: currentQuantity,
    attributes: selectedAttributes
  });
  alert("Chuyển đến thanh toán!");
}

/* ========= UTILS ========= */
function showError(message) {
  document.getElementById("productDetailsContent").innerHTML = `
    <div class="error-state">
      <i class="fas fa-exclamation-triangle"></i>
      <h3>${message}</h3>
      <a href="/" class="btn-primary">Quay lại trang chủ</a>
    </div>`;
}

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price);
}
