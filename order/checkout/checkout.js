document.addEventListener("DOMContentLoaded", () => {
  loadComponent("header", "/component/html/header.html");
  loadComponent("footer", "/component/html/footer.html");

  const checkoutData = JSON.parse(localStorage.getItem("checkoutData"));
  if (!checkoutData) {
    document.getElementById("checkoutContent").innerHTML = "<p>Không có sản phẩm nào để thanh toán.</p>";
    return;
  }

  renderCheckout(checkoutData);
});

function renderCheckout(data) {
  const container = document.getElementById("checkoutContent");
  container.innerHTML = "";

  data.forEach(shop => {
    const shopBlock = document.createElement("div");
    shopBlock.classList.add("shop-block");

    shopBlock.innerHTML = `
      <div class="shop-header">
        <img src="${shop.shopLogoUrl}" alt="${shop.shopName}" class="shop-logo">
        <h2>${shop.shopName}</h2>
      </div>
      <div class="items">
        ${shop.items.map(item => `
          <div class="item">
            <img src="${item.productImage}" alt="${item.productName}">
            <div>
              <p class="name">${item.productName}</p>
              <p class="variant">${item.variant.color || ""} ${item.variant.size || ""}</p>
              <p>Số lượng: ${item.quantityOrdered}</p>
              <p>Giá: ${item.variant.price}đ</p>
            </div>
          </div>
        `).join("")}
      </div>
      <p class="shipping">Phí vận chuyển: ${shop.shippingFee}đ</p>
    `;

    container.appendChild(shopBlock);
  });
}

// Gọi khi giỏ hàng ấn "Đặt hàng"
async function doCheckout(requestBody) {
  const res = await fetch(`${API_BASE_URL}/api/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("access_token")
    },
    body: JSON.stringify(requestBody)
  });
  const data = await res.json();
  if (data.success) {
    localStorage.setItem("checkoutData", JSON.stringify(data.data));
    window.location.href = "/Checkout/checkout.html";
  } else {
    alert("Checkout thất bại!");
  }
}

// Modal thêm địa chỉ
document.getElementById("addressForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const req = {
    recipientName: document.getElementById("recipientName").value,
    recipientPhone: document.getElementById("recipientPhone").value,
    province: document.getElementById("province").value,
    district: document.getElementById("district").value,
    ward: document.getElementById("ward").value,
    streetAddress: document.getElementById("streetAddress").value,
    addressDefault: true
  };
  const res = await fetch(`${API_BASE_URL}/api/address`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("access_token")
    },
    body: JSON.stringify(req)
  });
  const data = await res.json();
  if (data.success) {
    alert("Thêm địa chỉ thành công!");
    document.getElementById("addressModal").classList.add("hidden");
  } else {
    alert("Lỗi khi thêm địa chỉ!");
  }
});
