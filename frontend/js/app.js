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

async function addToCart(productId) {
    if (!currentUser) {
        showNotification('Please login to add items to cart', 'error');
        showLoginModal();
        return;
    }

    try {
        const result = await apiCall(`/cart/${currentUser.id}/add`, 'POST', {
            productId,
            quantity: 1
        });

        showNotification('Item added to cart!', 'success');
        await loadCart();
    } catch (error) {
        console.error('Failed to add to cart:', error);
    }
}

async function loadCart() {
    if (!currentUser) return;

    try {
        const result = await apiCall(`/cart/${currentUser.id}`);
        cart = result.data.items;
        updateCartUI(result.data);
    } catch (error) {
        console.error('Failed to load cart:', error);
    }
}

function updateCartUI(cartData) {
    // Update cart count in header
    const cartButton = document.querySelector('.action-btn:last-child span:last-child');
    if (cartButton) {
        cartButton.textContent = `Cart (${cartData.itemCount})`;
    }

    // You can expand this to show cart details in a modal/sidebar
}

async function removeFromCart(productId) {
    if (!currentUser) return;

    try {
        await apiCall(`/cart/${currentUser.id}/items/${productId}`, 'DELETE');
        showNotification('Item removed from cart', 'success');
        await loadCart();
    } catch (error) {
        console.error('Failed to remove from cart:', error);
    }
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

    try {
        const result = await apiCall('/auth/register', 'POST', { name, email, password });
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
                <span>${currentUser.name}</span>
            `;
            accountButton.onclick = () => {
                if (confirm('Do you want to logout?')) {
                    logout();
                }
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

/* Initialization */

document.addEventListener('DOMContentLoaded', async () => {
    console.log('FlashSale App Initialized');
    
    // Update UI based on login status
    updateUserUI();
    
    // Load products
    await loadProducts({ flashSale: true });
    
    // Load cart if user is logged in
    if (currentUser) {
        await loadCart();
    }
    
    // Setup event listeners
    setupSearch();
    setupCategoryFilters();
    startCountdownTimer();
    
    // Load analytics (optional)
    // await loadAnalytics();
    
    console.log('All components loaded successfully');
});

// Make functions globally accessible
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.showLoginModal = showLoginModal;
window.showRegisterModal = showRegisterModal;
window.closeModal = closeModal;
window.logout = logout;