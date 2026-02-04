// Advanced Unified Cart System for Hive Times Ecosystem
class AdvancedUnifiedCart {
    constructor() {
        this.storageKey = 'hivetimes_advanced_cart_v4';
        this.carts = new Map(); // Separate cart for each business
        this.currentBusinessId = this.getCurrentBusinessId();
        this.init();
    }

    // Get current business context
    getCurrentBusinessId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('business') || 
               document.body.dataset.businessId || 
               'global';
    }

    init() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            const savedCarts = saved ? JSON.parse(saved) : {};
            
            for (const [businessId, items] of Object.entries(savedCarts)) {
                this.carts.set(businessId, items.map(item => this.normalizeItem(item)).filter(Boolean));
            }
            
            if (!this.carts.has(this.currentBusinessId)) {
                this.carts.set(this.currentBusinessId, []);
            }
        } catch (e) {
            console.warn('Cart init failed. Starting fresh.', e);
            this.carts.set(this.currentBusinessId, []);
        }
        this.updateUI();
    }

    normalizeItem(item) {
        if (!item || typeof item !== 'object') return null;
        
        const id = String(item.id || item.productId).trim();
        const name = String(item.name || item.productName || 'Unknown Product').trim();
        const price = parseFloat(item.price || item.unitPrice);
        const quantity = parseInt(item.quantity, 10) || 1;
        const businessId = String(item.businessId || this.currentBusinessId).trim();
        
        if (!id || isNaN(price) || price < 0 || quantity <= 0 || !businessId) return null;
        
        return {
            id,
            name,
            price: Math.round(price * 100) / 100,
            quantity: Math.max(1, quantity),
            image: String(item.image || '').trim(),
            businessId,
            businessName: String(item.businessName || 'Hive Times Business').trim(),
            businessLogo: String(item.businessLogo || '').trim(),
            addedAt: item.addedAt || Date.now(),
            customAttributes: item.customAttributes || {}
        };
    }

    save() {
        try {
            const saveObj = {};
            for (const [businessId, items] of this.carts) {
                saveObj[businessId] = items;
            }
            localStorage.setItem(this.storageKey, JSON.stringify(saveObj));
        } catch (e) {
            console.error('Cart save failed (storage full?)', e);
        }
        this.updateUI();
    }

    getBusinessCart(businessId = this.currentBusinessId) {
        if (!this.carts.has(businessId)) {
            this.carts.set(businessId, []);
        }
        return this.carts.get(businessId);
    }

    addToCart(product, businessId = this.currentBusinessId) {
        const normalized = this.normalizeItem({ ...product, businessId });
        if (!normalized) {
            console.error('Invalid product:', product);
            return false;
        }

        const cart = this.getBusinessCart(businessId);
        const existing = cart.find(item => item.id === normalized.id);
        
        if (existing) {
            existing.quantity += normalized.quantity;
            existing.addedAt = Date.now();
        } else {
            cart.push(normalized);
        }
        
        this.save();
        this.notify(`Added to ${normalized.businessName} cart!`, 'success');
        return true;
    }

    updateQuantity(id, delta, businessId = this.currentBusinessId) {
        const cart = this.getBusinessCart(businessId);
        const item = cart.find(i => i.id === id);
        if (!item) return false;
        
        item.quantity += delta;
        item.quantity = Math.max(0, item.quantity);
        
        if (item.quantity === 0) {
            this.removeItem(id, businessId);
        } else {
            this.save();
        }
        return true;
    }

    removeItem(id, businessId = this.currentBusinessId) {
        const cart = this.getBusinessCart(businessId);
        const index = cart.findIndex(item => item.id === id);
        if (index !== -1) {
            cart.splice(index, 1);
            this.save();
            return true;
        }
        return false;
    }

    getBusinessTotal(businessId = this.currentBusinessId) {
        const cart = this.getBusinessCart(businessId);
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
    }

    getBusinessItemCount(businessId = this.currentBusinessId) {
        const cart = this.getBusinessCart(businessId);
        return cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    getTotal() {
        let total = 0;
        for (const cart of this.carts.values()) {
            total += cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        }
        return total.toFixed(2);
    }

    getItemCount() {
        let count = 0;
        for (const cart of this.carts.values()) {
            count += cart.reduce((sum, item) => sum + item.quantity, 0);
        }
        return count;
    }

    getBusinessesWithItems() {
        const businesses = [];
        for (const [businessId, items] of this.carts) {
            if (items.length > 0) {
                businesses.push({
                    id: businessId,
                    name: items[0].businessName,
                    logo: items[0].businessLogo,
                    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
                    total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)
                });
            }
        }
        return businesses;
    }

    clearBusinessCart(businessId = this.currentBusinessId) {
        this.carts.set(businessId, []);
        this.save();
    }

    updateUI() {
        const countEl = document.getElementById('cartCount');
        if (countEl) countEl.textContent = this.getItemCount();

        const totalEl = document.getElementById('cartTotal');
        if (totalEl) totalEl.textContent = `Total: R${this.getTotal()}`;

        // Update any active cart modals
        const activeModals = document.querySelectorAll('.cart-modal.active');
        activeModals.forEach(modal => {
            this.renderCartForModal(modal);
        });
    }

    renderCartForModal(modal) {
        const container = modal.querySelector('.cart-items');
        const totalEl = modal.querySelector('.cart-total, #cartTotal');
        if (!container) return;

        const businesses = this.getBusinessesWithItems();
        
        if (businesses.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #555;">Your cart is empty.</p>';
        } else {
            const businessesHtml = businesses.map(business => {
                const cart = this.getBusinessCart(business.id);
                const itemsHtml = cart.map(item => `
                    <div class="cart-item" data-item-id="${this.escapeHtml(item.id)}" data-business-id="${this.escapeHtml(item.businessId)}">
                        <img src="${this.escapeHtml(item.image)}" alt="${this.escapeHtml(item.name)}" class="cart-item-image" onerror="this.src='image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22 viewBox=%220 0 24 24%22 fill=%22%23eee%22><rect width=%2224%22 height=%2224%22/></svg>'">
                        <div class="cart-item-details">
                            <div class="cart-item-name">${this.escapeHtml(item.name)}</div>
                            <div class="cart-item-price">R${(item.price * item.quantity).toFixed(2)} (R${item.price.toFixed(2)} each)</div>
                            <div class="cart-item-quantity">
                                <button class="cart-quantity-btn" onclick="advancedCart.updateQuantity('${this.escapeHtml(item.id)}', -1, '${this.escapeHtml(item.businessId)}')">−</button>
                                <span class="cart-quantity-display">${item.quantity}</span>
                                <button class="cart-quantity-btn" onclick="advancedCart.updateQuantity('${this.escapeHtml(item.id)}', 1, '${this.escapeHtml(item.businessId)}')">+</button>
                            </div>
                        </div>
                        <button class="remove-item-btn" onclick="advancedCart.removeItem('${this.escapeHtml(item.id)}', '${this.escapeHtml(item.businessId)}')">
                            <i class="fas fa-trash-alt"></i> Remove
                        </button>
                    </div>
                `).join('');

                return `
                    <div class="cart-business-group" data-business-id="${this.escapeHtml(business.id)}">
                        <div class="cart-business-header">
                            <img src="${this.escapeHtml(business.logo)}" alt="${this.escapeHtml(business.name)} Logo" class="cart-business-logo" onerror="this.style.display='none';">
                            <h4 class="cart-business-name">${this.escapeHtml(business.name)}</h4>
                            <div class="cart-business-total">Total: R${business.total}</div>
                            <button class="clear-business-cart" onclick="advancedCart.clearBusinessCart('${this.escapeHtml(business.id)}')">
                                Clear Cart
                            </button>
                        </div>
                        <div class="cart-business-items">
                            ${itemsHtml}
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = businessesHtml;
        }

        if (totalEl) {
            totalEl.textContent = `Total: R${this.getTotal()}`;
        }
    }

    notify(message, type = 'info') {
        let notification = document.getElementById('cart-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'cart-notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 5px;
                color: white;
                font-weight: bold;
                z-index: 10000;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            `;
            document.body.appendChild(notification);
        }

        notification.textContent = message;
        notification.style.backgroundColor = 
            type === 'success' ? '#4CAF50' : 
            type === 'error' ? '#f44336' : '#2196F3';

        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
        }, 3000);
    }

    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

const advancedCart = window.advancedCart = new AdvancedUnifiedCart();

// Legacy support for inline HTML
window.cart = {
    addToCart: (product) => advancedCart.addToCart(product),
    updateQuantity: (id, delta) => advancedCart.updateQuantity(id, delta),
    removeItem: (id) => advancedCart.removeItem(id)
};

// Auto-bind cart modals and buttons
document.addEventListener('DOMContentLoaded', () => {
    // Open any cart modal
    const cartBtns = document.querySelectorAll('.cart-btn, [onclick*="showCartModal"]');
    cartBtns.forEach(btn => {
        if (!btn.dataset.bound) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const modal = document.querySelector('.cart-modal');
                if (modal) {
                    document.querySelector('.cart-modal-overlay').style.display = 'flex';
                    setTimeout(() => modal.classList.add('active'), 10);
                    advancedCart.renderCartForModal(modal);
                }
            });
            btn.dataset.bound = 'true';
        }
    });

    // Close cart modals
    const closeBtns = document.querySelectorAll('.close-cart-btn, .cart-modal .close');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = document.querySelector('.cart-modal.active');
            if (modal) {
                modal.classList.remove('active');
                setTimeout(() => document.querySelector('.cart-modal-overlay').style.display = 'none', 300);
            }
        });
    });

    // Close on overlay click
    const overlays = document.querySelectorAll('.cart-modal-overlay');
    overlays.forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                const modal = document.querySelector('.cart-modal.active');
                if (modal) {
                    modal.classList.remove('active');
                    setTimeout(() => overlay.style.display = 'none', 300);
                }
            }
        });
    });
});