/* ========= STATE ========= */
let productId = null;
let variantCombinations = []; // mỗi phần tử là mảng [{attributeId, attributeName, value, imageFromValue?}, ...]

/* ========= TAB ========= */
function showTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`.tab[onclick="showTab('${tab}')"]`).classList.add('active');
  document.getElementById(tab).classList.add('active');
}

/* ========= CATEGORY ========= */
async function loadCategories() {
  try {
    const res = await fetch('http://localhost:8080/category');
    const result = await res.json();
    const data = result.data || [];
    const select = document.getElementById('categorySelect');
    data.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      select.appendChild(opt);
    });
  } catch (e) {
    console.error('❌ Lỗi load category:', e);
  }
}

/* ========= PRODUCT SUBMIT ========= */
function saveProductId(id) { localStorage.setItem("currentProductId", id); }
function getCurrentProductId() { return productId || localStorage.getItem("currentProductId"); }

window.submitProduct = async function () {
  const name = document.getElementById('productName').value.trim();
  const description = document.getElementById('productDesc').value.trim();
  const price = parseFloat(document.getElementById('productPrice').value);
  const active = document.getElementById('productActive').value === 'true';
  const idCategory = parseInt(document.getElementById('categorySelect').value);
  const imageFile = document.getElementById('productImage').files[0];

  if (!name || !description || isNaN(price) || !idCategory || !imageFile) {
    alert('Vui lòng điền đầy đủ thông tin sản phẩm!');
    return;
  }

  const product = { name, description, price, active, idCategory };
  const formData = new FormData();
  formData.append('req', JSON.stringify(product));
  formData.append('file', imageFile);

  try {
    const response = await apiCall('/product', 'POST', formData, { isFormData: true });
    if (response.success) {
      productId = response.data;
      saveProductId(productId);
      alert('✅ Tạo sản phẩm thành công, ID: ' + response.data);
      showTab('attribute');
      await loadAttributes(); // load thuộc tính luôn
    } else {
      alert(response.message || '❌ Tạo sản phẩm thất bại!');
    }
  } catch (error) {
    console.error('❌ Lỗi khi tạo sản phẩm:', error);
    alert('Lỗi khi tạo sản phẩm!');
  }
};

window.resetForm = function () {
  document.getElementById('productName').value = '';
  document.getElementById('productDesc').value = '';
  document.getElementById('productPrice').value = '';
  document.getElementById('productActive').value = 'true';
  document.getElementById('productImage').value = '';
  document.getElementById('imagePreview').innerHTML = '';
};

/* ========= ATTRIBUTE ========= */
async function loadAttributes() {
  try {
    const res = await apiCall('/VarriantAttribute', 'GET');
    console.log("call api" ,'/VarriantAttribute' )
    const container = document.getElementById('attributeArea');
    container.innerHTML = '';

    if (!res.success || !res.data || res.data.length === 0) {
      container.innerHTML = `<div class="empty-state">
        <i class="fas fa-list-alt"></i>
        <p>Không có thuộc tính nào</p>
      </div>`;
      return;
    }

    res.data.forEach(attr => {
      const wrapper = document.createElement('div');
      wrapper.classList.add('form-group', 'attribute-item');
      wrapper.dataset.attrId = attr.id;
      wrapper.dataset.attrName = attr.attributeType;

      wrapper.innerHTML = `
        <div class="attribute-header">
          <label>
            <input type="checkbox" class="attr-checkbox"
              data-attr-id="${attr.id}" 
              data-attr-name="${attr.attributeType}"
              data-is-image="false"
              onchange="onAttrCheckboxChange(this)">
            ${attr.attributeType}
          </label>
          <label class="ml-3">
            <input type="checkbox" class="image-checkbox"
              onchange="toggleImageAttr(this)">
            Dùng làm ảnh
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
  } catch (err) {
    console.error('❌ Lỗi load thuộc tính:', err);
  }
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

/* ========= UPLOAD IMAGE FOR ATTRIBUTE VALUE ========= */
async function uploadAttrImage(input) {
  if (!input.files.length) return;
  const formData = new FormData();
  formData.append('file', input.files[0]);

  try {
    const res = await apiCall('/productVariant/image', 'POST', formData, { isFormData: true });
    const filename = (typeof res === 'string') ? res : (res.data || res.filename);

    const holder = input.closest('.attr-value-item');
    holder.dataset.image = filename;
    const label = holder.querySelector('.uploaded-filename');
    label.textContent = filename || 'Đã tải ảnh';
  } catch (e) {
    console.error('❌ Upload ảnh attribute value lỗi:', e);
    alert('Upload ảnh thất bại!');
  }
}

/* ========= GENERATE VARIANTS ========= */
function generateVariants() {
  const checked = document.querySelectorAll('.attr-checkbox:checked');
  const valuesMap = {};
  let imageAttribute = null;

  checked.forEach(cb => {
    const attrId = cb.dataset.attrId;
    const attrName = cb.dataset.attrName;
    const wrapper = cb.closest('.attribute-item');
    const valueItems = wrapper.querySelectorAll('.attr-value-item');

    const values = Array.from(valueItems).map(it => {
      const v = it.querySelector('.attr-value').value.trim();
      const img = it.dataset.image || null;
      return v ? { value: v, image: img } : null;
    }).filter(Boolean);

    if (values.length > 0) {
      valuesMap[attrId] = { name: attrName, values };
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
    const attrId = keys[idx];
    for (const val of valuesMap[attrId].values) {
      current.push({ attributeId: parseInt(attrId), attributeName: valuesMap[attrId].name, value: val.value, imageFromValue: val.image || null });
      combine(idx + 1, current);
      current.pop();
    }
  };
  combine();

  const tbody = document.querySelector('#variantTable tbody');
  tbody.innerHTML = '';

  if (variantCombinations.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6"><div class="empty-state"><i class="fas fa-box-open"></i><p>Chưa có biến thể nào</p></div></td></tr>`;
    showTab('variant');
    return;
  }

  const imageValueDone = new Set();

  variantCombinations.forEach((combo, i) => {
    const attrMap = {};
    combo.forEach(c => { attrMap[c.attributeName] = c.value; });
    const attributesText = combo.map(c => `${c.attributeName}: ${c.value}`).join(' | ');

    let imageCell = `<span>Dùng ảnh sản phẩm</span>`;
    let filenameForThisVariant = null;

    if (imageAttribute && attrMap[imageAttribute]) {
      const imgEntry = combo.find(c => c.attributeName === imageAttribute);
      const imgValue = imgEntry?.value;
      const imgFile = imgEntry?.imageFromValue || null;
      if (imgValue) {
        if (imgFile) {
          imageCell = `<span>${imgFile}</span>`;
          filenameForThisVariant = imgFile;
        } else {
          imageCell = `<span>Dùng ảnh từ ${imageAttribute}: ${imgValue}</span>`;
        }
      }
    }

    tbody.innerHTML += `
      <tr>
        <td>${attributesText}</td>
        <td><input value="SKU-${i + 1}" class="sku" /></td>
        <td><input type="number" class="price" min="0" /></td>
        <td><input type="number" class="quantity" min="0" /></td>
        <td>${imageCell}</td>
        <td><button type="button" class="btn btn-danger" onclick="removeVariant(${i})">Xóa</button></td>
      </tr>`;
    variantCombinations[i]._resolvedImage = filenameForThisVariant || null;
  });

  showTab('variant');
}

function removeVariant(idx) {
  const tbody = document.querySelector('#variantTable tbody');
  if (tbody && tbody.rows[idx]) tbody.deleteRow(idx);
}

/* ========= SUBMIT VARIANTS ========= */
async function submitVariants() {
  const currentId = getCurrentProductId();
  if (!currentId) { alert("❌ Không có productId"); return; }

  const body = [];
  const rows = document.querySelectorAll('#variantTable tbody tr');
  rows.forEach((row, i) => {
    if (row.classList.contains('empty-row')) return;
    const sku = row.querySelector('.sku').value.trim();
    const price = parseFloat(row.querySelector('.price').value) || 0;
    const quantity = parseInt(row.querySelector('.quantity').value) || 0;

    const attributes = (variantCombinations[i] || []).map(v => ({
      attributeId: v.attributeId,
      value: v.value,
      imageVariant: v.imageFromValue || null
    }));

    body.push({
      idProduct: currentId,
      sku, price, quantity,
      image: variantCombinations[i]?._resolvedImage || null,
      variant_attibute_value: attributes
    });
  });

  try {
    const res = await apiCall(`/productVariant?productId=${currentId}`, 'POST', body);
    if (res.success) {
      alert("✅ Tạo biến thể thành công!");
      showTab('product');
    } else {
      alert(res.message || "❌ Tạo biến thể thất bại!");
    }
  } catch (err) {
    console.error("❌ Lỗi khi tạo biến thể:", err);
    alert("Lỗi khi tạo biến thể!");
  }
}

/* ========= INIT ========= */
window.onload = () => {
  loadCategories();
};
