// js/data.js - Data Manager for Broadway Sweets
const CONFIG = {
  // Replace with your Google Apps Script Web App URL
  API_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
  
  // Cache duration in milliseconds (5 minutes)
  CACHE_DURATION: 5 * 60 * 1000,
  
  // LocalStorage keys
  STORAGE_KEY: 'broadway_data_cache',
  LAST_FETCH_KEY: 'broadway_last_fetch'
};

const DataManager = {
  data: null,
  listeners: [],
  
  // Initialize and fetch data
  async init() {
    // Try to load from cache first for instant render
    this.loadFromCache();
    
    // Then fetch fresh data
    await this.fetchData();
    
    // Set up auto-refresh every 5 minutes
    setInterval(() => this.fetchData(), CONFIG.CACHE_DURATION);
  },
  
  // Load data from localStorage cache
  loadFromCache() {
    try {
      const cached = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (cached) {
        this.data = JSON.parse(cached);
        this.notifyListeners();
        console.log('Data loaded from cache');
      }
    } catch(e) {
      console.error('Cache load error:', e);
    }
  },
  
  // Fetch fresh data from Google Sheets
  async fetchData() {
    try {
      // Add cache-buster to prevent caching
      const url = `${CONFIG.API_URL}?action=getAllData&_=${Date.now()}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      this.data = result;
      
      // Save to localStorage
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(result));
      localStorage.setItem(CONFIG.LAST_FETCH_KEY, Date.now().toString());
      
      this.notifyListeners();
      console.log('Data refreshed from Google Sheets:', result.last_updated);
      
    } catch(error) {
      console.error('Fetch error:', error);
      // Keep using cached data if available
      if (!this.data) {
        this.loadFromCache();
      }
    }
  },
  
  // Force refresh (call this when you know data changed)
  async forceRefresh() {
    localStorage.removeItem(CONFIG.LAST_FETCH_KEY);
    await this.fetchData();
  },
  
  // Subscribe to data changes
  onUpdate(callback) {
    this.listeners.push(callback);
    // Immediately call with current data if available
    if (this.data) callback(this.data);
  },
  
  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(cb => cb(this.data));
  },
  
  // Getters for specific data
  getBusinessInfo() {
    return this.data?.business || {};
  },
  
  getCategories() {
    return this.data?.categories || [];
  },
  
  getSubcategories(categoryId) {
    const all = this.data?.subcategories || [];
    return categoryId ? all.filter(s => s.category_id === categoryId) : all;
  },
  
  getProducts(subcategoryId) {
    const all = this.data?.products || [];
    return subcategoryId ? all.filter(p => p.subcategory_id === subcategoryId) : all;
  },
  
  getProductById(id) {
    return this.data?.products?.find(p => p.product_id === id);
  },
  
  getSocialMedia() {
    return this.data?.social || [];
  },
  
  getAIResponses() {
    return this.data?.ai_responses || [];
  }
};

// Make available globally
window.DataManager = DataManager;