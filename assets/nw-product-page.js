/* =====================================================
   NW IMMERSION — Product Page JavaScript
   Handles: Gallery, Accordion, FAQ, Qty, Swatches,
            Star Rating, Sliders, Scroll Animations
   ===================================================== */
'use strict';

/* ────────────────────────────────────────────────────
   GALLERY — main image swap + thumbnail active state
   ──────────────────────────────────────────────────── */
class NwGallery {
  constructor(el) {
    this.el      = el;
    this.mainImg = el.querySelector('.nw-pdp-gallery__main-img');
    this.thumbs  = Array.from(el.querySelectorAll('.nw-pdp-gallery__thumb'));
    this.current = 0;

    this.thumbs.forEach((thumb, i) => {
      thumb.addEventListener('click', () => this.setActive(i));
    });

    el.querySelector('.nw-pdp-gallery__prev')?.addEventListener('click', () => this.prev());
    el.querySelector('.nw-pdp-gallery__next')?.addEventListener('click', () => this.next());

    // Zoom lightbox
    el.querySelector('.nw-pdp-gallery__zoom')?.addEventListener('click', () => this.openLightbox());
    el.querySelector('.nw-pdp-gallery__main')?.addEventListener('click', (e) => {
      if (!e.target.closest('.nw-pdp-gallery__nav') && !e.target.closest('.nw-pdp-gallery__zoom')) {
        this.openLightbox();
      }
    });

    if (this.thumbs.length) this.setActive(0, true);
  }

  setActive(i, skipFade) {
    this.thumbs.forEach(t => t.classList.remove('is-active'));
    const thumb = this.thumbs[i];
    if (!thumb) return;
    thumb.classList.add('is-active');
    this.current = i;

    const src = thumb.querySelector('img')?.getAttribute('src');
    if (src && this.mainImg) {
      if (skipFade) {
        this.mainImg.src = src;
        return;
      }
      this.mainImg.style.opacity = '0';
      setTimeout(() => {
        // Try to get a larger version of the image from Shopify CDN
        const hiResSrc = src.replace(/(_\d+x\d+)\./i, (_, size) => '.');
        this.mainImg.src = hiResSrc || src;
        this.mainImg.style.opacity = '1';
      }, 180);
    }
  }

  prev() {
    const n = this.thumbs.length;
    this.setActive((this.current - 1 + n) % n);
  }

  next() {
    const n = this.thumbs.length;
    this.setActive((this.current + 1) % n);
  }

  openLightbox() {
    let lb = document.querySelector('.nw-gallery-lightbox');
    if (!lb) {
      lb = document.createElement('div');
      lb.className = 'nw-gallery-lightbox';
      lb.innerHTML = `
        <button class="nw-gallery-lightbox__close" aria-label="Close">&times;</button>
        <img src="" alt="">
      `;
      document.body.appendChild(lb);
      lb.addEventListener('click', (e) => {
        if (e.target === lb || e.target.closest('.nw-gallery-lightbox__close')) {
          lb.classList.remove('is-open');
        }
      });
    }
    lb.querySelector('img').src = this.mainImg?.src || '';
    lb.classList.add('is-open');
  }
}

/* ────────────────────────────────────────────────────
   ACCORDION — product info blocks
   ──────────────────────────────────────────────────── */
class NwAccordion {
  constructor(el) {
    this.el    = el;
    this.items = Array.from(el.querySelectorAll('.nw-pdp-accordion__item'));

    this.items.forEach(item => {
      item.querySelector('.nw-pdp-accordion__trigger')
        ?.addEventListener('click', () => this.toggle(item));
    });
  }

  toggle(item) {
    const isOpen = item.classList.contains('is-open');
    this.items.forEach(i => i.classList.remove('is-open'));
    if (!isOpen) item.classList.add('is-open');
  }
}

/* ────────────────────────────────────────────────────
   FAQ ACCORDION
   ──────────────────────────────────────────────────── */
class NwFaq {
  constructor(el) {
    this.el    = el;
    this.items = Array.from(el.querySelectorAll('.nw-pdp-faq__item'));

    this.items.forEach(item => {
      item.querySelector('.nw-pdp-faq__question')
        ?.addEventListener('click', () => this.toggle(item));
    });
  }

  toggle(item) {
    const isOpen = item.classList.contains('is-open');
    this.items.forEach(i => i.classList.remove('is-open'));
    if (!isOpen) item.classList.add('is-open');
  }
}

/* ────────────────────────────────────────────────────
   QUANTITY SELECTOR
   ──────────────────────────────────────────────────── */
class NwQty {
  constructor(el) {
    this.display  = el.querySelector('.nw-pdp-qty__val');
    this.hidden   = document.getElementById('nw-qty-input');
    this.min      = parseInt(this.display?.dataset.min || '1');
    this.max      = parseInt(this.display?.dataset.max || '99');
    this.val      = this.min;

    el.querySelector('[data-qty-minus]')?.addEventListener('click', () => this.change(-1));
    el.querySelector('[data-qty-plus]')?.addEventListener('click', () => this.change(1));
  }

  change(delta) {
    const next = this.val + delta;
    if (next < this.min || next > this.max) return;
    this.val = next;
    if (this.display)  this.display.textContent = this.val;
    if (this.hidden)   this.hidden.value = this.val;
  }
}

/* ────────────────────────────────────────────────────
   VARIANT SWATCH PICKER
   ──────────────────────────────────────────────────── */
class NwVariantPicker {
  constructor(el) {
    this.formEl       = el;
    this.variantInput = document.getElementById('nw-variant-id');
    this.priceEl      = document.querySelector('.nw-pdp-price-current');
    this.compareEl    = document.querySelector('.nw-pdp-price-compare');
    this.atcBtn       = document.querySelector('.nw-pdp-atc-btn');
    this.galleryEl    = document.querySelector('.nw-pdp-gallery');

    // Load variants JSON
    try {
      const raw = document.getElementById('nw-variants-json');
      this.variants = raw ? JSON.parse(raw.textContent) : [];
    } catch(e) {
      this.variants = [];
    }

    // Track selected options {position: value}
    this.selected = {};

    // Initialise with the first selected values
    el.querySelectorAll('.nw-pdp-swatch.is-selected').forEach(s => {
      const pos = s.dataset.optionPos;
      const val = s.dataset.optionVal;
      if (pos) this.selected[pos] = val;
    });

    // Attach events to all swatches
    el.querySelectorAll('.nw-pdp-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        const group = sw.closest('.nw-pdp-swatches');
        group?.querySelectorAll('.nw-pdp-swatch').forEach(s => s.classList.remove('is-selected'));
        sw.classList.add('is-selected');
        this.selected[sw.dataset.optionPos] = sw.dataset.optionVal;
        this.syncVariant();
      });
    });

    this.syncVariant();
  }

  syncVariant() {
    // Match selected options to a variant
    const match = this.variants.find(v => {
      return Object.entries(this.selected).every(([pos, val]) => {
        const idx = parseInt(pos) - 1;
        return v.options[idx] === val;
      });
    });

    if (!match) return;

    // Update variant ID in form
    if (this.variantInput) this.variantInput.value = match.id;

    // Update price
    const fmt = (cents) => {
      const amount = (cents / 100).toFixed(2);
      return window.Shopify?.currency?.active === 'USD' ? `$${amount}` : `$${amount}`;
    };
    if (this.priceEl && match.price) {
      this.priceEl.textContent = fmt(match.price);
    }
    if (this.compareEl && match.compare_at_price) {
      this.compareEl.textContent = fmt(match.compare_at_price);
      this.compareEl.style.display = match.compare_at_price > match.price ? '' : 'none';
    }

    // Update ATC button
    if (this.atcBtn) {
      const avail = match.available;
      this.atcBtn.disabled = !avail;
      this.atcBtn.textContent = avail ? 'Add to Cart' : 'Sold Out';
    }

    // Update gallery if variant has a featured image
    if (match.featured_image && this.galleryEl) {
      const gallery = this.galleryEl._nwGalleryInstance;
      if (gallery) {
        const thumbIdx = gallery.thumbs.findIndex(t => {
          const img = t.querySelector('img');
          return img && img.src.includes(match.featured_image.id);
        });
        if (thumbIdx > -1) gallery.setActive(thumbIdx);
      }
    }
  }
}

/* ────────────────────────────────────────────────────
   STAR RATING (review form)
   ──────────────────────────────────────────────────── */
class NwStarRating {
  constructor(el) {
    this.stars  = Array.from(el.querySelectorAll('.nw-pdp-star-rating-display svg'));
    this.input  = el.querySelector('[name="rating"]');
    this.rating = 0;

    this.stars.forEach((star, i) => {
      star.addEventListener('mouseenter', () => this.highlight(i + 1));
      star.addEventListener('mouseleave', () => this.highlight(this.rating));
      star.addEventListener('click',      () => this.select(i + 1));
    });
  }

  highlight(n) {
    this.stars.forEach((s, i) => {
      s.classList.toggle('is-hover',   i < n && !this.rating);
      s.classList.toggle('is-active',  i < this.rating);
    });
    // On hover, colour up to n
    this.stars.forEach((s, i) => {
      s.classList.toggle('is-hover',  i < n);
    });
  }

  select(n) {
    this.rating = n;
    this.stars.forEach((s, i) => {
      s.classList.toggle('is-active', i < n);
      s.classList.remove('is-hover');
    });
    if (this.input) this.input.value = n;
  }
}

/* ────────────────────────────────────────────────────
   STORIES SLIDER (testimonials prev/next)
   ──────────────────────────────────────────────────── */
class NwStoriesSlider {
  constructor(el) {
    this.el    = el;
    this.cards = Array.from(el.querySelectorAll('.nw-pdp-review-card'));
    this.idx   = 0;

    el.querySelector('[data-stories-prev]')?.addEventListener('click', () => this.go(-1));
    el.querySelector('[data-stories-next]')?.addEventListener('click', () => this.go(1));

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => this.render(), 150);
    });

    this.render();
  }

  perPage() {
    if (window.innerWidth < 768)  return 1;
    if (window.innerWidth < 1200) return 2;
    return 3;
  }

  go(dir) {
    const pp  = this.perPage();
    const max = Math.ceil(this.cards.length / pp) - 1;
    this.idx  = Math.max(0, Math.min(this.idx + dir, max));
    this.render();
  }

  render() {
    const pp    = this.perPage();
    const start = this.idx * pp;
    this.cards.forEach((card, i) => {
      card.style.display = (i >= start && i < start + pp) ? '' : 'none';
    });
  }
}

/* ────────────────────────────────────────────────────
   RELATED PRODUCTS SLIDER
   ──────────────────────────────────────────────────── */
class NwRelatedSlider {
  constructor(el) {
    this.el    = el;
    this.cards = Array.from(el.querySelectorAll('.nw-pdp-product-card'));
    this.idx   = 0;

    el.querySelector('[data-related-prev]')?.addEventListener('click', () => this.go(-1));
    el.querySelector('[data-related-next]')?.addEventListener('click', () => this.go(1));

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => this.render(), 150);
    });

    this.render();
  }

  perPage() {
    if (window.innerWidth < 768)  return 1;
    if (window.innerWidth < 1200) return 2;
    return 3;
  }

  go(dir) {
    const pp  = this.perPage();
    const max = Math.ceil(this.cards.length / pp) - 1;
    this.idx  = Math.max(0, Math.min(this.idx + dir, max));
    this.render();
  }

  render() {
    const pp    = this.perPage();
    const start = this.idx * pp;
    this.cards.forEach((card, i) => {
      card.style.display = (i >= start && i < start + pp) ? '' : 'none';
    });
  }
}

/* ────────────────────────────────────────────────────
   SCROLL FADE-UP ANIMATIONS (IntersectionObserver)
   ──────────────────────────────────────────────────── */
class NwScrollAnim {
  constructor() {
    const els = document.querySelectorAll('.nw-fade-up');
    if (!els.length) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    els.forEach(el => obs.observe(el));
  }
}

/* ────────────────────────────────────────────────────
   ADD TO CART — AJAX submission with feedback
   ──────────────────────────────────────────────────── */
class NwAddToCart {
  constructor(formEl) {
    this.form   = formEl;
    this.btn    = formEl.querySelector('.nw-pdp-atc-btn');
    this.origTx = this.btn?.textContent || 'Add to Cart';

    formEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this.btn || this.btn.disabled) return;

      const formData = new FormData(formEl);

      this.btn.disabled    = true;
      this.btn.textContent = 'Adding…';

      try {
        const res = await fetch('/cart/add.js', {
          method: 'POST',
          body: formData
        });
        if (!res.ok) throw new Error('Cart error');

        this.btn.textContent = 'Added ✓';
        this.btn.style.background = '#3d4e42';

        // Update cart count bubble
        try {
          const cartRes  = await fetch('/cart.js');
          const cartData = await cartRes.json();
          const bubble = document.querySelector('[data-cart-count], .cart-count-bubble');
          if (bubble) bubble.textContent = cartData.item_count;
        } catch(_) {}

        setTimeout(() => {
          this.btn.disabled    = false;
          this.btn.textContent = this.origTx;
          this.btn.style.background = '';
        }, 2200);

      } catch (err) {
        this.btn.disabled    = false;
        this.btn.textContent = 'Try Again';
        setTimeout(() => { this.btn.textContent = this.origTx; }, 2000);
      }
    });
  }
}

/* ────────────────────────────────────────────────────
   BOOT — initialise everything when DOM is ready
   ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  // Gallery
  document.querySelectorAll('.nw-pdp-gallery').forEach(el => {
    const g = new NwGallery(el);
    el._nwGalleryInstance = g;   // expose for variant picker
  });

  // Product Accordion
  document.querySelectorAll('.nw-pdp-accordion').forEach(el => new NwAccordion(el));

  // FAQ
  document.querySelectorAll('.nw-pdp-faq').forEach(el => new NwFaq(el));

  // Qty
  document.querySelectorAll('.nw-pdp-qty').forEach(el => new NwQty(el));

  // Variant Picker / Swatches
  const pdpForm = document.getElementById('nw-product-form');
  if (pdpForm) new NwVariantPicker(pdpForm);

  // ATC
  if (pdpForm) new NwAddToCart(pdpForm);

  // Star Rating
  document.querySelectorAll('.nw-pdp-review-form-box').forEach(el => new NwStarRating(el));

  // Stories Slider
  document.querySelectorAll('.nw-pdp-stories-section').forEach(el => new NwStoriesSlider(el));

  // Related slider
  document.querySelectorAll('.nw-pdp-related-section').forEach(el => new NwRelatedSlider(el));

  // Scroll animations
  new NwScrollAnim();
});
