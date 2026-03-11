/**
 * NW Shop Page — Filter / Sort / Search / URL State System
 * Converted from nw-shop-page-v3.html for Shopify
 *
 * Data is injected from the Liquid section via:
 *   window.NWShopData = { categories: [...], products: [...], types: [...] }
 */
const NWShop = (() => {
  'use strict';

  // ──────────────────────────────────────────────
  // DATA — Injected from Liquid
  // ──────────────────────────────────────────────
  const CATEGORIES = (window.NWShopData && window.NWShopData.categories) || [];
  const PRODUCTS   = (window.NWShopData && window.NWShopData.products)   || [];
  const TYPES      = (window.NWShopData && window.NWShopData.types)      || [];

  // ──────────────────────────────────────────────
  // STATE
  // ──────────────────────────────────────────────
  let state = {
    selectedCategories: [],
    selectedTypes: [],
    searchTerm: '',
    sortBy: '',
    _categoriesVisible: false,
  };

  let searchTimeout = null;

  // ──────────────────────────────────────────────
  // DOM HELPERS
  // ──────────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const $id = (id) => document.getElementById(id);

  // ──────────────────────────────────────────────
  // INIT
  // ──────────────────────────────────────────────
  function init() {
    // Bail if no shop section on page
    if (!$id('nwProductsGrid')) return;

    buildSidebarCheckboxes();
    bindEvents();
    restoreFromURL();
    renderProducts();
    updateUI();
  }

  // ──────────────────────────────────────────────
  // EVENT BINDINGS
  // ──────────────────────────────────────────────
  function bindEvents() {
    // Sort
    const sortEl = $id('nw-sort');
    if (sortEl) {
      sortEl.addEventListener('change', () => {
        state.sortBy = sortEl.value;
        renderProducts();
      });
    }

    // Search (debounced)
    const searchEl = $id('nw-search');
    if (searchEl) {
      searchEl.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          state.searchTerm = searchEl.value.trim();
          renderProducts();
          updateUI();
        }, 300);
      });

      searchEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          clearTimeout(searchTimeout);
          state.searchTerm = searchEl.value.trim();
          renderProducts();
          updateUI();
        }
      });
    }

    // Search button click
    const searchBtn = $('.nw-search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        clearTimeout(searchTimeout);
        state.searchTerm = $id('nw-search').value.trim();
        renderProducts();
        updateUI();
      });
    }

    // Filter button → toggle categories
    const filterBtn = $id('nwFilterBtn');
    if (filterBtn) {
      filterBtn.addEventListener('click', toggleCategories);
    }

    // Refine button → open sidebar
    const refineBtn = $id('nwRefineBtn');
    if (refineBtn) {
      refineBtn.addEventListener('click', openSidebar);
    }

    // Sidebar close + apply
    const closeBtn = $id('nwCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);

    const overlay = $id('nwSidebarOverlay');
    if (overlay) overlay.addEventListener('click', closeSidebar);

    const applyBtn = $id('nwApplyFilters');
    if (applyBtn) applyBtn.addEventListener('click', closeSidebar);

    // Clear all filters
    const clearBtn = $id('nw-clear-all-filters');
    if (clearBtn) clearBtn.addEventListener('click', clearAllFilters);

    // Category grid clicks
    $$('.nw-cat-large, .nw-tile').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        selectCategory(el, e);
      });
    });

    // Keyboard: Escape to close sidebar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeSidebar();
    });
  }

  // ──────────────────────────────────────────────
  // BUILD SIDEBAR CHECKBOXES (Categories + Types)
  // ──────────────────────────────────────────────
  function buildSidebarCheckboxes() {
    // Categories
    const catContainer = $id('nwSidebarCategories');
    if (catContainer && CATEGORIES.length) {
      catContainer.innerHTML = CATEGORIES.map(cat => `
        <div class="nw-sidebar-checkbox">
          <input type="checkbox" id="nw-cat-${cat.id}" value="${cat.slug}" data-cat-id="${cat.id}">
          <label for="nw-cat-${cat.id}">${cat.name} <span class="count">(${cat.count})</span></label>
        </div>
      `).join('');

      catContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', () => {
          const slug = cb.value;
          if (cb.checked) {
            if (!state.selectedCategories.includes(slug)) {
              state.selectedCategories.push(slug);
            }
          } else {
            state.selectedCategories = state.selectedCategories.filter(c => c !== slug);
          }
          renderProducts();
          updateUI();
        });
      });
    }

    // Types
    const typeContainer = $id('nwSidebarTypes');
    if (typeContainer && TYPES.length) {
      typeContainer.innerHTML = TYPES.map(t => `
        <div class="nw-sidebar-checkbox">
          <input type="checkbox" id="nw-type-${t.slug}" value="${t.slug}">
          <label for="nw-type-${t.slug}">${t.name} <span class="count">(${t.count})</span></label>
        </div>
      `).join('');

      typeContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', () => {
          const slug = cb.value;
          if (cb.checked) {
            if (!state.selectedTypes.includes(slug)) {
              state.selectedTypes.push(slug);
            }
          } else {
            state.selectedTypes = state.selectedTypes.filter(t => t !== slug);
          }
          renderProducts();
          updateUI();
        });
      });
    }
  }

  // ──────────────────────────────────────────────
  // TOGGLE CATEGORIES SECTION
  // ──────────────────────────────────────────────
  function toggleCategories() {
    const catWrap = $id('nwCategoriesWrap');
    const btn = $id('nwFilterBtn');
    if (!catWrap || !btn) return;

    state._categoriesVisible = !state._categoriesVisible;

    if (state._categoriesVisible) {
      catWrap.classList.remove('hidden');
      btn.classList.add('active');
      catWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      catWrap.classList.add('hidden');
      btn.classList.remove('active');
    }
  }

  // ──────────────────────────────────────────────
  // CATEGORY GRID CLICK
  // ──────────────────────────────────────────────
  function selectCategory(el, evt) {
    const cat = el.dataset.category;
    if (!cat) return;

    const isMulti = evt.ctrlKey || evt.metaKey;

    if (isMulti) {
      const idx = state.selectedCategories.indexOf(cat);
      if (idx > -1) {
        state.selectedCategories.splice(idx, 1);
      } else {
        state.selectedCategories.push(cat);
      }
    } else {
      state.selectedCategories = [cat];
    }

    // Hide category grid after selecting
    const catWrap = $id('nwCategoriesWrap');
    if (catWrap) catWrap.classList.add('hidden');
    const btn = $id('nwFilterBtn');
    if (btn) btn.classList.remove('active');
    state._categoriesVisible = false;

    syncSidebarCheckboxes();
    renderProducts();
    updateUI();
  }

  // ──────────────────────────────────────────────
  // SYNC SIDEBAR CHECKBOXES WITH STATE
  // ──────────────────────────────────────────────
  function syncSidebarCheckboxes() {
    const catContainer = $id('nwSidebarCategories');
    if (catContainer) {
      catContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = state.selectedCategories.includes(cb.value);
      });
    }
    const typeContainer = $id('nwSidebarTypes');
    if (typeContainer) {
      typeContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = state.selectedTypes.includes(cb.value);
      });
    }
  }

  // ──────────────────────────────────────────────
  // SIDEBAR OPEN / CLOSE
  // ──────────────────────────────────────────────
  function openSidebar() {
    const overlay = $id('nwSidebarOverlay');
    const sidebar = $id('nwSidebar');
    if (overlay) overlay.classList.add('active');
    if (sidebar) sidebar.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    const overlay = $id('nwSidebarOverlay');
    const sidebar = $id('nwSidebar');
    if (overlay) overlay.classList.remove('active');
    if (sidebar) sidebar.classList.remove('active');
    document.body.style.overflow = '';
  }

  // ──────────────────────────────────────────────
  // CLEAR FILTERS
  // ──────────────────────────────────────────────
  function clearAllFilters() {
    state.selectedCategories = [];
    state.selectedTypes = [];
    state.searchTerm = '';
    state.sortBy = '';
    const searchEl = $id('nw-search');
    if (searchEl) searchEl.value = '';
    const sortEl = $id('nw-sort');
    if (sortEl) sortEl.value = '';
    syncSidebarCheckboxes();
    renderProducts();
    updateUI();
  }

  function removeFilterTag(type, value) {
    if (type === 'category') {
      state.selectedCategories = state.selectedCategories.filter(c => c !== value);
    } else if (type === 'type') {
      state.selectedTypes = state.selectedTypes.filter(t => t !== value);
    } else if (type === 'search') {
      state.searchTerm = '';
      const searchEl = $id('nw-search');
      if (searchEl) searchEl.value = '';
    }
    syncSidebarCheckboxes();
    renderProducts();
    updateUI();
  }

  // ──────────────────────────────────────────────
  // FUZZY SEARCH (client-side)
  // ──────────────────────────────────────────────
  function fuzzyMatch(text, query) {
    const lower = text.toLowerCase();
    const q = query.toLowerCase();
    if (lower.includes(q)) return true;
    let idx = 0;
    for (let i = 0; i < lower.length && idx < q.length; i++) {
      if (lower[i] === q[idx]) idx++;
    }
    return idx === q.length;
  }

  // ──────────────────────────────────────────────
  // FILTER + SORT
  // ──────────────────────────────────────────────
  function getFilteredProducts() {
    let filtered = [...PRODUCTS];

    // Filter by categories
    if (state.selectedCategories.length > 0) {
      filtered = filtered.filter(p => {
        // Support products with multiple categories (comma-separated or array)
        const cats = Array.isArray(p.categories) ? p.categories : [p.category];
        return cats.some(c => state.selectedCategories.includes(c));
      });
    }

    // Filter by type
    if (state.selectedTypes.length > 0) {
      filtered = filtered.filter(p => {
        const types = Array.isArray(p.types) ? p.types : (p.type ? [p.type] : []);
        return types.some(t => state.selectedTypes.includes(t));
      });
    }

    // Filter by search
    if (state.searchTerm) {
      filtered = filtered.filter(p => fuzzyMatch(p.name, state.searchTerm));
    }

    // Sort
    switch (state.sortBy) {
      case 'price':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'title':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'date_asc':
        filtered.sort((a, b) => a.id - b.id);
        break;
      case 'popularity':
      case 'date':
        filtered.sort((a, b) => b.id - a.id);
        break;
    }

    return filtered;
  }

  // ──────────────────────────────────────────────
  // RENDER PRODUCTS
  // ──────────────────────────────────────────────
  function renderProducts() {
    const grid = $id('nwProductsGrid');
    const noProducts = $id('nw-no-products');
    if (!grid) return;

    const products = getFilteredProducts();

    if (products.length === 0) {
      grid.innerHTML = '';
      if (noProducts) noProducts.style.display = 'block';
      const countEl = $id('nwResultsCount');
      if (countEl) countEl.textContent = '0 products found';
      return;
    }

    if (noProducts) noProducts.style.display = 'none';

    grid.innerHTML = products.map(p => {
      const hasOriginal = p.originalPrice && p.originalPrice > p.price;
      const formattedPrice = '$' + p.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const formattedOriginal = hasOriginal ? '$' + p.originalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';

      const priceHTML = hasOriginal
        ? `<del>${formattedOriginal}</del> <ins>${formattedPrice}</ins>`
        : formattedPrice;

      return `
        <div class="nw-product-card" data-id="${p.id}" data-category="${p.category || ''}" data-price="${p.price}" data-sku="${p.sku || ''}">
          <a href="${p.href}" class="nw-product-media" style="background-image:url('${p.image}')"></a>
          <div class="nw-product-content">
            <div class="nw-price-title-wrap">
              <a href="${p.href}" class="nw-product-title">${p.name}</a>
              <div class="nw-product-price">${priceHTML}</div>
            </div>
            <div class="nw-product-btns">
              <a href="${p.href}" class="nw-product-cta add-to-cart-btn" data-product-id="${p.id}">Add to Cart</a>
              <a class="nw-product-cta see-details-btn" href="${p.href}">See Details</a>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const countEl = $id('nwResultsCount');
    if (countEl) countEl.textContent = `Showing ${products.length} of ${PRODUCTS.length} products`;

    // Bind Add to Cart buttons (Shopify AJAX cart)
    grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const productId = btn.dataset.productId;
        // If Shopify variant ID is available, use AJAX cart
        if (productId && window.Shopify) {
          addToCartAjax(productId, btn);
        } else {
          showToast('Added to cart!');
        }
      });
    });
  }

  // ──────────────────────────────────────────────
  // SHOPIFY AJAX ADD TO CART
  // ──────────────────────────────────────────────
  function addToCartAjax(variantId, btn) {
    const originalText = btn.textContent;
    btn.textContent = 'Adding...';
    btn.style.pointerEvents = 'none';

    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ id: parseInt(variantId), quantity: 1 }] })
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to add');
      return res.json();
    })
    .then(() => {
      showToast('Added to cart!');
      btn.textContent = 'Added ✓';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.pointerEvents = '';
      }, 1500);
      // Dispatch event for cart drawer / icon update
      document.dispatchEvent(new CustomEvent('cart:updated'));
    })
    .catch(() => {
      showToast('Could not add to cart');
      btn.textContent = originalText;
      btn.style.pointerEvents = '';
    });
  }

  // ──────────────────────────────────────────────
  // UPDATE UI
  // ──────────────────────────────────────────────
  function updateUI() {
    const totalFilters = state.selectedCategories.length +
                         state.selectedTypes.length +
                         (state.searchTerm ? 1 : 0);
    const hasFilters = totalFilters > 0;

    // Active filters bar
    const filtersBar = $id('nw-active-filters');
    if (filtersBar) {
      if (hasFilters) {
        filtersBar.classList.add('visible');
      } else {
        filtersBar.classList.remove('visible');
      }
    }

    // Filter count badge
    const badge = $id('nwFilterCount');
    if (badge) {
      if (totalFilters > 0) {
        badge.textContent = totalFilters;
        badge.classList.add('visible');
      } else {
        badge.classList.remove('visible');
      }
    }

    // Build filter tags
    const tagsContainer = $id('nw-filter-tags');
    if (tagsContainer) {
      let tagsHTML = '';

      state.selectedCategories.forEach(slug => {
        const cat = CATEGORIES.find(c => c.slug === slug);
        if (cat) {
          tagsHTML += buildTagHTML('category', slug, cat.name);
        }
      });

      state.selectedTypes.forEach(slug => {
        const t = TYPES.find(x => x.slug === slug);
        if (t) {
          tagsHTML += buildTagHTML('type', slug, t.name);
        }
      });

      if (state.searchTerm) {
        tagsHTML += buildTagHTML('search', '', 'Search: "' + state.searchTerm + '"');
      }

      tagsContainer.innerHTML = tagsHTML;
    }

    updateURL();
  }

  function buildTagHTML(type, value, label) {
    return `
      <span class="nw-filter-tag">
        ${label}
        <span class="remove-tag" onclick="NWShop.removeFilterTag('${type}', '${value}')">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M1 1l12 12M13 1L1 13"/>
          </svg>
        </span>
      </span>
    `;
  }

  // ──────────────────────────────────────────────
  // URL STATE
  // ──────────────────────────────────────────────
  function updateURL() {
    const params = new URLSearchParams();
    if (state.selectedCategories.length) params.set('category', state.selectedCategories.join(','));
    if (state.selectedTypes.length) params.set('type', state.selectedTypes.join(','));
    if (state.searchTerm) params.set('search', state.searchTerm);
    if (state.sortBy) params.set('sort', state.sortBy);

    const qs = params.toString();
    const url = window.location.pathname + (qs ? '?' + qs : '');
    history.replaceState(null, '', url);
  }

  function restoreFromURL() {
    const params = new URLSearchParams(window.location.search);

    if (params.has('category')) {
      state.selectedCategories = params.get('category').split(',').filter(Boolean);
    }
    if (params.has('type')) {
      state.selectedTypes = params.get('type').split(',').filter(Boolean);
    }
    if (params.has('search')) {
      state.searchTerm = params.get('search');
      const searchEl = $id('nw-search');
      if (searchEl) searchEl.value = state.searchTerm;
    }
    if (params.has('sort')) {
      state.sortBy = params.get('sort');
      const sortEl = $id('nw-sort');
      if (sortEl) sortEl.value = state.sortBy;
    }

    syncSidebarCheckboxes();
  }

  // ──────────────────────────────────────────────
  // TOAST NOTIFICATION
  // ──────────────────────────────────────────────
  function showToast(msg) {
    const toast = $id('nwToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 2500);
  }

  // ──────────────────────────────────────────────
  // BOOT
  // ──────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);

  // ──────────────────────────────────────────────
  // PUBLIC API
  // ──────────────────────────────────────────────
  return {
    removeFilterTag,
    showToast,
    toggleCategories,
    openSidebar,
    closeSidebar,
  };
})();
