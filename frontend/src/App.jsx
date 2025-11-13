import React, { useState, useMemo } from 'react';

// --- Lucide React Icons (for a cleaner UI) ---
// We are embedding SVG strings directly to keep this a single file.
// In a real app, you would 'npm install lucide-react' and import them.
const ShoppingCartIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const PackageIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16.5 9.4l-9-5.19" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const LayoutDashboardIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const HomeIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const ChevronLeftIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const SparkleIcon = ({ className }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2L14.39 8.39L21 9.61L16.42 14.58L17.61 21L12 17.61L6.39 21L7.58 14.58L3 9.61L9.61 8.39L12 2z" />
    </svg>
);


// ======================================================================
// TODO: UPDATE THE DATA IN BACKEND.
// This is dummy data mocked to match your OLTP and OLAP schemas.
// In a real app, this data would be fetched from your API.
// ======================================================================
const dummyData = {
  // --- OLTP Data (Transactional) ---
  users: [
    { user_id: 1, name: 'Alice (Buyer)', email: 'alice@example.com', role: 'BUYER' },
    { user_id: 2, name: 'Bob (Seller)', email: 'bob@example.com', role: 'SELLER' },
    { user_id: 3, name: 'Charlie (Seller)', email: 'charlie@example.com', role: 'SELLER' },
  ],

  flash_sales: [
    { flash_sale_id: 1, name: "Morning Madness", start_time: '2025-11-13T09:00:00Z', end_time: '2025-11-13T12:00:00Z' },
    { flash_sale_id: 2, name: "Midnight Deals", start_time: '2025-11-14T00:00:00Z', end_time: '2025-11-14T02:00:00Z' },
  ],

  products: [
    { product_id: 101, seller_id: 2, name: 'Premium Wireless Mouse', category: 'Electronics', price: 29.99, original_price: 39.99, discount_rate: 0.25, quantity_stock: 100, flash_sale_id: 1 },
    { product_id: 102, seller_id: 3, name: 'Artisan Coffee Mug', category: 'Homeware', price: 15.00, original_price: 15.00, discount_rate: 0, quantity_stock: 50, flash_sale_id: null },
    { product_id: 103, seller_id: 2, name: 'Mechanical Keyboard', category: 'Electronics', price: 120.00, original_price: 120.00, discount_rate: 0, quantity_stock: 30, flash_sale_id: null },
    { product_id: 104, seller_id: 3, name: 'Organic Green Tea (50 bags)', category: 'Groceries', price: 9.99, original_price: 9.99, discount_rate: 0, quantity_stock: 200, flash_sale_id: null },
    { product_id: 105, seller_id: 2, name: '4K Ultrawide Monitor', category: 'Electronics', price: 499.99, original_price: 699.99, discount_rate: 0.28, quantity_stock: 10, flash_sale_id: 1 },
    { product_id: 106, seller_id: 3, name: 'Scented Soy Candle', category: 'Homeware', price: 22.50, original_price: 22.50, discount_rate: 0, quantity_stock: 80, flash_sale_id: null },
  ],

  cart_items: [
    { cart_item_id: 1, user_id: 1, product_id: 101, quantity_added: 1 },
    { cart_item_id: 2, user_id: 1, product_id: 102, quantity_added: 2 },
  ],

  orders: [
    { order_id: 1001, buyer_id: 1, created_at: '2025-11-12T14:30:00Z' },
  ],

  order_items: [
    { order_item_id: 1, order_id: 1001, product_id: 104, quantity_sold: 2 },
    { order_item_id: 2, order_id: 1001, product_id: 106, quantity_sold: 1 },
  ],

  // --- OLAP Data (Mocked Analytical Reports) ---
  // These would be generated by your backend from the 'fact_orders' table.
  
  // Report 1: Top 10 Selling Items/Products
  report_topSellingItems: [
    { product_name: 'Organic Green Tea (50 bags)', total_sold: 150 },
    { product_name: 'Artisan Coffee Mug', total_sold: 120 },
    { product_name: 'Premium Wireless Mouse', total_sold: 95 },
    { product_name: 'Scented Soy Candle', total_sold: 80 },
    { product_name: 'Mechanical Keyboard', total_sold: 45 },
    { product_name: '4K Ultrawide Monitor', total_sold: 20 },
  ],

  // Report 2: Sales by Product/Category
  report_salesByCategory: [
    { category: 'Electronics', total_sales: 17899.75 },
    { category: 'Homeware', total_sales: 6300.00 },
    { category: 'Groceries', total_sales: 1498.50 },
  ],

  // Report 3: Flash Sale Performance (Sell-through rate, peak time graph)
  report_flashSalePerformance: [
    // Data for "Morning Madness" (flash_sale_id: 1)
    { flash_sale_name: "Morning Madness", hour: 9, quantity_sold: 50 },
    { flash_sale_name: "Morning Madness", hour: 10, quantity_sold: 35 },
    { flash_sale_name: "Morning Madness", hour: 11, quantity_sold: 10 },
  ],
};
// ======================================================================
// END OF DUMMY DATA
// ======================================================================

// --- Current User ---
// Hardcoded for this prototype. In a real app, this would come from an auth context.
const CURRENT_USER_ID = 1; // Alice (Buyer)

/**
 * Main Application Component
 */
export default function App() {
  const [page, setPage] = useState('home'); // 'home', 'product', 'cart', 'orders', 'dashboard'
  const [selectedProductId, setSelectedProductId] = useState(null);

  // Memoized cart count for the header
  const cartCount = useMemo(() => {
    // TODO: UPDATE THE DATA IN BACKEND.
    return dummyData.cart_items
      .filter(item => item.user_id === CURRENT_USER_ID)
      .reduce((sum, item) => sum + item.quantity_added, 0);
  }, [dummyData.cart_items]);

  const navigate = (pageName) => {
    setPage(pageName);
    setSelectedProductId(null); // Reset selected product on page change
  };

  const viewProduct = (productId) => {
    setSelectedProductId(productId);
    setPage('product');
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Header navigate={navigate} cartCount={cartCount} />
      <main className="container mx-auto max-w-7xl p-4 md:p-6">
        {
          {
            'home': <ProductList viewProduct={viewProduct} />,
            'product': <ProductDetail productId={selectedProductId} navigate={navigate} />,
            'cart': <CartView />,
            'orders': <OrderHistory />,
            'dashboard': <Dashboard />,
          }[page]
        }
      </main>
      <Footer />
    </div>
  );
}

/**
 * Header Component
 */
function Header({ navigate, cartCount }) {
  const navItemClasses = "flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors duration-200";
  const iconClasses = "w-5 h-5";
  
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <nav className="container mx-auto max-w-7xl px-4 md:px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <div 
          className="text-2xl font-bold text-blue-600 cursor-pointer"
          onClick={() => navigate('home')}
        >
          ShopeeLazada
        </div>
        
        {/* Search Bar (Mock) */}
        <div className="hidden md:block w-full max-w-md">
          <input 
            type="text" 
            placeholder="Search for products..." 
            className="w-full px-4 py-2 border rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Navigation Icons */}
        <div className="flex items-center gap-4 md:gap-6">
          <button onClick={() => navigate('home')} className={navItemClasses} title="Home">
            <HomeIcon className={iconClasses} />
            <span className="hidden lg:block">Home</span>
          </button>
          <button onClick={() => navigate('dashboard')} className={navItemClasses} title="Dashboard">
            <LayoutDashboardIcon className={iconClasses} />
            <span className="hidden lg:block">Dashboard</span>
          </button>
          <button onClick={() => navigate('orders')} className={navItemClasses} title="My Orders">
            <PackageIcon className={iconClasses} />
            <span className="hidden lg:block">Orders</span>
          </button>
          <button onClick={() => navigate('cart')} className={`${navItemClasses} relative`} title="Cart">
            <ShoppingCartIcon className={iconClasses} />
            <span className="hidden lg:block">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </nav>
    </header>
  );
}

/**
 * Product List Component (Home Page)
 */
function ProductList({ viewProduct }) {
  // TODO: UPDATE THE DATA IN BACKEND.
  const products = dummyData.products;
  const flashSales = dummyData.flash_sales;
  
  // Find active flash sale (for demo)
  // const now = new Date(); // Removed, as it was unused
  const activeFlashSale = flashSales.find(fs => {
    // const start = new Date(fs.start_time); // Removed, as it was unused
    // const end = new Date(fs.end_time); // Removed, as it was unused
    // For this demo, let's just pretend the first one is active
    return fs.flash_sale_id === 1;
  });

  const flashSaleProducts = products.filter(p => p.flash_sale_id === activeFlashSale?.flash_sale_id);
  const regularProducts = products.filter(p => !p.flash_sale_id);

  return (
    <div className="space-y-8">
      {/* Flash Sale Section */}
      {activeFlashSale && flashSaleProducts.length > 0 && (
        <section className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-2xl font-bold text-red-600 flex items-center gap-2">
              <SparkleIcon className="w-6 h-6 animate-pulse" />
              {activeFlashSale.name}
            </h2>
            <div className="text-lg font-semibold text-gray-700">
              Ends in: <span className="text-red-600">02:34:56</span> {/* Mock timer */}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {flashSaleProducts.map(product => (
              <ProductCard key={product.product_id} product={product} viewProduct={viewProduct} />
            ))}
          </div>
        </section>
      )}

      {/* Regular Products Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Discover Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {regularProducts.map(product => (
            <ProductCard key={product.product_id} product={product} viewProduct={viewProduct} />
          ))}
        </div>
      </section>
    </div>
  );
}

/**
 * Product Card Component
 */
function ProductCard({ product, viewProduct }) {
  // TODO: UPDATE THE DATA IN BACKEND.
  const seller = dummyData.users.find(u => u.user_id === product.seller_id);
  const isFlashSale = !!product.flash_sale_id;

  return (
    <div 
      className="bg-white rounded-lg shadow overflow-hidden transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
      onClick={() => viewProduct(product.product_id)}
    >
      <div className="relative">
        <img 
          src={`https://placehold.co/400x400/eee/ccc?text=${product.name.replace(' ', '+')}`} 
          alt={product.name} 
          className="w-full h-48 object-cover"
        />
        {isFlashSale && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
            FLASH SALE
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 truncate">{product.name}</h3>
        <p className="text-sm text-gray-500 mb-2">{seller?.name || 'Unknown Seller'}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-blue-600">${product.price.toFixed(2)}</span>
          {isFlashSale && (
            <span className="text-sm text-gray-400 line-through">${product.original_price.toFixed(2)}</span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {product.quantity_stock} left in stock
        </p>
      </div>
    </div>
  );
}

/**
 * Product Detail Component
 */
function ProductDetail({ productId, navigate }) {
  // TODO: UPDATE THE DATA IN BACKEND.
  const product = dummyData.products.find(p => p.product_id === productId);
  
  if (!product) {
    return (
      <div className="text-center text-gray-500">
        <p>Product not found.</p>
        <button onClick={() => navigate('home')} className="text-blue-600 hover:underline">
          Back to Home
        </button>
      </div>
    );
  }

  // TODO: UPDATE THE DATA IN BACKEND.
  const seller = dummyData.users.find(u => u.user_id === product.seller_id);
  const isFlashSale = !!product.flash_sale_id;

  const addToCart = () => {
    // TODO: This should call a backend API
    // For now, we'll just log it.
    console.log(`// TODO: Add product ${product.product_id} to cart for user ${CURRENT_USER_ID}`);
    // We use a custom modal overlay instead of alert()
    showModal(`Added "${product.name}" to cart! (Check console for mock API call)`);
  };
  
  // Custom modal function to avoid using alert()
  const showModal = (message) => {
    let modal = document.getElementById('alert-modal');
    if (modal) {
      modal.remove();
    }
    
    modal = document.createElement('div');
    modal.id = 'alert-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white p-6 rounded-lg shadow-lg text-center';
    
    const messageP = document.createElement('p');
    messageP.className = 'text-gray-700 mb-4';
    messageP.textContent = message;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors';
    closeButton.textContent = 'OK';
    closeButton.onclick = () => {
      modal.remove();
    };
    
    modalContent.appendChild(messageP);
    modalContent.appendChild(closeButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    closeButton.focus();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <button 
        onClick={() => navigate('home')} 
        className="flex items-center text-blue-600 hover:underline mb-4"
      >
        <ChevronLeftIcon className="w-5 h-5" />
        Back to products
      </button>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/2">
          <img 
            src={`https://placehold.co/600x600/eee/ccc?text=${product.name.replace(' ', '+')}`} 
            alt={product.name} 
            className="w-full rounded-lg shadow"
          />
        </div>
        <div className="md:w-1/2 flex flex-col justify-between">
          <div>
            <span className="text-sm text-gray-500">{product.category}</span>
            <h1 className="text-3xl font-bold text-gray-800 my-2">{product.name}</h1>
            <p className="text-base text-gray-600 mb-4">
              Sold by <span className="font-semibold text-blue-600">{seller?.name || 'Unknown Seller'}</span>
            </p>
            
            {isFlashSale && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4">
                <p className="font-bold">Flash Sale!</p>
                <p>Limited time offer. Only {product.quantity_stock} left!</p>
              </div>
            )}

            <div className="flex items-baseline gap-3 my-4">
              <span className="text-4xl font-bold text-blue-600">${product.price.toFixed(2)}</span>
              {isFlashSale && (
                <div className="text-lg">
                  <span className="text-gray-400 line-through">${product.original_price.toFixed(2)}</span>
                  <span className="ml-2 bg-red-500 text-white text-sm font-bold px-2 py-1 rounded">
                    {Math.round(product.discount_rate * 100)}% OFF
                  </span>
                </div>
              )}
            </div>
            
            <p className="text-gray-500">
              <span className="font-semibold">{product.quantity_stock}</span> units available
            </p>
          </div>
          
          <div className="mt-6 flex gap-4">
            <button 
              onClick={addToCart}
              className="flex-1 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow hover:bg-blue-700 transition-colors duration-300"
            >
              Add to Cart
            </button>
            <button 
              className="flex-1 bg-green-500 text-white font-bold py-3 px-6 rounded-lg shadow hover:bg-green-600 transition-colors duration-300"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Cart View Component
 */
function CartView() {
  // TODO: UPDATE THE DATA IN BACKEND.
  const cartItems = dummyData.cart_items.filter(item => item.user_id === CURRENT_USER_ID);
  
  const cartDetails = cartItems.map(item => {
    const product = dummyData.products.find(p => p.product_id === item.product_id);
    return {
      ...item,
      productName: product?.name || 'Unknown Product',
      pricePerItem: product?.price || 0,
      totalPrice: (product?.price || 0) * item.quantity_added,
    };
  });

  const subtotal = cartDetails.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Cart</h1>
      
      {cartDetails.length === 0 ? (
        <p className="text-gray-500">Your cart is empty.</p>
      ) : (
        <div className="space-y-4">
          {cartDetails.map(item => (
            <div key={item.cart_item_id} className="flex items-center justify-between gap-4 p-4 border rounded-lg">
              <img 
                src={`https://placehold.co/100x100/eee/ccc?text=${item.productName.replace(' ', '+')}`} 
                alt={item.productName}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{item.productName}</h3>
                <p className="text-sm text-gray-500">
                  ${item.pricePerItem.toFixed(2)} x {item.quantity_added}
                </p>
              </div>
              <div className="text-lg font-bold">
                ${item.totalPrice.toFixed(2)}
              </div>
              {/* TODO: Add quantity change and remove buttons */}
            </div>
          ))}

          <div className="border-t pt-6 mt-6">
            <div className="flex justify-between text-xl font-bold mb-4">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <button className="w-full bg-green-500 text-white font-bold py-3 px-6 rounded-lg shadow hover:bg-green-600 transition-colors duration-300">
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Order History Component
 */
function OrderHistory() {
  // TODO: UPDATE THE DATA IN BACKEND.
  const orders = dummyData.orders.filter(o => o.buyer_id === CURRENT_USER_ID);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Orders</h1>
      
      {orders.length === 0 ? (
        <p className="text-gray-500">You have no past orders.</p>
      ) : (
        <div className="space-y-6">
          {orders.map(order => {
            // TODO: UPDATE THE DATA IN BACKEND.
            const itemsInOrder = dummyData.order_items.filter(item => item.order_id === order.order_id);
            const orderTotal = itemsInOrder.reduce((sum, item) => {
              const product = dummyData.products.find(p => p.product_id === item.product_id);
              return sum + (product?.price || 0) * item.quantity_sold;
            }, 0);

            return (
              <div key={order.order_id} className="border p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-semibold">Order #{order.order_id}</h2>
                  <span className="text-gray-600">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="space-y-2">
                  {itemsInOrder.map(item => {
                    // TODO: UPDATE THE DATA IN BACKEND.
                    const product = dummyData.products.find(p => p.product_id === item.product_id);
                    return (
                      <div key={item.order_item_id} className="flex justify-between text-sm">
                        <span>{product?.name || 'Unknown'} (x{item.quantity_sold})</span>
                        <span className="text-gray-500">
                          ${((product?.price || 0) * item.quantity_sold).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t mt-2 pt-2 text-right">
                  <span className="font-bold text-lg">
                    Total: ${orderTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Dashboard Component (Analytical Reports)
 */
function Dashboard() {
  // This is where we use the mocked OLAP report data
  // TODO: UPDATE THE DATA IN BACKEND.
  const { report_topSellingItems, report_salesByCategory, report_flashSalePerformance } = dummyData;

  const maxSales = Math.max(...report_salesByCategory.map(item => item.total_sales));
  const maxFlashSold = Math.max(...report_flashSalePerformance.map(item => item.quantity_sold));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
      <p className="text-gray-600">
        Showing mock data based on your OLAP schema. In a real app, this would be fetched from a dedicated reporting endpoint.
      </p>

      {/* Grid for reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Report 1: Top Selling Items */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Report 1: Top Selling Items</h2>
          <div className="space-y-2">
            {report_topSellingItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="font-semibold">{index + 1}. {item.product_name}</span>
                <span className="text-gray-500">{item.total_sold} units</span>
              </div>
            ))}
          </div>
        </div>

        {/* Report 2: Sales by Category */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Report 2: Sales by Category</h2>
          <div className="space-y-3">
            {report_salesByCategory.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm font-semibold mb-1">
                  <span>{item.category}</span>
                  <span>${item.total_sales.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${(item.total_sales / maxSales) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Report 3: Flash Sale Performance */}
        <div className="bg-white p-6 rounded-lg shadow-lg lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Report 3: Flash Sale Performance ({report_flashSalePerformance[0].flash_sale_name})</h2>
          <p className="text-sm text-gray-500 mb-4">Quantity Sold Per Hour</p>
          <div className="flex justify-around items-end h-48 p-4 border rounded-lg bg-gray-50">
            {report_flashSalePerformance.map((item, index) => (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className="w-12 bg-green-500 rounded-t-md"
                  style={{ height: `${(item.quantity_sold / maxFlashSold) * 100}%` }}
                  title={`Sold: ${item.quantity_sold}`}
                ></div>
                <span className="text-xs font-semibold mt-2">{item.hour}:00</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Footer Component
 */
function Footer() {
  return (
    <footer className="mt-12 py-6 border-t border-gray-200">
      <div className="container mx-auto max-w-7xl px-4 md:px-6 text-center text-gray-500">
        <p>&copy; {new Date().getFullYear()} ShopeeLazada Prototype. Frontend Only.</p>
        <p className="text-sm">This is a mock application using dummy data.</p>
      </div>
    </footer>
  );
}