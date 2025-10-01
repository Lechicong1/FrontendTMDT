// ================== BIẾN TOÀN CỤC ==================
let cartItems = [];
let productVariants = {};
let selectedItems = new Set(); // Lưu các variantId được chọn

// ================== INIT ==================
document.addEventListener("DOMContentLoaded", () => {
  checkAuthAndLoadCart();
});

// ================== LOGIN CHECK ==================
function checkAuthAndLoadCart() {
  const userInfo = localStorage.getItem("Info");
  if (!userInfo) {
    redirectToLogin();
    return;
  }
  loadCartItems();
}

function redirectToLogin() {
  document.getElementById("cartContent").innerHTML = `
    <div class="cart-empty">
      <i class="fas fa-exclamation-circle"></i>
      <h3>Vui lòng đăng nhập để xem giỏ hàng</h3>
      <a href="/login.html" class="btn-primary">Đăng nhập</a>
    </div>
  `;
}

// ================== LOAD CART ==================
async function loadCartItems() {
  try {
    const data = await apiCall("/Cart");
    if (data.success && data.data) {
      cartItems = data.data;
      renderCartItems();
    } else {
      showEmptyCart();
    }
  } catch (error) {
    console.error("❌ Lỗi khi tải giỏ hàng:", error);
    showEmptyCart();
  }
}

function showEmptyCart() {
  document.getElementById("cartContent").innerHTML = `
    <div class="cart-empty">
      <i class="fas fa-shopping-cart"></i>
      <h3>Giỏ hàng của bạn đang trống</h3>
      <a href="/" class="btn-primary">Tiếp tục mua sắm</a>
    </div>
  `;
}

// ================== RENDER CART ==================
function renderCartItems() {
  const container = document.getElementById("cartContent");

  if (cartItems.length === 0) {
    showEmptyCart();
    return;
  }

  // Tính tổng tiền các sản phẩm được chọn
  const selectedTotal = calculateSelectedTotal();

  const itemsHTML = cartItems.map(item => {
    const isSelected = selectedItems.has(item.variant.variantId);
    const variantImage =
      item.variant.attributes.find(attr => attr.imageVariant)?.imageVariant ||
      item.productImage;

    return `
      <div class="cart-item" data-variant-id="${item.variant.variantId}">
        <div class="cart-item-checkbox">
          <div class="checkbox ${isSelected ? 'checked' : ''}" 
               onclick="toggleSelectItem('${item.variant.variantId}')"></div>
        </div>
        <div class="cart-item-image">
          <img src="${variantImage}" alt="${item.productName}" 
               onerror="this.src='https://via.placeholder.com/100x100'">
        </div>
        <div class="cart-item-details">
          <h3 class="cart-item-name">${item.productName}</h3>
          <div class="cart-item-shop">Cửa hàng: ${item.shop.shopName}</div>
          
          <div class="cart-item-variant">
            <div class="variant-selector">
              <button class="variant-toggle-btn" 
                      data-product-id="${item.productId}" 
                      data-variant-id="${item.variant.variantId}">
                ${getVariantDescription(item.variant.attributes)} 
                <i class="fas fa-chevron-down"></i>
              </button>
              <div class="variant-options hidden" id="variantOptions-${item.productId}">
                <!-- Variants sẽ render ở đây -->
              </div>
            </div>
          </div>
          
          <div class="cart-item-price">${formatPrice(item.variant.price)}đ</div>
          
          <div class="cart-item-actions">
            <div class="quantity-controls">
              <button class="quantity-btn" onclick="changeCartItemQuantity('${item.variant.variantId}', -1)">-</button>
              <input type="number" class="quantity-input" id="quantity-${item.variant.variantId}" 
                     value="${item.quantityOrdered}" 
                     min="1" 
                     onchange="updateCartItemQuantity('${item.variant.variantId}')">
              <button class="quantity-btn" onclick="changeCartItemQuantity('${item.variant.variantId}', 1)">+</button>
            </div>
            <button class="remove-item" onclick="removeCartItem('${item.variant.variantId}')">
              <i class="fas fa-trash"></i> Xóa
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  const isAllSelected = selectedItems.size === cartItems.length && cartItems.length > 0;

  container.innerHTML = `
    <div class="select-all">
      <div class="select-all-checkbox">
        <div class="checkbox ${isAllSelected ? 'checked' : ''}" onclick="toggleSelectAll()"></div>
      </div>
      <span class="select-all-label">Chọn tất cả (${cartItems.length})</span>
      <span class="selected-count">Đã chọn: ${selectedItems.size}</span>
    </div>
    
    <div class="cart-items">${itemsHTML}</div>
    
    <div class="cart-summary">
      <h3 class="summary-title">Tóm tắt đơn hàng</h3>
      <div class="summary-row"><span>Tạm tính:</span><span>${formatPrice(selectedTotal)}đ</span></div>
      <div class="summary-row"><span>Phí vận chuyển:</span><span>Được tính ở bước sau</span></div>
      <div class="summary-row summary-total"><span>Tổng cộng:</span><span>${formatPrice(selectedTotal)}đ</span></div>
      <button class="checkout-btn" onclick="checkout()" ${selectedItems.size === 0 ? 'disabled' : ''}>
        Thanh toán (${selectedItems.size})
      </button>
    </div>
  `;

  addVariantToggleListeners();
}

// ================== SELECT/DESELECT ITEMS ==================
function toggleSelectItem(variantId) {
  if (selectedItems.has(variantId)) {
    selectedItems.delete(variantId);
  } else {
    selectedItems.add(variantId);
  }
  renderCartItems();
}

function toggleSelectAll() {
  if (selectedItems.size === cartItems.length) {
    selectedItems.clear();
  } else {
    cartItems.forEach(item => selectedItems.add(item.variant.variantId));
  }
  renderCartItems();
}

function calculateSelectedTotal() {
  return cartItems.reduce((total, item) => {
    if (selectedItems.has(item.variant.variantId)) {
      total += item.variant.price * item.quantityOrdered;
    }
    return total;
  }, 0);
}

// ================== VARIANT HANDLING ==================
function addVariantToggleListeners() {
  document.querySelectorAll(".variant-toggle-btn").forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      const productId = this.getAttribute("data-product-id");
      const variantId = this.getAttribute("data-variant-id");
      toggleVariantOptions(productId, variantId);
    });
  });
}

async function toggleVariantOptions(productId, currentVariantId) {
  const container = document.getElementById(`variantOptions-${productId}`);
  document.querySelectorAll(".variant-options").forEach(c => {
    if (c.id !== `variantOptions-${productId}`) c.classList.add("hidden");
  });

  if (!container.dataset.loaded) {
    await loadProductVariants(productId, currentVariantId);
    container.dataset.loaded = "true";
  }

  container.classList.toggle("hidden");
}

async function loadProductVariants(productId, currentVariantId) {
  try {
    const data = await apiCall(`/product/details/${productId}`);
    if (data.success && data.data) {
      const product = data.data;
      productVariants[productId] = product.variants;

      const container = document.getElementById(`variantOptions-${productId}`);
      if (!container) return;

      container.innerHTML = product.variants.map(variant => {
        const isSelected = variant.variantId === currentVariantId;
        return `
          <div class="variant-option ${isSelected ? "selected" : ""}" 
               onclick="confirmVariantChange('${productId}', '${variant.variantId}', '${currentVariantId}')">
            ${getVariantDescription(variant.attributes)} - ${formatPrice(variant.price)}đ
          </div>
        `;
      }).join("");
    }
  } catch (error) {
    console.error("❌ Lỗi khi tải variants:", error);
  }
}

function confirmVariantChange(productId, newVariantId, oldVariantId) {
  if (confirm("Xác nhận đổi biến thể này?")) {
    const oldItem = cartItems.find(item => item.variant.variantId === oldVariantId);
    const oldQuantity = oldItem ? oldItem.quantityOrdered : 1;
    updateCartItem(oldVariantId, newVariantId, oldQuantity);
  }
  const container = document.getElementById(`variantOptions-${productId}`);
  if (container) container.classList.add("hidden");
}

// ================== UPDATE CART (SỐ LƯỢNG + VARIANT) ==================
async function updateCartItem(variantIdOld, variantIdNew = null, quantityItem = null) {
  try {
    const cartRequest = { variantIdOld, variantNew: variantIdNew, quantityItem };
    const data = await apiCall("/Cart", "PUT", cartRequest);
    if (data.success) {
      if (variantIdNew && selectedItems.has(variantIdOld)) {
        selectedItems.delete(variantIdOld);
        selectedItems.add(variantIdNew);
      }
      loadCartItems();
    } else {
      alert("Có lỗi khi cập nhật giỏ hàng: " + data.message);
    }
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật giỏ hàng:", error);
  }
}

function changeCartItemQuantity(variantId, change) {
  const input = document.getElementById(`quantity-${variantId}`);
  let newQuantity = parseInt(input.value) + change;
  if (newQuantity < 1) newQuantity = 1;
  input.value = newQuantity;
  updateCartItem(variantId, null, newQuantity);
}

function updateCartItemQuantity(variantId, newQuantity = null) {
  const input = document.getElementById(`quantity-${variantId}`);
  let quantity = newQuantity !== null ? newQuantity : parseInt(input.value);
  if (isNaN(quantity) || quantity < 1) quantity = 1;
  updateCartItem(variantId, null, quantity);
}

// ================== REMOVE ITEM ==================
async function removeCartItem(variantId) {
  if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;
  try {
    const cartRequest = { variantIdOld: variantId, quantityItem: 0 };
    const data = await apiCall("/Cart", "PUT", cartRequest);
    if (data.success) {
      selectedItems.delete(variantId);
      loadCartItems();
    } else {
      alert("Có lỗi khi xóa sản phẩm: " + data.message);
    }
  } catch (error) {
    console.error("❌ Lỗi khi xóa sản phẩm:", error);
  }
}

// ================== CHECKOUT ==================
function checkout() {
  if (selectedItems.size === 0) {
    alert("Vui lòng chọn ít nhất một sản phẩm để thanh toán!");
    return;
  }
  const selectedCartItems = cartItems.filter(item => selectedItems.has(item.variant.variantId));
  localStorage.setItem('selectedCartItems', JSON.stringify(selectedCartItems));
  window.location.href = "/checkout.html";
}

// ================== UTILS ==================
function getVariantDescription(attributes) {
  return attributes.map(attr => `${attr.attributeName}: ${attr.value}`).join(" / ");
}

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price);
}

// ================== CLICK OUTSIDE ==================
document.addEventListener("click", function (event) {
  if (!event.target.closest(".variant-selector")) {
    document.querySelectorAll(".variant-options").forEach(c => c.classList.add("hidden"));
  }
});
