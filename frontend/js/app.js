// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Current user (stored in localStorage)
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let cart = [];

/* Utility Functions */

// API call function
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'API request failed');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        showNotification(error.message, 'error');
        throw error;
    }
}

// Show notification
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Format currency
function formatCurrency(amount) {
    return `₱${amount.toLocaleString()}`;
}

/* Product Functions */

async function loadProducts(filters = {}) {
    try {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = `/products${queryParams ? '?' + queryParams : ''}`;
        const result = await apiCall(endpoint);
        
        displayProducts(result.data);
        return result.data;
    } catch (error) {
        console.error('Failed to load products:', error);
    }
}

function displayProducts(products) {
    const productsGrid = document.querySelector('.products-grid');
    if (!productsGrid) return;

    productsGrid.innerHTML = products.map(product => `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-badge">FLASH SALE</div>
            <div class="product-image"></div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price">
                    <span class="current-price">${formatCurrency(product.currentPrice)}</span>
                    <span class="original-price">${formatCurrency(product.originalPrice)}</span>
                    <span class="discount-rate">-${product.discount}%</span>
                </div>
                <div class="product-sold">${product.sold} sold</div>
                <div class="product-stock">Stock: ${product.stock}</div>
                <button class="add-to-cart" onclick="addToCart(${product.id})">
                    Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

// =============================================
// CART FUNCTIONS
// =============================================

/* Cart Functions */

async function removeFromCart(pid) {
    if (!currentUser) return;
    try {
        await apiCall(`/cart/${currentUser.id}/items/${pid}`, 'DELETE');
        showNotification('Removed from cart');
        await loadCart();
        closeCartModal();
        showCartModal(); // Reopen to show updated cart
    } catch (err) {
        showNotification('Remove failed', 'error');
    }
}

async function addToCart(pid) {
    if (!currentUser) {
        showLoginModal();
        return;
    }
    try {
        await apiCall(`/cart/${currentUser.id}/add`, 'POST', { productId: pid });
        showNotification('Added to cart');
        await loadCart();
    } catch (err) {
        showNotification(err.message || 'Failed to add', 'error');
    }
}

async function loadCart() {
    if (!currentUser) return;
    try {
        const res = await apiCall(`/cart/${currentUser.id}`);
        cart = res.data.items;
        updateCartUI(res.data);
    } catch (err) {
        console.error(err);
    }
}

function updateCartUI(cartData) {
    // Update cart count in header
    const cartButton = document.querySelector('.action-btn:last-child');
    if (cartButton) {
        const span = cartButton.querySelector('span:last-child');
        if (span) span.textContent = `Cart (${cartData.itemCount})`;
        
        // Add click handler to show cart modal
        cartButton.onclick = () => showCartModal();
    }
}

function showCartModal() {
    if (!currentUser) {
        showLoginModal();
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'cart-modal';
    modal.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.5);
    `;

    const cartItems = cart.map(item => {
        const product = item.product;
        const pid = product.product_id || product.id;
        const subtotal = product.currentPrice * item.quantity;

        return `
            <div class="cart-item" data-product-id="${pid}" style="display:flex;gap:12px;padding:12px;border-bottom:1px solid #eee;align-items:center">
                <div class="cart-item-image" style="width:60px;height:60px;background:#f5f5f5;border-radius:6px"></div>
                <div style="flex:1">
                    <div style="font-weight:600;margin-bottom:4px">${product.product_name || product.name}</div>
                    <div style="color:#d93025;font-weight:600">${formatCurrency(product.currentPrice)}</div>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                    <button onclick="adjustLocalQty(${pid}, -1)" 
                            style="width:28px;height:28px;border:1px solid #ddd;background:#fff;border-radius:4px;cursor:pointer">−</button>
                    <input type="number" value="${item.quantity}" min="1"
                           oninput="clampLocalQty(this, ${pid})"
                           style="width:56px;text-align:center;border:1px solid #ddd;border-radius:4px;padding:4px">
                    <button onclick="adjustLocalQty(${pid}, 1)" 
                            style="width:28px;height:28px;border:1px solid #ddd;background:#fff;border-radius:4px;cursor:pointer">+</button>
                </div>
                <div style="min-width:90px;text-align:right;font-weight:600">${formatCurrency(subtotal)}</div>
                <button onclick="removeFromCart(${pid})" 
                        style="color:#d93025;background:none;border:none;cursor:pointer;font-size:18px">×</button>
            </div>
        `;
    }).join('');

    const total = cart.reduce((sum, item) => sum + (item.product.currentPrice * item.quantity), 0);

    modal.innerHTML = `
        <div style="background:#fff;border-radius:12px;max-width:600px;width:90%;max-height:80vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,0.3)">
            <div style="padding:16px 20px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center">
                <h2 style="margin:0;font-size:18px">Shopping Cart</h2>
                <button onclick="closeCartModal()" style="background:none;border:none;font-size:24px;cursor:pointer;color:#666;line-height:1">×</button>
            </div>
            
            <div style="flex:1;overflow-y:auto;padding:12px 20px">
                ${cart.length ? cartItems : '<div style="text-align:center;padding:40px;color:#999">Your cart is empty</div>'}
            </div>
            
            ${cart.length ? `
                <div style="padding:16px 20px;border-top:1px solid #eee">
                    <div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:16px">
                        <span>Total:</span>
                        <span style="font-weight:700;font-size:20px;color:#d93025">${formatCurrency(total)}</span>
                    </div>
                    <button onclick="handleCheckout()" 
                            style="width:100%;padding:12px;background:#d93025;color:#fff;border:none;border-radius:6px;font-size:16px;font-weight:600;cursor:pointer;transition:background 0.3s">
                        Proceed to Checkout
                    </button>
                </div>
            ` : ''}
        </div>
    `;

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeCartModal();
    });

    document.body.appendChild(modal);
}

function closeCartModal() {
    document.querySelector('.cart-modal')?.remove();
}

// Local-only helpers (no max stock clamp)
function clampLocalQty(inputEl, pid){
    let val = parseInt(inputEl.value || '1', 10);
    if (isNaN(val) || val < 1) val = 1; // only enforce >=1
    inputEl.value = val;

    const item = cart.find(it => (it.product.product_id || it.product.id) === pid);
    if (item) item.quantity = val;
}

function adjustLocalQty(pid, delta){
    const row = document.querySelector(`.cart-item[data-product-id="${pid}"]`);
    const inputEl = row?.querySelector('input[type="number"]');
    if (!inputEl) return;
    let val = parseInt(inputEl.value || '1', 10) + delta;
    if (isNaN(val) || val < 1) val = 1; // only enforce >=1
    inputEl.value = val;

    const item = cart.find(it => (it.product.product_id || it.product.id) === pid);
    if (item) item.quantity = val;
}

// Replace handleCheckout with this version (abort on insufficient stock)
async function handleCheckout() {
    if (!currentUser || cart.length === 0) return;

    try {
        const inputs = document.querySelectorAll('.cart-item input[type="number"]');

        // Sync each quantity; abort immediately on failure
        for (const inp of inputs) {
            const productId = Number(inp.closest('.cart-item').dataset.productId);
            const quantity = Math.max(1, parseInt(inp.value || '1'));

            try {
                await apiCall(`/cart/${currentUser.id}/items/${productId}`, 'PATCH', { quantity });
            } catch (err) {
                // If stock error, stop and do not open order preview
                showNotification(err.message || 'Failed to update quantity', 'error');
                return;
            }
        }

        // Refresh cart after successful updates
        await loadCart();

        // Proceed only if all updates succeeded
        showOrderPreview();
    } catch (error) {
        showNotification(error.message || 'Checkout failed', 'error');
    }
}

async function updateCartQuantity(productId, newQuantity) {
    if (!currentUser) return;
    
    newQuantity = parseInt(newQuantity);
    
    if (newQuantity < 1) {
        await removeFromCart(productId);
        return;
    }

    try {
        await apiCall(`/cart/${currentUser.id}/items/${productId}`, 'PATCH', { quantity: newQuantity });
        await loadCart();
        closeCartModal();
        showCartModal(); // Reopen to show updated quantities
    } catch (error) {
        showNotification('Failed to update quantity', 'error');
    }
}

// Local pre-check using data already in cart (stock and flashSaleEnd)
function cartIsValid() {
    for (const item of cart) {
        const p = item.product;
        const stock = Number(p.stock ?? p.quantity_stock ?? 0);
        const end = p.flashSaleEnd ? new Date(p.flashSaleEnd) : null;

        if (stock < item.quantity) {
            showNotification(`Insufficient stock for ${p.product_name || p.name}. Available: ${stock}, In cart: ${item.quantity}`, 'error');
            return false;
        }
        if (end && end < new Date()) {
            showNotification(`Flash sale ended for ${p.product_name || p.name}`, 'error');
            return false;
        }
    }
    return true;
}



async function confirmOrder() {
    if (!currentUser) return;

    // Re-check locally
    if (!cartIsValid()) { closeOrderPreview(); return; }

    try {
        // Revalidate with server before placing order
        const validation = await apiCall('/cart/validate', 'POST', {
            userId: currentUser.id,
            items: cart.map(item => ({
                productId: item.product.product_id || item.product.id,
                quantity: item.quantity
            }))
        });
        if (!validation.success) {
            showNotification(validation.message, 'error');
            closeOrderPreview();
            return; // Do not save order
        }

        // Proceed to create order only when valid
        const orderData = {
            userId: currentUser.id,
            items: cart.map(item => ({
                productId: item.product.product_id || item.product.id,
                quantity: item.quantity,
                price: item.product.currentPrice
            })),
            shippingAddress: 'Default Address',
            paymentMethod: 'Cash on Delivery'
        };
        const result = await apiCall('/orders', 'POST', orderData);
        if (result.success) {
            showNotification('Order placed successfully', 'success');
            closeOrderPreview();
            closeCartModal();
            setTimeout(() => window.location.reload(), 1200);
        }
    } catch (err) {
        showNotification(err.message || 'Order failed', 'error');
    }
}

// Show order preview modal (second step)
function showOrderPreview() {
    // Remove existing preview if any
    document.querySelector('.order-preview-modal')?.remove();

    const total = cart.reduce((sum, item) => sum + (item.product.currentPrice * item.quantity), 0);
    const modal = document.createElement('div');
    modal.className = 'order-preview-modal';
    modal.style.cssText = `
        position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;
        background:rgba(0,0,0,.55);
    `;

    const itemsHtml = cart.map(item => {
        const p = item.product;
        return `
            <tr>
                <td style="padding:8px">${p.product_name || p.name}</td>
                <td style="padding:8px;text-align:center">${item.quantity}</td>
                <td style="padding:8px;text-align:right">${formatCurrency(p.currentPrice)}</td>
                <td style="padding:8px;text-align:right">${formatCurrency(p.currentPrice * item.quantity)}</td>
            </tr>
        `;
    }).join('');

    modal.innerHTML = `
        <div style="background:#fff;border-radius:12px;width:90%;max-width:640px;max-height:80vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 8px 30px rgba(0,0,0,.35)">
            <div style="padding:16px 20px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center">
                <h2 style="margin:0;font-size:18px">Order Review</h2>
                <button onclick="closeOrderPreview()" style="background:none;border:none;font-size:24px;color:#666;cursor:pointer;line-height:1">×</button>
            </div>
            <div style="padding:14px 20px;overflow-y:auto">
                <table style="width:100%;border-collapse:collapse;font-size:14px">
                    <thead>
                        <tr style="background:#fafafa">
                            <th style="text-align:left;padding:8px">Product</th>
                            <th style="text-align:center;padding:8px">Qty</th>
                            <th style="text-align:right;padding:8px">Price</th>
                            <th style="text-align:right;padding:8px">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>${itemsHtml}</tbody>
                </table>
                <div style="margin-top:16px;display:flex;justify-content:space-between;font-size:16px;font-weight:600">
                    <span>Total:</span>
                    <span style="color:#d93025">${formatCurrency(total)}</span>
                </div>
                <div style="margin-top:14px;font-size:12px;color:#555">
                    Flash sale items will be revalidated. Orders failing constraints (ended sale / insufficient stock) will abort.
                </div>
            </div>
            <div style="padding:16px 20px;border-top:1px solid #eee;display:flex;gap:10px">
                <button onclick="closeOrderPreview()" style="flex:1;padding:12px;background:#eee;border:none;border-radius:6px;cursor:pointer;font-weight:600">Back</button>
                <button onclick="confirmOrder()" style="flex:1;padding:12px;background:#d93025;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600">Confirm Order</button>
            </div>
        </div>
    `;

    modal.addEventListener('click', e => { if (e.target === modal) closeOrderPreview(); });
    document.body.appendChild(modal);
}

function closeOrderPreview() {
    document.querySelector('.order-preview-modal')?.remove();
}



/* Authentication Functions */

function showLoginModal() {
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeModal()"></div>
        <div class="modal-content">
            <button class="modal-close" onclick="closeModal()">×</button>
            <h2>Login</h2>
            <form id="loginForm" onsubmit="handleLogin(event)">
                <input type="email" id="loginEmail" placeholder="Email" required>
                <input type="password" id="loginPassword" placeholder="Password" required>
                <button type="submit">Login</button>
            </form>
            <p>Don't have an account? <a href="#" onclick="showRegisterModal()">Register</a></p>
        </div>
    `;
    
    // Add modal styles
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
    `;
    
    document.body.appendChild(modal);
}

function showRegisterModal() {
    closeModal();
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeModal()"></div>
        <div class="modal-content">
            <button class="modal-close" onclick="closeModal()">×</button>
            <h2>Register</h2>
            <form id="registerForm" onsubmit="handleRegister(event)">
                <input type="text" id="registerName" placeholder="Full Name" required>
                <input type="email" id="registerEmail" placeholder="Email" required>
                <input type="password" id="registerPassword" placeholder="Password" required>
                <select id="registerRole" required style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px;">
                    <option value="">Select Role</option>
                    <option value="BUYER">Buyer</option>
                    <option value="SELLER">Seller</option>
                </select>
                <button type="submit">Register</button>
            </form>
            <p>Already have an account? <a href="#" onclick="showLoginModal()">Login</a></p>
        </div>
    `;
    
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
    `;
    
    document.body.appendChild(modal);
}

function closeModal() {
    const modal = document.querySelector('.auth-modal');
    if (modal) modal.remove();
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const result = await apiCall('/auth/login', 'POST', { email, password });
        currentUser = result.data;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showNotification('Login successful!', 'success');
        closeModal();
        updateUserUI();
        await loadCart();
    } catch (error) {
        showNotification('Login failed. Please check your credentials.', 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('registerRole').value;

    if (!role) {
        showNotification('Please select a role', 'error');
        return;
    }

    try {
        const result = await apiCall('/auth/register', 'POST', { name, email, password, role });
        currentUser = result.data;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showNotification('Registration successful!', 'success');
        closeModal();
        updateUserUI();
        await loadCart();
    } catch (error) {
        showNotification('Registration failed. Please try again.', 'error');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    cart = [];
    showNotification('Logged out successfully', 'success');
    updateUserUI();
}

function updateUserUI() {
    const accountButton = document.querySelector('.action-btn:first-child');
    if (accountButton) {
        if (currentUser) {
            accountButton.innerHTML = `
                <span class="action-icon">👤</span>
                <span>${currentUser.name} (${currentUser.role})</span>
            `;
            accountButton.onclick = () => {
                // Show options menu
                const menu = document.createElement('div');
                menu.style.cssText = `
                    position: absolute;
                    top: 50px;
                    right: 20px;
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    padding: 10px;
                    z-index: 9000;
                `;
                
                let menuContent = '';
                
                if (currentUser.role === 'SELLER') {
                    menuContent += `<button onclick="window.location.href='/seller'" style="display: block; width: 100%; padding: 10px; margin: 5px 0; background: #1f6feb; color: white; border: none; border-radius: 5px; cursor: pointer;">Seller Dashboard</button>`;
                }
                
                menuContent += `<button onclick="logout(); document.body.removeChild(this.parentElement)" style="display: block; width: 100%; padding: 10px; margin: 5px 0; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer;">Logout</button>`;
                
                menu.innerHTML = menuContent;
                
                // Remove existing menu if any
                const existingMenu = document.querySelector('.user-menu');
                if (existingMenu) existingMenu.remove();
                
                menu.className = 'user-menu';
                document.body.appendChild(menu);
                
                // Close menu when clicking outside
                setTimeout(() => {
                    document.addEventListener('click', function closeMenu(e) {
                        if (!menu.contains(e.target) && !accountButton.contains(e.target)) {
                            menu.remove();
                            document.removeEventListener('click', closeMenu);
                        }
                    });
                }, 100);
            };
        } else {
            accountButton.innerHTML = `
                <span class="action-icon">👤</span>
                <span>Account</span>
            `;
            accountButton.onclick = showLoginModal;
        }
    }
}

/* Search Functionality */

function setupSearch() {
    const searchButton = document.querySelector('.search-bar button');
    const searchInput = document.querySelector('.search-bar input');

    if (searchButton && searchInput) {
        searchButton.addEventListener('click', () => {
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                loadProducts({ search: searchTerm });
            }
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = searchInput.value.trim();
                if (searchTerm) {
                    loadProducts({ search: searchTerm });
                }
            }
        });
    }
}

/* Category Filtering */

function setupCategoryFilters() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.textContent.trim();
            if (category === 'All Categories') {
                loadProducts();
            } else {
                loadProducts({ category });
            }
        });
    });
}

/* Countdown Timer */

function startCountdownTimer() {
    const timerElement = document.querySelector('.countdown-timer');
    if (!timerElement) return;

    // TEMPORARILY Set end time (2.5 hours from now)
    const endTime = new Date(Date.now() + 2.5 * 60 * 60 * 1000);

    function updateTimer() {
        const now = new Date();
        const timeLeft = endTime - now;

        if (timeLeft <= 0) {
            timerElement.textContent = '00:00:00';
            return;
        }

        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        timerElement.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    updateTimer();
    setInterval(updateTimer, 1000);
}

// Make functions globally available
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.showLoginModal = showLoginModal;
window.showRegisterModal = showRegisterModal;
window.closeModal = closeModal;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.logout = logout;
window.closeCartModal = closeCartModal;
window.updateCartQuantity = updateCartQuantity;
window.handleCheckout = handleCheckout;
window.confirmOrder = confirmOrder;
window.closeOrderPreview = closeOrderPreview;
window.adjustLocalQty = adjustLocalQty;
window.clampLocalQty = clampLocalQty;

/* Initialization */
document.addEventListener('DOMContentLoaded', async () => {
    updateUserUI();
    await loadProducts({ flashSale: true }); // optional, or remove if using new list
    await loadFlashSalesWithProducts();      // load grouped flash sales
    if (currentUser) await loadCart();
    setupSearch();
    setupCategoryFilters();
    startCountdownTimer();
});

async function loadFlashSalesWithProducts(){
    try{
        const res = await apiCall('/flash-sales');
        renderFlashSalesList(res.data || []);
    }catch(e){
        console.error('Failed to load flash sales', e);
    }
}

function renderFlashSalesList(sales){
    const section = document.querySelector('.flash-sale-section .products-grid');
    if(!section) return;

    section.innerHTML = sales.length ? sales.map(sale => `
        <div class="flash-sale-block" data-sale-id="${sale.id}" style="grid-column:1/-1; position:relative;">
          <div class="section-header" style="display:flex;align-items:center;gap:12px;margin:10px 0;">
            <div class="section-title" style="font-weight:600;display:flex;align-items:center;gap:10px">
              <span>⚡ ${sale.name}</span>
              <span class="countdown"
                    data-end="${new Date(sale.end_time).toISOString()}"
                    style="font-size:14px;font-weight:700;color:#d93025;background:#ffe7e6;padding:4px 8px;border-radius:6px">00:00:00</span>
            </div>
            <span class="end-date" 
                  style="margin-left:auto;font-size:12px;color:#555">Ends: ${new Date(sale.end_time).toLocaleString()}</span>
          </div>
          <div class="products-grid" style="grid-template-columns:repeat(6,minmax(0,1fr));gap:16px">
            ${ (sale.products && sale.products.length)
              ? sale.products.map(p => `
                <div class="product-card">
                  <div class="product-badge">FLASH SALE</div>
                  <div class="product-image"></div>
                  <div class="product-info">
                    <div class="product-name">${p.name}</div>
                    <div class="product-price">
                      <span class="current-price">${formatCurrency(Number(p.currentPrice))}</span>
                      ${p.originalPrice && Number(p.originalPrice)>Number(p.currentPrice)
                        ? `<span class="original-price">${formatCurrency(Number(p.originalPrice))}</span>
                           <span class="discount-rate">-${p.discount}%</span>` : ''}
                    </div>
                    <div class="product-stock">Stock: ${p.stock}</div>
                    <button class="add-to-cart" onclick="addToCart(${p.id})">Add to Cart</button>
                  </div>
                </div>
              `).join('')
              : '<div class="muted" style="grid-column:1/-1">No products in this flash sale.</div>'
            }
          </div>
        </div>
    `).join('') : '<div class="muted" style="grid-column:1/-1">No flash sales.</div>';

    startFlashSaleCountdowns();
}

function startFlashSaleCountdowns(){
    const nodes = document.querySelectorAll('.flash-sale-block .countdown');
    if (!nodes.length) return;

    function fmt(ms){
        if (ms <= 0) return '00:00:00';
        const s = Math.floor(ms/1000);
        const h = Math.floor(s/3600);
        const m = Math.floor((s%3600)/60);
        const sec = s%60;
        return [h,m,sec].map(n=>String(n).padStart(2,'0')).join(':');
    }

    function tick(){
        nodes.forEach(el=>{
            const endISO = el.dataset.end;
            const end = new Date(endISO).getTime();
            const left = end - Date.now();
            el.textContent = fmt(left);
            if (left <= 0) el.textContent = 'Ended';
        });
    }

    tick();
    // Clear any previous interval if you track it globally (optional)
    if (window.__flashCountdownInterval) clearInterval(window.__flashCountdownInterval);
    window.__flashCountdownInterval = setInterval(tick, 1000);
}