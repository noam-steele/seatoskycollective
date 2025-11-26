/**
 * Sea-to-Sky Collective - Main JavaScript
 * Handles Product Data, Modals, and Shopping Cart
 */

// --- Product Data ---
const products = [
    {
        id: "604-skyline",
        title: "604 Skyline",
        price: 15.00,
        currency: "CAD",
        description: "A minimalist vector representation of the Vancouver skyline against the Coast Mountains. Perfect for any modern living space.",
        images: [
            "assets/images/604_skyline.png"
        ],
        sizes: ["8x10", "11x14", "16x20"],
        type: "print"
    },
    {
        id: "ski-dad-hat",
        title: "Ski. Dad Hat",
        price: 35.00,
        currency: "CAD",
        description: "Low profile, unstructured dad hat with 'Ski.' embroidered in white. 100% Cotton Chino Twill. Adjustable strap.",
        images: [
            "assets/images/ski_hat_front.png",
            "assets/images/ski_hat_side.png",
            "assets/images/ski_hat_back_model.jpg",
            "assets/images/ski_hat_stack.png"
        ],
        sizes: ["One Size"],
        type: "apparel"
    },
    {
        id: "ski-tote-bag",
        title: "Ski. Organic Tote Bag",
        price: 25.00,
        currency: "CAD",
        description: "Eco-friendly organic cotton tote bag featuring the minimalist 'Ski.' mountain design. Durable and spacious.",
        images: [
            "assets/images/ski_tote_front.png",
            "assets/images/ski_tote_model.png",
            "assets/images/ski_tote_flat.png",
            "assets/images/ski_tote_detail.png"
        ],
        sizes: ["One Size"],
        type: "apparel"
    },
    {
        id: "ski-dad-hat-blue",
        title: "Ski. Dad Hat - Vintage Blue",
        price: 35.00,
        currency: "CAD",
        description: "Low profile, unstructured dad hat in vintage light blue denim. 'Ski.' embroidered in black. 100% Cotton Chino Twill. Adjustable strap.",
        images: [
            "assets/images/ski_hat_blue_front.png",
            "assets/images/ski_hat_blue_model_f.png",
            "assets/images/ski_hat_blue_side.png",
            "assets/images/ski_hat_blue_model_m.jpg"
        ],
        sizes: ["One Size"],
        type: "apparel"
    }
];

// --- State ---
let cart = JSON.parse(localStorage.getItem('s2sc_cart')) || [];
let currentProduct = null;
let selectedSize = null;

// --- DOM Elements ---
const modal = document.getElementById('product-modal');
const cartModal = document.getElementById('cart-modal');
const cartCountElements = document.querySelectorAll('.cart-count');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
    setupEventListeners();
});

function setupEventListeners() {
    // Close modal on outside click
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Close cart on outside click
    if (cartModal) {
        cartModal.addEventListener('click', (e) => {
            if (e.target === cartModal) closeCart();
        });
    }
}

// --- Modal Logic ---

function openModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    currentProduct = product;
    selectedSize = product.sizes[0]; // Default to first size

    // Populate Modal Content
    const modalContent = document.getElementById('modal-content');

    // Generate Image Gallery HTML
    const imagesHtml = product.images.map((img, index) => `
        <img src="${img}" alt="${product.title} view ${index + 1}" class="${index === 0 ? 'active' : ''}" onclick="setMainImage(this.src)">
    `).join('');

    // Generate Sizes HTML
    const sizesHtml = product.sizes.map(size => `
        <button class="size-btn ${size === selectedSize ? 'active' : ''}" onclick="selectSize('${size}')">${size}</button>
    `).join('');

    modalContent.innerHTML = `
        <div class="modal-gallery">
            <div class="main-image">
                <img src="${product.images[0]}" id="modal-main-image" alt="${product.title}">
            </div>
            <div class="thumbnail-list">
                ${imagesHtml}
            </div>
        </div>
        <div class="modal-details">
            <button class="close-modal" onclick="closeModal()">&times;</button>
            <h2>${product.title}</h2>
            <p class="price">$${product.price.toFixed(2)} ${product.currency}</p>
            <p class="description">${product.description}</p>
            
            <div class="size-selector">
                <label>Size:</label>
                <div class="sizes-container">
                    ${sizesHtml}
                </div>
            </div>

            <button class="btn btn-custom w-100 mt-4" onclick="addToCart()">Add to Cart</button>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    currentProduct = null;
}

function setMainImage(src) {
    document.getElementById('modal-main-image').src = src;
}

function selectSize(size) {
    selectedSize = size;
    // Update UI
    const buttons = document.querySelectorAll('.size-btn');
    buttons.forEach(btn => {
        if (btn.innerText === size) btn.classList.add('active');
        else btn.classList.remove('active');
    });
}

// --- Cart Logic ---

function addToCart() {
    if (!currentProduct || !selectedSize) return;

    const cartItem = {
        id: currentProduct.id,
        title: currentProduct.title,
        price: currentProduct.price,
        image: currentProduct.images[0],
        size: selectedSize,
        quantity: 1
    };

    // Check if item already exists
    const existingItemIndex = cart.findIndex(item => item.id === cartItem.id && item.size === cartItem.size);

    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += 1;
    } else {
        cart.push(cartItem);
    }

    saveCart();
    closeModal();
    openCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
}

function incrementQuantity(index) {
    cart[index].quantity += 1;
    saveCart();
}

function decrementQuantity(index) {
    if (cart[index].quantity > 1) {
        cart[index].quantity -= 1;
        saveCart();
    }
}

function saveCart() {
    localStorage.setItem('s2sc_cart', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    // Update Counts
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElements.forEach(el => el.innerText = `Cart (${totalItems})`);

    // Update Cart Modal Content
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartSummaryContainer = document.getElementById('cart-summary-container');

    if (cartItemsContainer && cartSummaryContainer) {
        // Items Column
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty.</p>';
        } else {
            cartItemsContainer.innerHTML = cart.map((item, index) => `
                <div class="cart-row">
                    <div class="cart-product-col">
                        <img src="${item.image}" alt="${item.title}">
                        <div class="cart-item-info">
                            <h4>${item.title}</h4>
                            <p class="variant">${item.size}</p>
                            <button class="remove-link" onclick="removeFromCart(${index})">Remove</button>
                        </div>
                    </div>
                    <div class="cart-quantity-col">
                        <div class="quantity-control">
                            <button onclick="decrementQuantity(${index})">-</button>
                            <input type="text" value="${item.quantity}" readonly>
                            <button onclick="incrementQuantity(${index})">+</button>
                        </div>
                    </div>
                    <div class="cart-price-col">
                        $${item.price.toFixed(2)}
                    </div>
                    <div class="cart-total-col">
                        $${(item.price * item.quantity).toFixed(2)}
                    </div>
                </div>
            `).join('');
        }

        // Summary Column
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = 5.00; // Standard Delivery Mock
        const total = subtotal + shipping;

        cartSummaryContainer.innerHTML = `
            <div class="summary-row">
                <span>ITEMS ${totalItems}</span>
                <span>$${subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-section">
                <label>SHIPPING</label>
                <select class="form-select">
                    <option>Standard Delivery - $5.00</option>
                </select>
            </div>
            <div class="summary-section">
                <label>PROMO CODE</label>
                <input type="text" placeholder="Enter your code" class="form-control mb-2">
                <button class="btn btn-danger text-white w-auto px-4" style="font-size: 0.8rem;">APPLY</button>
            </div>
            <div class="summary-total">
                <span>TOTAL COST</span>
                <span>$${total.toFixed(2)}</span>
            </div>
            <button class="btn btn-primary w-100 mt-4">CHECKOUT</button>
        `;
    }
}

function openCart() {
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) {
        cartModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeCart() {
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) {
        cartModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}
