// API Base URL
const API_BASE = 'http://localhost:3000/api/seller';

import { loadTopProducts, loadSalesByCategory, loadHourlySales } from './analytics.js';

// Get current user from localStorage
let currentUser = null;
try {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
} catch (e) {
    console.error('Failed to parse currentUser from localStorage:', e);
}

// Check if user is a seller
if (!currentUser || currentUser.role !== 'SELLER') {
    alert('You must be logged in as a seller to access this page');
    window.location.href = '/';
}

// Utilities
const $ = id => document.getElementById(id);

function uid(prefix='id'){ return prefix + '_' + Math.random().toString(36).slice(2,9) }

// State
let products = [];
let orders = [];
let flashSales = [];

// API Helper Functions
async function fetchProducts() {
    try {
        if (!currentUser || !currentUser.id) {
            throw new Error('No seller ID found');
        }
        
        const response = await fetch(`${API_BASE}/products?sellerId=${currentUser.id}`);
        const data = await response.json();
        if (data.success) {
            products = data.products;
            renderProducts();
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        alert('Failed to load products');
    }
}

async function fetchOrders() {
    try {
        if (!currentUser || !currentUser.id) {
            throw new Error('No seller ID found');
        }
        
        const response = await fetch(`${API_BASE}/orders?sellerId=${currentUser.id}`);
        const data = await response.json();
        if (data.success) {
            orders = data.orders;
            renderOrders();
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
        alert('Failed to load orders');
    }
}

async function fetchFlashSales() {
    try {
        if (!currentUser || !currentUser.id) {
            throw new Error('No seller ID found');
        }
        
        const response = await fetch(`${API_BASE}/flash-sales?sellerId=${currentUser.id}`);
        const data = await response.json();
        if (data.success) {
            flashSales = data.flashSales;
            renderFlashSales();
        }
    } catch (error) {
        console.error('Error fetching flash sales:', error);
        alert('Failed to load flash sales');
    }
}

// Renderers
function renderProducts(){
    const tbody = $('productsBody'); 
    tbody.innerHTML = '';
    if(!products.length){ 
        tbody.innerHTML = '<tr><td colspan="5" class="muted">No products yet.</td></tr>'; 
        return;
    }
    products.forEach(p=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div style="display:flex;align-items:center;gap:10px">
                    <img src="${p.image || 'https://via.placeholder.com/80?text=Product'}" alt="" class="img-thumb"/>
                    <div>
                        <div style="font-weight:600">${escapeHtml(p.name)}</div>
                        <div class="muted" style="font-size:12px">${escapeHtml(p.desc || '')}</div>
                    </div>
                </div>
            </td>
            <td>${formatCurrency(p.originalPrice || p.currentPrice)}</td>
            <td>${formatCurrency(p.currentPrice)}</td>
            <td>${p.stock}</td>
            <td class="right actions">
                <button class="btn ghost small" data-id="${p.id}" data-action="edit">Edit</button>
                <button class="btn danger small" data-id="${p.id}" data-action="delete">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderOrders(){
    const tbody = $('ordersBody'); 
    tbody.innerHTML = '';
    if(!orders.length){ 
        tbody.innerHTML = '<tr><td colspan="6" class="muted">No orders.</td></tr>'; 
        return;
    }
    orders.forEach(o=>{
        const tr = document.createElement('tr');
        const totalQty = (o.items || []).reduce((sum, it) => {
            return sum + (it.qty ?? it.quantity ?? 0);
        }, 0);

        tr.innerHTML = `
            <td>${escapeHtml(o.number || o.id)}</td>
            <td>${escapeHtml(o.product || '—')}</td>
            <td>${escapeHtml(o.customer || '—')}</td>
            <td>${totalQty}</td>
            <td>${formatCurrency(o.total || 0)}</td>
            <td class="right">
                <button class="btn ghost small" data-id="${o.id}" data-action="view">View</button>
                <button class="btn danger small" data-id="${o.id}" data-action="delete">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/* Flash sales rendering & handlers */
function renderFlashSales(){
    const tbody = $('flashSalesBody'); 
    tbody.innerHTML = '';
    if(!flashSales.length){
        tbody.innerHTML = '<tr><td colspan="4" class="muted">No flash sales.</td></tr>';
        return;
    }
    flashSales.forEach(f=>{
        const tr = document.createElement('tr');
        const start = f.start_time ? new Date(f.start_time).toLocaleString() : '—';
        const end = f.end_time || f.flashSaleEnd ? new Date(f.end_time || f.flashSaleEnd).toLocaleString() : '—';
        tr.innerHTML = `
            <td style="font-weight:600">${escapeHtml(f.name)}</td>
            <td>${escapeHtml(start)}</td>
            <td>${escapeHtml(end)}</td>
            <td class="right">
                <button class="btn ghost small" data-id="${f.id}" data-action="view-flash">View</button>
                <button class="btn danger small" data-id="${f.id}" data-action="delete-flash">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Helpers
function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }
function formatCurrency(n){ return '$' + Number(n).toFixed(2) }

// Modal controls
const productModal = $('productModal'), orderModal = $('orderModal');
function openProductModal(editProduct){
    $('productForm').reset();
    if(editProduct){
        $('modalTitle').textContent = 'Edit Product';
        $('productId').value = editProduct.id;
        $('productName').value = editProduct.name;
        $('productCategory').value = editProduct.category || '';
        $('productOriginalPrice').value = editProduct.originalPrice || editProduct.currentPrice;
        $('productPrice').value = editProduct.currentPrice;
        $('productStock').value = editProduct.stock;
        $('productImage').value = editProduct.image || '';
        $('productDesc').value = editProduct.desc || '';
    } else {
        $('modalTitle').textContent = 'Add Product';
        $('productId').value = '';
    }
    productModal.classList.remove('hidden');
}
function closeProductModal(){ productModal.classList.add('hidden') }

// Product actions
$('addProductBtn').addEventListener('click', ()=> openProductModal(null));
$('cancelModal').addEventListener('click', closeProductModal);
$('productForm').addEventListener('submit', async e=>{
    e.preventDefault();
    const id = $('productId').value;
    const name = $('productName').value.trim();
    const category = $('productCategory').value.trim();
    const originalPrice = parseFloat($('productOriginalPrice').value) || 0;
    const price = parseFloat($('productPrice').value) || 0;
    const stock = parseInt($('productStock').value) || 0;
    const image = $('productImage').value.trim();
    const desc = $('productDesc').value.trim();
    
    if(!name){ alert('Product name is required'); return }
    if(!currentUser || !currentUser.id){ alert('Seller ID not found'); return }

    try {
        const productData = {
            name,
            category,
            originalPrice,
            price,
            discount: originalPrice > price ? ((originalPrice - price) / originalPrice * 100).toFixed(2) : 0,
            stock,
            image,
            desc,
            sellerId: currentUser.id // Add seller ID
        };

        let response;
        if(id){
            // Edit product
            response = await fetch(`${API_BASE}/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
        } else {
            // Add product
            response = await fetch(`${API_BASE}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
        }

        const data = await response.json();
        if(data.success){
            await fetchProducts();
            closeProductModal();
        } else {
            alert(data.message || 'Failed to save product');
        }
    } catch (error) {
        console.error('Error saving product:', error);
        alert('Failed to save product');
    }
});

// Click delegation for product table
$('productsBody').addEventListener('click', async e=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    
    if(action === 'edit'){
        const p = products.find(x=>x.id == id);
        if(p) openProductModal(p);
    } else if(action === 'delete'){
        if(confirm('Delete this product?')) {
            try {
                const response = await fetch(`${API_BASE}/products/${id}?sellerId=${currentUser.id}`, {
                    method: 'DELETE'
                });
                const data = await response.json();
                if(data.success){
                    await fetchProducts();
                } else {
                    alert(data.message || 'Failed to delete product');
                }
            } catch (error) {
                console.error('Error deleting product:', error);
                alert('Failed to delete product');
            }
        }
    }
});

// Orders interactions
$('ordersBody').addEventListener('click', async e=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    const o = orders.find(x=>x.id == id);
    
    if(action === 'view' && o){
        openOrderModal(o);
    } else if(action === 'delete' && o){
        if(confirm('Delete this order?')) {
            try {
                const response = await fetch(`${API_BASE}/orders/${id}?sellerId=${currentUser.id}`, {
                    method: 'DELETE'
                });
                const data = await response.json();
                if(data.success){
                    await fetchOrders();
                    closeOrderModal();
                } else {
                    alert(data.message || 'Failed to delete order');
                }
            } catch (error) {
                console.error('Error deleting order:', error);
                alert('Failed to delete order');
            }
        }
    }
});

function openOrderModal(order){
    $('orderDetails').innerHTML = `
        <div style="font-weight:600">${escapeHtml(order.number || order.id)} — ${escapeHtml(order.customer || 'N/A')}</div>
        <div class="muted" style="margin-top:6px">Total: ${formatCurrency(order.total || 0)}</div>
        <div style="margin-top:8px">${(order.items || []).map(it=>`<div>${escapeHtml(it.name)} × ${it.qty || it.quantity} — ${formatCurrency(it.price || 0)}</div>`).join('')}</div>
        <div class="muted" style="margin-top:8px">Note: ${escapeHtml(order.note||'—')}</div>
    `;
    orderModal.dataset.current = order.id;
    orderModal.classList.remove('hidden');
}

function closeOrderModal(){ 
    orderModal.classList.add('hidden'); 
    orderModal.dataset.current = ''; 
}

$('closeOrder').addEventListener('click', closeOrderModal);
$('deleteOrderBtn').addEventListener('click', async ()=>{
    const id = orderModal.dataset.current;
    if(!id) return;
    if(confirm('Delete this order?')){
        try {
            const response = await fetch(`${API_BASE}/orders/${id}?sellerId=${currentUser.id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if(data.success){
                await fetchOrders();
                closeOrderModal();
            } else {
                alert(data.message || 'Failed to delete order');
            }
        } catch (error) {
            console.error('Error deleting order:', error);
            alert('Failed to delete order');
        }
    }
});

// Flash sale modal controls
const flashSaleModal = $('flashSaleModal');
function openFlashSaleModal(edit){
    $('flashSaleForm').reset();
    $('flashSaleProducts').innerHTML = '';
    
    // render product checkboxes
    products.forEach(p=>{
        const id = p.id;
        const checked = edit && (edit.products || []).includes(id) ? 'checked' : '';
        const line = document.createElement('div');
        line.innerHTML = `<label style="display:flex;align-items:center;gap:8px"><input type="checkbox" value="${id}" ${checked}/> ${escapeHtml(p.name)} <span class="muted" style="margin-left:8px">(${p.stock} in stock)</span></label>`;
        $('flashSaleProducts').appendChild(line);
    });

    if(edit){
        $('flashModalTitle').textContent = 'Edit Flash Sale';
        $('flashSaleId').value = edit.id;
        $('flashSaleName').value = edit.name || '';
        if(edit.start_time) $('flashSaleStart').value = toDatetimeLocal(edit.start_time);
        if(edit.end_time || edit.flashSaleEnd) $('flashSaleEnd').value = toDatetimeLocal(edit.end_time || edit.flashSaleEnd);
    } else {
        $('flashModalTitle').textContent = 'Add Flash Sale';
        $('flashSaleId').value = '';
    }
    flashSaleModal.classList.remove('hidden');
}

function closeFlashSaleModal(){ 
    flashSaleModal.classList.add('hidden'); 
    $('flashSaleId').value = ''; 
}

// helper: convert ISO to input datetime-local value
function toDatetimeLocal(iso){
    const d = new Date(iso);
    const pad = n => String(n).padStart(2,'0');
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth()+1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
}

// open modal
$('addFlashSaleBtn').addEventListener('click', ()=> openFlashSaleModal(null));
$('cancelFlashSale').addEventListener('click', closeFlashSaleModal);

// submit flash sale
$('flashSaleForm').addEventListener('submit', async e=>{
    e.preventDefault();
    const id = $('flashSaleId').value;
    const name = $('flashSaleName').value.trim();
    const startVal = $('flashSaleStart').value;
    const endVal = $('flashSaleEnd').value;
    const selected = Array.from($('flashSaleProducts').querySelectorAll('input[type="checkbox"]:checked')).map(i=>i.value);
    
    if(!name){ alert('Name required'); return }
    if(!startVal || !endVal){ alert('Start and end times required'); return }
    
    try {
        const flashSaleData = {
            name,
            startTime: new Date(startVal).toISOString(),
            endTime: new Date(endVal).toISOString(),
            productIds: selected,
            sellerId: currentUser.id // Add sellerId
        };

        const response = await fetch(`${API_BASE}/flash-sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(flashSaleData)
        });

        const data = await response.json();
        if(data.success){
            await fetchFlashSales();
            await fetchProducts();
            closeFlashSaleModal();
        } else {
            alert(data.message || 'Failed to create flash sale');
        }
    } catch (error) {
        console.error('Error creating flash sale:', error);
        alert('Failed to create flash sale');
    }
});

// flash sales table actions (view, delete)
$('flashSalesBody').addEventListener('click', async e=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    const f = flashSales.find(x=>x.id == id);
    
    if(action === 'view-flash' && f){
        const productNames = (f.products || []).map(pid => {
            const p = products.find(x=>x.id == pid);
            return p ? escapeHtml(p.name) : '(missing)';
        }).join('<br/>') || 'No products selected';
        
        $('orderDetails').innerHTML = `
            <div style="font-weight:600">${escapeHtml(f.name)}</div>
            <div class="muted" style="margin-top:6px">Starts: ${new Date(f.start_time).toLocaleString()}</div>
            <div class="muted">Ends: ${new Date(f.end_time || f.flashSaleEnd).toLocaleString()}</div>
            <div style="margin-top:8px"><strong>Products</strong><div style="margin-top:6px">${productNames}</div></div>
        `;
        orderModal.dataset.current = f.id;
        orderModal.classList.remove('hidden');
    } else if(action === 'delete-flash' && f){
        if(confirm('Delete this flash sale?')) {
            try {
                const response = await fetch(`${API_BASE}/flash-sales/${id}?sellerId=${currentUser.id}`, {
                    method: 'DELETE'
                });
                const data = await response.json();
                if(data.success){
                    await fetchFlashSales();
                    await fetchProducts();
                } else {
                    alert(data.message || 'Failed to delete flash sale');
                }
            } catch (error) {
                console.error('Error deleting flash sale:', error);
                alert('Failed to delete flash sale');
            }
        }
    }
});

// Close modal on background click
[productModal, orderModal, flashSaleModal].forEach(mod=>{
    mod.addEventListener('click', e=>{
        if(e.target === mod) mod.classList.add('hidden');
    });
});

// Initial render - fetch data from API
(async function init() {
    await fetchProducts();
    await fetchOrders();
    await fetchFlashSales();
})();

document.addEventListener('DOMContentLoaded', async () => {
    let currentUser = null;
    try { currentUser = JSON.parse(localStorage.getItem('currentUser')); } 
    catch(e){ console.error(e); }

    if (!currentUser || currentUser.role !== 'SELLER') return;

    const sellerId = currentUser.id;

    await loadTopProducts(sellerId);
    await loadSalesByCategory(sellerId);
    await loadHourlySales(sellerId);
});