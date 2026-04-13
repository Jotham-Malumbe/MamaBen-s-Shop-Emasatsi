// ====================== CONFIGURATION ======================
const SHOP_NAME = "MamaBen's Shop - Emasatsi";
const WHATSAPP_NUMBER = "254115652612"; // International format without +
const DEFAULT_PASSWORD = "admin123";

// Delivery Locations with fixed prices
const deliveryLocations = {
    "Emuruba": 50,
    "Eshikwata": 40,
    "Ebutindi": 30,
    "Emulunya": 40,
    "Munjiti": 60,
    "Kilingili": 90,
    "Eshinutsa": 50,
    "Ekonjero": 90,
    "Ebutuku": 50
};

// ====================== GLOBAL VARIABLES ======================
let products = [];
let cart = [];

// ====================== LOAD PRODUCTS ======================
async function loadProducts() {
    try {
        const response = await fetch('products.json');
        products = await response.json();
        renderFeaturedProducts();
        renderAllProducts();
        renderCategoryFilters();
    } catch (error) {
        console.error("Failed to load products:", error);
        // Fallback: empty array
        products = [];
    }
}

// ====================== RENDER FUNCTIONS ======================
// Featured Products on Homepage
function renderFeaturedProducts() {
    const container = document.getElementById('featured-products');
    if (!container) return;

    const featured = products.slice(0, 8); // Show first 8 as featured

    let html = '';
    featured.forEach(product => {
        html += `
            <div class="product-card cursor-pointer" onclick="viewProduct(${product.id})">
                <img src="${product.image}" alt="${product.name}" class="product-image w-full">
                <div class="product-info">
                    <p class="product-name">${product.name}</p>
                    <p class="text-emerald-600 font-bold text-lg">KSh ${product.price}</p>
                    <button onclick="event.stopImmediatePropagation(); addToCart(${product.id});" 
                            class="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm py-2 rounded-xl">
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// All Products Page
function renderAllProducts(filteredProducts = products) {
    const container = document.getElementById('product-grid');
    if (!container) return;

    let html = '';
    filteredProducts.forEach(product => {
        html += `
            <div class="product-card cursor-pointer" onclick="viewProduct(${product.id})">
                <img src="${product.image}" alt="${product.name}" class="product-image w-full">
                <div class="product-info">
                    <p class="product-name">${product.name}</p>
                    <p class="text-emerald-600 font-bold text-lg">KSh ${product.price}</p>
                    <button onclick="event.stopImmediatePropagation(); addToCart(${product.id});" 
                            class="mt-3 w-full bg-orange-500 hover:bg-orange-600 text-white text-sm py-2 rounded-xl">
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html || '<p class="col-span-full text-center py-12 text-gray-500">No products found.</p>';
}

// Category Filters
function renderCategoryFilters() {
    const categories = [...new Set(products.map(p => p.category))];
    const container = document.getElementById('category-filters') || document.getElementById('category-buttons');
    if (!container) return;

    let html = `<button onclick="filterByCategory('all')" class="category-btn active px-5 py-2 text-sm">All</button>`;
    
    categories.forEach(cat => {
        html += `<button onclick="filterByCategory('${cat}')" class="category-btn px-5 py-2 text-sm">${cat}</button>`;
    });
    container.innerHTML = html;
}

// ====================== CART FUNCTIONS ======================
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    updateCartCount();
    showNotification(`${product.name} added to cart`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartCount();
    renderCart();
}

function changeQuantity(productId, change) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity < 1) item.quantity = 1;
        renderCart();
    }
}

function updateCartCount() {
    const countEl = document.getElementById('cart-count');
    if (countEl) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        countEl.textContent = totalItems;
    }
}

// Render Cart
function renderCart() {
    const container = document.getElementById('cart-items');
    if (!container) return;

    let html = '';
    let subtotal = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        html += `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-xl">
                <div class="flex-1">
                    <p class="font-medium">${item.name}</p>
                    <p class="text-emerald-600">KSh ${item.price} × ${item.quantity}</p>
                </div>
                <div class="text-right">
                    <p class="font-semibold">KSh ${itemTotal}</p>
                    <div class="flex gap-2 mt-2">
                        <button onclick="changeQuantity(${item.id}, -1)" class="w-6 h-6 flex items-center justify-center border rounded">-</button>
                        <button onclick="changeQuantity(${item.id}, 1)" class="w-6 h-6 flex items-center justify-center border rounded">+</button>
                        <button onclick="removeFromCart(${item.id})" class="text-red-500 text-sm ml-3">Remove</button>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html || '<p class="text-center py-8 text-gray-500">Your cart is empty</p>';

    document.getElementById('subtotal').textContent = `KSh ${subtotal}`;
    updateDeliveryFee();
}

// Delivery Fee Logic
function updateDeliveryFee() {
    const option = document.getElementById('delivery-option')?.value || 'pickup';
    const locationRow = document.getElementById('location-row');
    const locationSelect = document.getElementById('delivery-location');
    let deliveryFee = 0;

    if (option === 'delivery') {
        locationRow.classList.remove('hidden');
        const selectedLocation = locationSelect ? locationSelect.value : '';
        deliveryFee = deliveryLocations[selectedLocation] || 0;
    } else {
        locationRow.classList.add('hidden');
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const grandTotal = subtotal + deliveryFee;

    document.getElementById('grand-total').textContent = `KSh ${grandTotal}`;
}

// Populate Delivery Locations
function populateDeliveryLocations() {
    const selects = document.querySelectorAll('#delivery-location, #delivery-location-single');
    selects.forEach(select => {
        if (!select) return;
        select.innerHTML = '<option value="">Select Location</option>';
        
        Object.keys(deliveryLocations).forEach(loc => {
            const option = document.createElement('option');
            option.value = loc;
            option.textContent = `${loc} - KSh ${deliveryLocations[loc]}`;
            select.appendChild(option);
        });
        
        // Add "Other" option
        const other = document.createElement('option');
        other.value = "Other";
        other.textContent = "Other location";
        select.appendChild(other);
    });
}

// ====================== ORDER & WHATSAPP ======================
function placeOrder() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const deliveryOption = document.getElementById('delivery-option').value;
    const location = document.getElementById('delivery-location').value || "Not specified";
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = (deliveryOption === 'delivery') ? (deliveryLocations[location] || 0) : 0;
    const total = subtotal + deliveryFee;

    let message = `Hello MamaBen's Shop,\n\n`;
    message += `I want to place an order:\n\n`;
    message += `Items:\n`;

    cart.forEach(item => {
        message += `${item.name} × ${item.quantity} - KSh ${item.price * item.quantity}\n`;
    });

    message += `\nSubtotal: KSh ${subtotal}\n`;

    if (deliveryOption === 'delivery') {
        message += `Delivery Location: ${location}\n`;
        message += `Delivery Fee: KSh ${deliveryFee}\n`;
    } else {
        message += `Option: Pickup from Shop\n`;
    }

    message += `\nTotal: KSh ${total}\n\n`;
    message += `If your location is not listed, delivery fee will be confirmed after order.`;

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    // Clear cart after order
    setTimeout(() => {
        cart = [];
        updateCartCount();
        toggleCart();
        alert("Thank you! Your order has been sent via WhatsApp.");
    }, 1000);
}

// ====================== THEME TOGGLE ======================
function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
}

// ====================== ADMIN PANEL ======================
let isLoggedIn = false;

function loginAdmin() {
    const password = document.getElementById('admin-password').value;
    if (password === DEFAULT_PASSWORD) {
        isLoggedIn = true;
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('admin-dashboard').classList.remove('hidden');
        renderAdminProducts();
    } else {
        alert("Incorrect password!");
    }
}

function logoutAdmin() {
    isLoggedIn = false;
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('admin-dashboard').classList.add('hidden');
    document.getElementById('admin-password').value = '';
}

// Add New Product
function addNewProduct() {
    const name = document.getElementById('new-name').value.trim();
    const price = parseInt(document.getElementById('new-price').value);
    const category = document.getElementById('new-category').value.trim();
    const image = document.getElementById('new-image').value.trim();
    const description = document.getElementById('new-description').value.trim();

    if (!name || !price || !category || !image) {
        alert("Please fill all required fields");
        return;
    }

    const newProduct = {
        id: Date.now(),
        name,
        price,
        category,
        image,
        description: description || "No description provided."
    };

    products.unshift(newProduct);
    saveProducts();
    renderAdminProducts();
    
    // Clear form
    document.getElementById('new-name').value = '';
    document.getElementById('new-price').value = '';
    document.getElementById('new-category').value = '';
    document.getElementById('new-image').value = '';
    document.getElementById('new-description').value = '';

    alert("Product added successfully!");
}

// Render Admin Products
function renderAdminProducts() {
    const container = document.getElementById('admin-products-list');
    if (!container) return;

    let html = '';
    products.forEach(product => {
        html += `
            <div class="flex gap-4 items-center border-b dark:border-slate-700 pb-4">
                <img src="${product.image}" alt="${product.name}" class="w-16 h-16 object-cover rounded-xl">
                <div class="flex-1">
                    <p class="font-medium">${product.name}</p>
                    <p class="text-emerald-600">KSh ${product.price} • ${product.category}</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="editProduct(${product.id})" class="px-4 py-2 text-sm border rounded-xl">Edit</button>
                    <button onclick="deleteProduct(${product.id})" class="px-4 py-2 text-sm border border-red-500 text-red-500 rounded-xl">Delete</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// Edit & Delete Functions
function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    document.getElementById('edit-id').value = product.id;
    document.getElementById('edit-name').value = product.name;
    document.getElementById('edit-price').value = product.price;
    document.getElementById('edit-category').value = product.category;
    document.getElementById('edit-image').value = product.image;
    document.getElementById('edit-description').value = product.description || '';

    document.getElementById('edit-modal').classList.remove('hidden');
}

function saveEditedProduct() {
    const id = parseInt(document.getElementById('edit-id').value);
    const product = products.find(p => p.id === id);
    if (!product) return;

    product.name = document.getElementById('edit-name').value;
    product.price = parseInt(document.getElementById('edit-price').value);
    product.category = document.getElementById('edit-category').value;
    product.image = document.getElementById('edit-image').value;
    product.description = document.getElementById('edit-description').value;

    saveProducts();
    renderAdminProducts();
    closeEditModal();
    alert("Product updated successfully!");
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
}

function deleteProduct(id) {
    if (confirm("Delete this product?")) {
        products = products.filter(p => p.id !== id);
        saveProducts();
        renderAdminProducts();
    }
}

// Save products to localStorage (for persistence across refreshes)
function saveProducts() {
    localStorage.setItem('mamaBenProducts', JSON.stringify(products));
}

// ====================== HELPER FUNCTIONS ======================
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 2500);
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.classList.toggle('hidden');
        if (!modal.classList.contains('hidden')) {
            renderCart();
        }
    }
}

function viewProduct(id) {
    window.location.href = `product.html?id=${id}`;
}

function filterByCategory(category) {
    const buttons = document.querySelectorAll('.category-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    const activeBtn = Array.from(buttons).find(btn => 
        (category === 'all' && btn.textContent === 'All') || 
        btn.textContent === category
    );
    if (activeBtn) activeBtn.classList.add('active');

    if (category === 'all') {
        renderAllProducts(products);
    } else {
        const filtered = products.filter(p => p.category === category);
        renderAllProducts(filtered);
    }
}

// ====================== INITIALIZATION ======================
function init() {
    // Load theme
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark');
    }

    // Load products
    loadProducts();

    // Populate delivery locations
    populateDeliveryLocations();

    // Theme toggle
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }

    // Search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = products.filter(p => 
                p.name.toLowerCase().includes(term) || 
                p.description.toLowerCase().includes(term)
            );
            renderAllProducts(filtered);
        });
    }

    // Update cart count on load
    updateCartCount();
}

// Run initialization when page loads
window.onload = init;