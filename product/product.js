/* ========= STATE ========= */
let variantCombinations = []; // mảng các combination [{attributeId, attributeName, value, imageFromValue?}, ...]
let mode = 'add'; // 'add' hoặc 'edit'
let productId = null; // ID sản phẩm khi ở chế độ edit
let editingProductData = null; // Dữ liệu sản phẩm khi chỉnh sửa

// Lấy tham số từ URL
const urlParams = new URLSearchParams(window.location.search);
mode = urlParams.get('mode') || 'add';
productId = urlParams.get('id');

/* ========= TAB ========= */
function showTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const tabElement = document.querySelector(`.tab[onclick="showTab('${tab}')"]`);
  if (tabElement) tabElement.classList.add('active');
  document.getElementById(tab).classList.add('active');
}

/* ========= CATEGORY ========= */
async function loadCategories() {
  try {
    const res = await apiCall('/category', 'GET');
    const data = res.data || [];
    const select = document.getElementById('categorySelect');
    select.innerHTML = '<option value="">Chọn danh mục</option>';
    
    data.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      select.appendChild(opt);
    });

    // Nếu đang chỉnh sửa và có dữ liệu category, chọn category đó
    if (mode === 'edit' && editingProductData && editingProductData.category) {
      setTimeout(() => {
        select.value = editingProductData.category.id;
      }, 500);
    }
  } catch (e) {
    console.error('❌ Lỗi load category:', e);
  }
}

/* ========= UPLOAD IMAGE ========= */
// Hàm upload ảnh chung
async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const res = await apiCall('/product/image', 'POST', formData, { isFormData: true });
    // BE có thể trả về {filename}, {data}, hoặc string → lấy ra tên file
    return res?.filename || res?.data || res;
  } catch (err) {
    console.error("❌ Upload ảnh thất bại:", err);
    alert("Upload ảnh thất bại!");
    return null;
  }
}

// Hàm xử lý khi chọn ảnh sản phẩm
async function onProductImageChange(input) {
  const file = input.files[0];
  if (!file) {
    document.getElementById("productImageName").value = "";
    document.getElementById("imagePreview").textContent = "Chưa có ảnh";
    return;
  }

  const filename = await uploadImage(file);
  if (filename) {
    document.getElementById("productImageName").value = filename;
    document.getElementById("imagePreview").textContent = filename;
  }
}

async function uploadAttrImage(input) {
  if (!input.files.length) return;
  const filename = await uploadImage(input.files[0]);
  if (filename) {
    const holder = input.closest('.attr-value-item');
    holder.dataset.image = filename;
    holder.querySelector('.uploaded-filename').textContent = filename;
  }
}

/* ========= ATTRIBUTE ========= */
async function loadAttributes() {
  try {
    const res = await apiCall('/VarriantAttribute', 'GET');
    const container = document.getElementById('attributeArea');
    container.innerHTML = '';

    if (!res.success || !res.data || res.data.length === 0) {
      container.innerHTML = `<div class="empty-state"><p>Không có thuộc tính nào</p></div>`;
      return;
    }

    res.data.forEach(attr => {
      const wrapper = document.createElement('div');
      wrapper.classList.add('form-group', 'attribute-item');
      wrapper.dataset.attrId = attr.attributeId;
      wrapper.dataset.attrName = attr.attributeName;

      wrapper.innerHTML = `
        <div class="attribute-header">
          <label>
            <input type="checkbox" class="attr-checkbox"
              data-attr-id="${attr.attributeId}" 
              data-attr-name="${attr.attributeName}"
              data-is-image="false"
              onchange="onAttrCheckboxChange(this)">
            ${attr.attributeName}
          </label>
          <label class="ml-3">
            <input type="checkbox" class="image-checkbox" onchange="toggleImageAttr(this)"> Dùng làm ảnh
          </label>
        </div>
        <div class="value-inputs" style="margin-top:10px; display:none;">
          <div class="attr-value-item">
            <input type="text" class="attr-value" placeholder="Giá trị (VD: đỏ, xanh, L, XL)" />
            <input type="file" class="attr-image" accept="image/*" onchange="uploadAttrImage(this)" />
            <span class="uploaded-filename">Chưa có</span>
            <button type="button" class="btn btn-outline btn-sm" onclick="removeValueInput(this)">X</button>
          </div>
          <button type="button" class="btn btn-primary mt-2" onclick="addValueInput(this)">+ Thêm giá trị</button>
        </div>
      `;

      container.appendChild(wrapper);
    });

    // Nếu đang chỉnh sửa, điền thông tin attributes và variants
    if (mode === 'edit' && editingProductData && editingProductData.variants) {
      setTimeout(() => {
        populateAttributesFromProductData(editingProductData);
      }, 1000);
    }
  } catch (err) {
    console.error('❌ Lỗi load thuộc tính:', err);
  }
}

// Điền thông tin attributes từ dữ liệu sản phẩm
function populateAttributesFromProductData(productData) {
  if (!productData.variants || productData.variants.length === 0) return;

  // Gom theo attributeName nhưng giữ cả value + imageVariant (+ attributeId nếu cần)
  const usedAttributes = {}; 
  // { color: [{value:'Đỏ', image:'red.jpg', attributeId:'attr001'}, ...] }

  productData.variants.forEach(variant => {
    (variant.attributes || []).forEach(attr => {
      const key = attr.attributeName;
      const item = {
        value: attr.value,
        // Chỉ giữ lại tên file, không giữ prefix
        image: attr.imageVariant ? extractFilename(attr.imageVariant) : null,
        attributeId: attr.attributeId || null
      };
      if (!usedAttributes[key]) usedAttributes[key] = [];
      // tránh trùng value
      if (!usedAttributes[key].some(x => x.value === item.value)) {
        usedAttributes[key].push(item);
      }
    });
  });

  // Duyệt từng attribute block trong UI và bơm dữ liệu
  document.querySelectorAll('.attribute-item').forEach(attrItem => {
    const attrName = attrItem.dataset.attrName;
    const values = usedAttributes[attrName] || [];
    if (values.length === 0) return;

    // Bật checkbox + mở vùng nhập giá trị
    const attrCheckbox = attrItem.querySelector('.attr-checkbox');
    attrCheckbox.checked = true;
    onAttrCheckboxChange(attrCheckbox);

    // Xóa input mẫu
    const valueInputs = attrItem.querySelector('.value-inputs');
    valueInputs.querySelectorAll('.attr-value-item').forEach(node => node.remove());
    const addBtn = valueInputs.querySelector('button');

    // Thêm từng value + gắn lại filename (dataset.image + span)
    values.forEach(val => {
      const group = document.createElement('div');
      group.classList.add('attr-value-item');
      if (val.image) group.dataset.image = val.image;  // ⚡ giữ filename trong dataset

      group.innerHTML = `
        <input type="text" class="attr-value" placeholder="Giá trị" value="${val.value}" />
        <input type="file" class="attr-image" accept="image/*" onchange="uploadAttrImage(this)" />
        <span class="uploaded-filename">${val.image || 'Chưa có'}</span>
        <button type="button" class="btn btn-outline btn-sm" onclick="removeValueInput(this)">X</button>
      `;
      valueInputs.insertBefore(group, addBtn);
    });

    // Nếu attribute này có bất kỳ value nào có ảnh → đánh dấu "Dùng làm ảnh"
    if (values.some(v => !!v.image)) {
      const imgCb = attrItem.querySelector('.image-checkbox');
      imgCb.checked = true;
      attrCheckbox.dataset.isImage = "true";
    }
  });

  // Tạo bảng biến thể từ dữ liệu (đã có ảnh gắn vào combo)
  generateVariantsFromProductData(productData);
}


// Tạo biến thể từ dữ liệu sản phẩm
function generateVariantsFromProductData(productData) {
  if (!productData.variants) return;

  variantCombinations = [];
  const tbody = document.querySelector('#variantTable tbody');
  tbody.innerHTML = '';

  productData.variants.forEach((variant, i) => {
    const attributes = variant.attributes.map(attr => ({
      attributeId: attr.attributeId,
      attributeName: attr.attributeName,
      value: attr.value,
      // vẫn giữ full URL để dùng cho hiển thị ảnh
      imageFromValue: attr.imageVariant || null
    }));

    variantCombinations.push(attributes);

    const attributesText = attributes.map(a => `${a.attributeName}: ${a.value}`).join(' | ');
    const imgEntry = attributes.find(a => a.imageFromValue);

    // ❌ Không in nguyên full URL
    // ✅ Chỉ hiển thị tên file (stripPrefix)
    const imageCell = imgEntry
      ? `<span>${extractFilename(imgEntry.imageFromValue)}</span>`
      : `<span>Dùng ảnh sản phẩm</span>`;

    tbody.innerHTML += `
      <tr data-variant-id="${variant.variantId || ''}">
        <td>${attributesText}</td>
        <td><input value="${variant.sku || 'SKU-' + (i + 1)}" class="sku" /></td>
        <td><input type="number" class="price" min="0" value="${variant.price || 0}" /></td>
        <td><input type="number" class="quantity" min="0" value="${variant.quantity || 0}" /></td>
        <td>${imageCell}</td>
        <td><button type="button" class="btn btn-danger" onclick="removeVariant(${i})">Xóa</button></td>
      </tr>`;
  });

  showTab('variant');
}


function onAttrCheckboxChange(checkbox) {
  const wrapper = checkbox.closest('.attribute-item');
  const valueInputs = wrapper.querySelector('.value-inputs');
  valueInputs.style.display = checkbox.checked ? 'block' : 'none';
  if (!checkbox.checked) {
    wrapper.querySelector('.image-checkbox').checked = false;
    checkbox.dataset.isImage = "false";
  }
}

function toggleImageAttr(checkbox) {
  document.querySelectorAll('.image-checkbox').forEach(cb => { 
    if (cb !== checkbox) cb.checked = false; 
  });
  document.querySelectorAll('.attribute-item').forEach(item => {
    const attrCb = item.querySelector('.attr-checkbox');
    const imgCb = item.querySelector('.image-checkbox');
    attrCb.dataset.isImage = (imgCb.checked ? "true" : "false");
  });
}

function addValueInput(button) {
  const valueInputs = button.closest('.value-inputs');
  const group = document.createElement('div');
  group.classList.add('attr-value-item');
  group.innerHTML = `
    <input type="text" class="attr-value" placeholder="Giá trị" />
    <input type="file" class="attr-image" accept="image/*" onchange="uploadAttrImage(this)" />
    <span class="uploaded-filename">Chưa có</span>
    <button type="button" class="btn btn-outline btn-sm" onclick="removeValueInput(this)">X</button>
  `;
  valueInputs.insertBefore(group, button);
}

function removeValueInput(btn) { 
  btn.closest('.attr-value-item').remove(); 
}

/* ========= GENERATE VARIANTS ========= */
function generateVariants() {
  const checked = document.querySelectorAll('.attr-checkbox:checked');
  const valuesMap = {};
  let imageAttribute = null;

  checked.forEach(cb => {
    const attrId = cb.dataset.attrId || cb.dataset.attrName; // fallback sang tên nếu id null
    const attrName = cb.dataset.attrName;
    const wrapper = cb.closest('.attribute-item');
    const valueItems = wrapper.querySelectorAll('.attr-value-item');

    const values = Array.from(valueItems).map(it => {
      const v = it.querySelector('.attr-value').value.trim();
      const img = it.dataset.image || null;
      return v ? { value: v, image: img } : null;
    }).filter(Boolean);

    if (values.length > 0) {
      // 🔥 Dùng attrName làm key để tránh bị đè khi attrId null/trùng
      valuesMap[attrName] = { id: attrId, name: attrName, values };
      if (cb.dataset.isImage === "true") imageAttribute = attrName;
    }
  });

  const keys = Object.keys(valuesMap);
  variantCombinations = [];

  const combine = (idx = 0, current = []) => {
    if (idx === keys.length) {
      variantCombinations.push([...current]);
      return;
    }
    const key = keys[idx];
    for (const val of valuesMap[key].values) {
      current.push({ 
        attributeId: valuesMap[key].id, 
        attributeName: valuesMap[key].name, 
        value: val.value, 
        imageFromValue: val.image || null 
      });
      combine(idx + 1, current);
      current.pop();
    }
  };
  
  if (keys.length > 0) {
    combine();
  }

  const tbody = document.querySelector('#variantTable tbody');
  tbody.innerHTML = '';

  if (variantCombinations.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6"><div class="empty-state"><p>Chưa có biến thể nào</p></div></td></tr>`;
    showTab('variant');
    return;
  }

  variantCombinations.forEach((combo, i) => {
    const attributesText = combo.map(c => `${c.attributeName}: ${c.value}`).join(' | ');
    const imgEntry = combo.find(c => c.imageFromValue);
    const imageCell = imgEntry ? `<span>${imgEntry.imageFromValue}</span>` : `<span>Dùng ảnh sản phẩm</span>`;

    tbody.innerHTML += `
      <tr>
        <td>${attributesText}</td>
        <td><input value="SKU-${i + 1}" class="sku" /></td>
        <td><input type="number" class="price" min="0" /></td>
        <td><input type="number" class="quantity" min="0" /></td>
        <td>${imageCell}</td>
        <td><button type="button" class="btn btn-danger" onclick="removeVariant(${i})">Xóa</button></td>
      </tr>`;
    variantCombinations[i]._resolvedImage = imgEntry ? imgEntry.imageFromValue : null;
  });

  showTab('variant');
}


function removeVariant(idx) {
  variantCombinations.splice(idx, 1);
  const tbody = document.querySelector('#variantTable tbody');
  if (tbody && tbody.rows[idx]) tbody.deleteRow(idx);
}
// Tách lấy filename từ full URL
function extractFilename(path) {
  if (!path) return "";
  return path.split('/').pop(); // VD: "xxx_aophong.jpg"
}

/* ========= LOAD PRODUCT FOR EDITING ========= */
async function loadProductForEditing(id) {
  try {
    const res = await apiCall(`/product/details/${id}`, 'GET');
    if (res.success && res.data) {
      editingProductData = res.data;
      const product = res.data;
      
      // Điền thông tin cơ bản
      document.getElementById('productName').value = product.productName;
      document.getElementById('productDesc').value = product.description;
      document.getElementById('productPrice').value = product.basePrice;
      document.getElementById('productActive').value = product.active.toString();
      const filename = extractFilename(product.productImage);
      // Điền thông tin ảnh
      document.getElementById('productImageName').value = filename;
      document.getElementById('imagePreview').textContent = filename || 'Chưa có ảnh';
      
      // Load lại attributes để điền thông tin variants
      loadAttributes();
    }
  } catch (error) {
    console.error('Lỗi khi tải sản phẩm để chỉnh sửa:', error);
    alert('Không thể tải thông tin sản phẩm');
  }
}

/* ========= SUBMIT PRODUCT (Product + Variants) ========= */
window.submitProduct = async function () {
  const productName = document.getElementById('productName').value.trim();
  const description = document.getElementById('productDesc').value.trim();
  const basePrice = parseFloat(document.getElementById('productPrice').value);
  const active = document.getElementById('productActive').value === 'true';
  const categorySelect = document.getElementById('categorySelect');
  const categoryId = parseInt(categorySelect.value);
  const categoryName = categorySelect.options[categorySelect.selectedIndex].text;
  const productImage = document.getElementById('productImageName').value;

  if (!productName || !description || isNaN(basePrice) || !categoryId || !productImage) {
    alert("❌ Vui lòng nhập đủ thông tin sản phẩm!");
    return;
  }

  const variants = [];
  document.querySelectorAll("#variantTable tbody tr").forEach((row, i) => {
    if (row.classList.contains("empty-row")) return;
    const sku = row.querySelector(".sku").value.trim();
    const price = parseFloat(row.querySelector(".price").value) || 0;
    const quantity = parseInt(row.querySelector(".quantity").value) || 0;
    const variantId = row.getAttribute("data-variant-id") || null;
    const attributes = (variantCombinations[i] || []).map(v => ({
      attributeId: v.attributeId,
      nameAttribute: v.attributeName,
      value: v.value,
      imageVariant: v.imageFromValue || null
    }));

    variants.push({ 
     variantId,
      sku, 
      price, 
      quantity, 
      imageVariant: variantCombinations[i]._resolvedImage || null, 
      variant_attibute_value: attributes 
    });
  });

  const payload = {
    productName,
    description,
    basePrice,
    active,
    categoryId,
    categoryName,
    productImage,
    productVariant: variants
  };
  console.log("du lieu truyen di backend : " , variants)

  try {
    const url = mode === 'edit' ? `/product/${productId}` : '/product';
    const method = mode === 'edit' ? 'PUT' : 'POST';
    
    const res = await apiCall(url, method, payload);
    if (res.success) {
      alert(mode === 'edit' ? "✅ Cập nhật sản phẩm thành công!" : "✅ Tạo sản phẩm thành công!");
      
      // Thông báo cho parent window (nếu được mở trong iframe)
      if (window.parent && window !== window.parent) {
        window.parent.postMessage('productSaved', '*');
      } else {
        // Nếu không ở trong iframe, chuyển hướng về trang quản lý
        window.location.href = 'product-management.html';
      }
    } else {
      alert(res.message || (mode === 'edit' ? "❌ Cập nhật sản phẩm thất bại!" : "❌ Tạo sản phẩm thất bại!"));
    }
  } catch (err) {
    console.error(`❌ Lỗi ${mode === 'edit' ? 'cập nhật' : 'tạo'} sản phẩm:`, err);
    alert(`Lỗi khi ${mode === 'edit' ? 'cập nhật' : 'tạo'} sản phẩm!`);
  }
};

/* ========= INIT ========= */
window.onload = function() {
  // Hiển thị thông tin chế độ
  const modeBadge = document.getElementById('modeBadge');
  const pageTitle = document.getElementById('pageTitle');
  
  if (mode === 'edit') {
    modeBadge.textContent = 'Chế độ chỉnh sửa';
    modeBadge.classList.add('status-active');
    pageTitle.textContent = 'Chỉnh Sửa Sản Phẩm';
    
    // Load thông tin sản phẩm để chỉnh sửa
    if (productId) {
      loadProductForEditing(productId);
    }
  } else {
    modeBadge.textContent = 'Chế độ thêm mới';
    modeBadge.classList.add('status-inactive');
  }
  
  // Load dữ liệu
  loadCategories();
  loadAttributes();
};