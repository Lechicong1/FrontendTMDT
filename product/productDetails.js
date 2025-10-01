// Biến toàn cục
let productData = null;        // chứa toàn bộ product
let selectedVariant = null;    // biến thể đang chọn
let selectedAttributes = {};   // map attrName → value
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

/* ========= LOAD PRODUCT ========= */
async function loadProductDetails(productId) {
  try {
    console.log("Đang tải chi tiết sản phẩm:", productId);

    const res = await fetch(`${window.Base_Url}/product/details/${productId}`);
    const data = await res.json();

    console.log("Dữ liệu nhận được:", data);

    if (data.success && data.data) {
      productData = data.data;
      renderProductDetails();
    } else {
      showError("Không tìm thấy thông tin sản phẩm");
    }
  } catch (error) {
    console.error("❌ Lỗi khi tải chi tiết:", error);
    showError("Đã xảy ra lỗi khi tải thông tin sản phẩm");
  }
}

/* ========= RENDER PRODUCT ========= */
function renderProductDetails() {
  if (!productData) return;

  const container = document.getElementById("productDetailsContent");
  const firstImage = productData.productImage;

  // Gom nhóm thuộc tính từ tất cả variants
  const attributeGroups = extractAttributeGroups(productData.variants);

  // Render HTML
  container.innerHTML = `   
    <div class="product-main">
      <div class="product-images">
        <div class="main-image">
          <img src="${firstImage}" alt="${productData.productName}" id="mainProductImage"
               onerror="this.src='https://via.placeholder.com/400x400'">
        </div>
      </div>
      
      <div class="product-info">
        <h1 class="product-title">${productData.productName}</h1>
        <div class="product-category">Danh mục: ${productData.category?.name || ''}</div>
        <div class="product-description">${productData.description || "Sản phẩm chất lượng cao"}</div>

        <div class="product-price">
          <span class="current-price" id="currentPrice">${formatPrice(productData.basePrice)}đ</span>
        </div>

        ${renderAttributeGroups(attributeGroups)}

        <div class="quantity-section">
          <span class="quantity-label">Số lượng:</span>
          <div class="quantity-controls">
            <button class="quantity-btn" onclick="changeQuantity(-1)">-</button>
            <input type="number" class="quantity-input" id="quantityInput" value="1" min="1" max="100" onchange="validateQuantity()">
            <button class="quantity-btn" onclick="changeQuantity(1)">+</button>
          </div>
          <span class="stock-info" id="stockInfo">Vui lòng chọn biến thể</span>
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
}

/* ========= XỬ LÝ ATTRIBUTE ========= */
function extractAttributeGroups(variants) {
  const groups = {}; // { ram:[{value, imageVariant}], size:[...] }

  variants.forEach(v => {
    v.attributes.forEach(attr => {
      if (!groups[attr.attributeName]) groups[attr.attributeName] = [];
      if (!groups[attr.attributeName].some(a => a.value === attr.value)) {
        groups[attr.attributeName].push({
          value: attr.value,
          image: attr.imageVariant || null
        });
      }
    });
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

  // bỏ chọn cùng nhóm
  document.querySelectorAll(`.variant-option[data-type="${type}"]`).forEach(opt => opt.classList.remove("selected"));
  option.classList.add("selected");

  selectedAttributes[type] = value;

  // đổi ảnh nếu có
  if (image) {
    document.getElementById("mainProductImage").src =image;
  }

  findMatchingVariant();
}                                                   

/* ========= TÌM BIẾN THỂ ========= */
function findMatchingVariant() {
  const matched = productData.variants.find(variant =>
    Object.entries(selectedAttributes).every(([t, v]) =>
      variant.attributes.some(attr => attr.attributeName === t && attr.value === v)
    )
  );

  if (matched) {
    selectedVariant = matched;
    updateVariantSelection();
  }
}

/* ========= UPDATE UI ========= */
function updateVariantSelection() {
  if (!selectedVariant) return;

  document.getElementById("currentPrice").textContent = `${formatPrice(selectedVariant.price)}đ`;
  document.getElementById("stockInfo").textContent = `Còn ${selectedVariant.quantity} sản phẩm`;

  if (selectedVariant.quantity === 0) {
    document.getElementById("stockInfo").classList.add("out");
    document.getElementById("stockInfo").textContent = "Hết hàng";
  }
}

/* ========= QUANTITY ========= */
function changeQuantity(amount) {
  const input = document.getElementById("quantityInput");
  let newVal = parseInt(input.value) + amount;
  if (newVal < 1) newVal = 1;
  if (selectedVariant && newVal > selectedVariant.quantity) {
    newVal = selectedVariant.quantity;
  }
  input.value = newVal;
  currentQuantity = newVal;
}

function validateQuantity() {
  const input = document.getElementById("quantityInput");
  let val = parseInt(input.value);
  if (isNaN(val) || val < 1) val = 1;
  if (selectedVariant && val > selectedVariant.quantity) {
    val = selectedVariant.quantity;
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
/* ========= CART / BUY ========= */
async function addToCart() {
  if (!selectedVariant) return alert("Vui lòng chọn biến thể trước!");
  
  // Kiểm tra đăng nhập
  const userInfo = localStorage.getItem('Info');
  if (!userInfo) {
    alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
    window.location.href = '/login/login.html';
    return;
  }
  
  try {
    const cartRequest = {
      variantNew: selectedVariant.variantId,
      quantityItem: currentQuantity
    };
    
    const data = await apiCall("/Cart","POST",cartRequest)
    
  
    
    if (data.success) {
      alert("Đã thêm vào giỏ hàng thành công!");
      // Cập nhật số lượng trong giỏ hàng trên header nếu có
      updateCartCount();
    } else {
      alert("Có lỗi xảy ra khi thêm vào giỏ hàng: " + data.message);
    }
  } catch (error) {
    console.error("❌ Lỗi khi thêm vào giỏ hàng:", error);
    alert("Đã xảy ra lỗi khi thêm vào giỏ hàng");
  }
}

// Hàm cập nhật số lượng sản phẩm trong giỏ hàng trên header
function updateCartCount() {
  const cartCountElement = document.getElementById('cartCount');
  if (cartCountElement) {
    const currentCount = parseInt(cartCountElement.textContent) || 0;
    cartCountElement.textContent = currentCount + currentQuantity;
  }
}