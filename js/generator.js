// js/generator.js - HTML Generators

const HTMLGenerator = {
  // Generate side menu from sheet data
  generateSideMenu() {
    const categories = DataManager.getCategories();
    const subcategories = DataManager.getSubcategories();
    
    let html = `
      <div class="menu-header">
        <img src="${DataManager.getBusinessInfo().logo_url}" alt="Logo">
        <h2>${DataManager.getBusinessInfo().business_name}</h2>
      </div>
      <div class="menu-items">
        <div class="menu-item">
          <a href="index.html" class="menu-link" onclick="toggleMenu()">
            <span><i class="fas fa-home"></i> Home</span>
          </a>
        </div>
        <div class="menu-item">
          <a href="#" class="menu-link about-business-link" onclick="showBusinessModal(); toggleMenu()">
            <span><i class="fas fa-info-circle"></i> About Business</span>
          </a>
        </div>
    `;
    
    categories.forEach(cat => {
      const catSubs = subcategories.filter(s => s.category_id === cat.category_id);
      
      if (catSubs.length > 0) {
        html += `
          <div class="menu-item">
            <div class="menu-link" onclick="toggleSubmenu('${cat.category_id}')">
              <span><i class="fas ${cat.icon}"></i> ${cat.category_name}</span>
              <i class="fas fa-chevron-down arrow"></i>
            </div>
            <div class="submenu" id="${cat.category_id}-submenu">
        `;
        
        catSubs.forEach(sub => {
          html += `<a href="#${sub.anchor_id}" class="submenu-item" onclick="scrollToSection('${sub.anchor_id}')">${sub.subcategory_name}</a>`;
        });
        
        html += `</div></div>`;
      } else {
        html += `
          <div class="menu-item">
            <a href="#${cat.category_id.toUpperCase()}" class="menu-link" onclick="scrollToSection('${cat.category_id.toUpperCase()}')">
              <span><i class="fas ${cat.icon}"></i> ${cat.category_name}</span>
            </a>
          </div>
        `;
      }
    });
    
    html += `</div>`;
    
    // Footer with dynamic contact info
    const business = DataManager.getBusinessInfo();
    html += `
      <div class="menu-footer">
        <div class="contact-info">
          <p><i class="fas fa-phone"></i> ${business.phone}</p>
          <p><i class="fas fa-envelope"></i> ${business.email}</p>
        </div>
        <div class="social-links">
          ${this.generateSocialLinks()}
        </div>
      </div>
    `;
    
    return html;
  },
  
  // Generate social media links
  generateSocialLinks() {
    const socials = DataManager.getSocialMedia();
    return socials.map(s => `
      <a href="${s.url}" title="${s.platform}" target="_blank"><i class="${s.icon}"></i></a>
    `).join('');
  },
  
  // Generate product sections dynamically
  generateProductSections() {
    const subcategories = DataManager.getSubcategories();
    const products = DataManager.getProducts();
    
    return subcategories.map(sub => {
      const subProducts = products.filter(p => p.subcategory_id === sub.subcategory_id && p.in_stock === 'TRUE');
      
      if (subProducts.length === 0) return '';
      
      const productsHTML = subProducts.map(p => this.generateProductCard(p)).join('');
      
      return `
        <div class="content-section">
          <h2 id="${sub.anchor_id}" class="section-title">${sub.subcategory_name}</h2>
          <div class="products-grid" id="${sub.subcategory_id}Grid">
            ${productsHTML}
          </div>
        </div>
      `;
    }).join('');
  },
  
  // Generate single product card
  generateProductCard(product) {
    return `
      <div class="product-card" data-id="${product.product_id}" data-subcategory="${product.subcategory_id}" data-price="${product.price}">
        <img src="${product.image_url}" alt="${product.product_name}" class="product-image" loading="lazy">
        <div class="product-info">
          <div class="product-name">${product.product_name}</div>
          <div class="product-price">R${parseFloat(product.price).toFixed(2)}</div>
          <button class="add-to-cart-btn" onclick="addToCartFromData('${product.product_id}')">
            Add to Cart
          </button>
        </div>
      </div>
    `;
  },
  
  // Generate business modal content
  generateBusinessModal() {
    const b = DataManager.getBusinessInfo();
    return `
      <div class="business-hero">
        <img src="${b.logo_url}" alt="Logo" class="business-hero-logo">
        <h1 class="business-hero-title">${b.business_name}</h1>
        <p class="business-hero-tagline">${b.tagline}</p>
      </div>
      <div class="business-info-grid">
        <section class="business-section">
          <h2><i class="fas fa-info-circle"></i> About Us</h2>
          <p>${b.about_text}</p>
          <p><strong>Location:</strong> ${b.address}</p>
        </section>
        <section class="business-section">
          <h2><i class="fas fa-clock"></i> Opening Hours</h2>
          <ul>
            <li>Monday – Friday: ${b.monday_friday}</li>
            <li>Saturday: ${b.saturday}</li>
            <li>Sunday: ${b.sunday}</li>
          </ul>
          <h3 style="margin-top: 15px;"><i class="fas fa-phone"></i> ${b.phone}</h3>
          <p><i class="fas fa-envelope"></i> ${b.email}</p>
        </section>
        <section class="business-section business-map-section">
          <h2><i class="fas fa-map-marker-alt"></i> Find Us</h2>
          <iframe src="${b.map_embed}" width="100%" height="300" style="border:0;" allowfullscreen loading="lazy"></iframe>
        </section>
      </div>
    `;
  }
};

window.HTMLGenerator = HTMLGenerator;