// Temporary in-memory data (replace with database later)
const products = [
    {
        id: 1,
        name: 'Wireless Bluetooth Headphones Noise Cancelling',
        category: 'Electronics',
        currentPrice: 1299,
        originalPrice: 2599,
        discount: 50,
        stock: 45,
        sold: 152,
        image: '/images/product1.jpg',
        isFlashSale: true,
        flashSaleEnd: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 2,
        name: 'Smartphone 128GB Dual Camera 5000mAh',
        category: 'Electronics',
        currentPrice: 6999,
        originalPrice: 9999,
        discount: 30,
        stock: 23,
        sold: 89,
        image: '/images/product2.jpg',
        isFlashSale: true,
        flashSaleEnd: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 3,
        name: 'Running Shoes Lightweight Sports Sneakers',
        category: 'Sports',
        currentPrice: 1499,
        originalPrice: 2499,
        discount: 40,
        stock: 67,
        sold: 234,
        image: '/images/product3.jpg',
        isFlashSale: true,
        flashSaleEnd: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 4,
        name: 'Smart Watch Fitness Tracker with Heart Rate',
        category: 'Electronics',
        currentPrice: 1799,
        originalPrice: 3599,
        discount: 50,
        stock: 34,
        sold: 167,
        image: '/images/product4.jpg',
        isFlashSale: true,
        flashSaleEnd: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 5,
        name: 'Wireless Earbuds Bluetooth 5.0 Touch Control',
        category: 'Electronics',
        currentPrice: 899,
        originalPrice: 1799,
        discount: 50,
        stock: 89,
        sold: 312,
        image: '/images/product5.jpg',
        isFlashSale: true,
        flashSaleEnd: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 6,
        name: 'Gaming Mouse RGB 7200DPI Programmable',
        category: 'Electronics',
        currentPrice: 699,
        originalPrice: 1399,
        discount: 50,
        stock: 56,
        sold: 98,
        image: '/images/product6.jpg',
        isFlashSale: true,
        flashSaleEnd: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString()
    }
];

const users = [];
const carts = {};
const orders = [];
let orderCounter = 1000;

module.exports = {
    products,
    users,
    carts,
    orders,
    orderCounter: {
        get: () => orderCounter,
        increment: () => ++orderCounter
    }
};