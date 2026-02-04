// js/app.js - Main Application

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Data Manager
  await DataManager.init();
  
  // Initial render
  renderAll();
  
  // Re-render when data updates
  DataManager.onUpdate(() => {
    renderAll();
  });
});

function renderAll() {
  renderHeader();
  renderSideMenu();
  renderProducts();
  renderBusinessModal();
  initSearch();
}

function renderHeader() {
  const business = DataManager.getBusinessInfo();
  document.getElementById('headerLogo').src = business.logo_url;
  document.getElementById('headerBusinessName').textContent = business.business_name;
}

function renderSideMenu() {
  const menuHTML = HTMLGenerator.generateSideMenu();
  document.getElementById('sideMenu').innerHTML = menuHTML;
}

function renderProducts() {
  const container = document.getElementById('productsContainer');
  container.innerHTML = HTMLGenerator.generateProductSections();
  
  // Re-attach click handlers for product modals
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.add-to-cart-btn')) {
        const productId = card.getAttribute('data-id');
        showProductModal(productId);
      }
    });
  });
}

function renderBusinessModal() {
  const content = HTMLGenerator.generateBusinessModal();
  document.getElementById('businessModalContent').innerHTML = content;
}

// Add to cart using data from manager
function addToCartFromData(productId) {
  const product = DataManager.getProductById(productId);
  if (!product) return;
  
  cart.addToCart({
    id: product.product_id,
    name: product.product_name,
    price: parseFloat(product.price),
    quantity: 1,
    image: product.image_url,
    businessName: DataManager.getBusinessInfo().business_name,
    businessLogo: DataManager.getBusinessInfo().logo_url
  });
}

// Real-time search across all products
function initSearch() {
  const searchInput = document.getElementById('aiProductSearchInput');
  
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const products = document.querySelectorAll('.product-card');
    const sections = document.querySelectorAll('.content-section');
    
    products.forEach(card => {
      const product = DataManager.getProductById(card.getAttribute('data-id'));
      if (!product) return;
      
      const name = product.product_name.toLowerCase();
      const price = parseFloat(product.price);
      
      let visible = true;
      
      if (query) {
        // Price filter: "under 50" or "< 50"
        if (query.includes('under') || query.includes('<')) {
          const match = query.match(/\d+/);
          if (match) {
            visible = price <= parseInt(match[0]);
          }
        } else {
          visible = name.includes(query);
        }
      }
      
      card.style.display = visible ? 'block' : 'none';
    });
    
    // Hide empty sections
    sections.forEach(section => {
      const visibleCards = section.querySelectorAll('.product-card[style*="block"], .product-card:not([style*="none"])');
      section.style.display = visibleCards.length > 0 ? 'block' : 'none';
    });
  });
}

// AI Chat with dynamic responses
function initAIChat() {
  const responses = DataManager.getAIResponses();
  
  window.getAIResponse = function(query) {
    const lower = query.toLowerCase();
    
    for (const item of responses) {
      const keywords = item.trigger_keywords.toLowerCase().split(',');
      if (keywords.some(k => lower.includes(k.trim()))) {
        return item.response;
      }
    }
    
    return "I can help you find sweets, check prices, or explain how to order! Try asking about our opening hours or delivery options.";
  };
}