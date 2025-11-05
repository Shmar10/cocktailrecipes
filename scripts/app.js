// scripts/app.js
(function () {
  let recipeGrid, noResultsMessage, initialMessage, cardTemplate;
  let desktopAccordionContainer;
  let desktopGlasswareContainer;
  let searchInputDesktop, searchInputMobile, showBtn, clearBtn;

  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function setupAccordions(container) {
    if (!container) return;
    qsa(".accordion-button", container).forEach((btn) => {
      const content = btn.nextElementSibling;
      if (!content) return;
      const expanded = btn.getAttribute("aria-expanded") === "true";
      content.style.maxHeight = expanded ? content.scrollHeight + "px" : "0px";
      btn.addEventListener("click", () => {
        const isOpen = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!isOpen));
        content.style.maxHeight = isOpen ? "0px" : content.scrollHeight + "px";
      });
    });
  }

  function populateGlasswareFilter(container, recipes) {
    if (!container || !Array.isArray(recipes)) return;
    const uniq = [...new Set(recipes.map((r) => r.glassware).filter(Boolean))].sort();
    container.innerHTML = "";
    uniq.forEach((glass) => {
      const label = document.createElement("label");
      label.className = "flex items-center space-x-2 font-normal text-slate-700 cursor-pointer";
      label.innerHTML = `
        <input type="checkbox" value="${glass}" class="filter-checkbox rounded text-blue-600 focus:ring-blue-500">
        <span>${glass}</span>`;
      container.appendChild(label);
    });
  }

  function getSelectedFilters() {
    const selectedFlavors = qsa('#filter-flavor .filter-checkbox:checked', desktopAccordionContainer).map(el => el.value);
    const selectedDiff   = qsa('#filter-difficulty .filter-checkbox:checked', desktopAccordionContainer).map(el => el.value);
    const selectedGlass  = qsa('#filter-glassware-options .filter-checkbox:checked', desktopAccordionContainer).map(el => el.value);
    return { selectedFlavors, selectedDiff, selectedGlass };
  }

  function parseSearchTerms() {
    const d = (searchInputDesktop?.value || "").toLowerCase().trim();
    const m = (searchInputMobile?.value || "").toLowerCase().trim();
    const raw = [d, m].filter(Boolean).join(","); // merge both boxes
    return raw
      .split(/[,]+/g)
      .map(s => s.trim())
      .filter(Boolean)
      .flatMap(s => s.split(/\s+/g))
      .filter(Boolean);
  }

  function recipeMatches(recipe, terms) {
    if (!terms.length) return true;
    const haystack = [
      recipe.name,
      recipe.difficulty,
      recipe.glassware,
      ...(recipe.mainLiquor || []),
      ...(recipe.flavor || []),
      ...(recipe.ingredients || []),
    ].filter(Boolean).join(" | ").toLowerCase();
    return terms.every((t) => haystack.includes(t));
  }

  function applyFilters() {
    const { selectedFlavors, selectedDiff, selectedGlass } = getSelectedFilters();
    const terms = parseSearchTerms();

    const filtered = (window.allRecipes || []).filter((r) => {
      const flavorOK = !selectedFlavors.length || selectedFlavors.every((f) => (r.flavor || []).includes(f));
      const diffOK   = !selectedDiff.length   || selectedDiff.includes(r.difficulty);
      const glassOK  = !selectedGlass.length  || selectedGlass.includes(r.glassware);
      const textOK   = recipeMatches(r, terms);
      return flavorOK && diffOK && glassOK && textOK;
    });

    renderCards(filtered);
  }

  function renderCards(recipes) {
    recipeGrid.innerHTML = "";
    initialMessage.classList.add("hidden");
    if (!recipes.length) {
      noResultsMessage.classList.remove("hidden");
      recipeGrid.classList.add("hidden");
      return;
    }
    noResultsMessage.classList.add("hidden");
    recipeGrid.classList.remove("hidden");

    recipes.forEach((r) => {
      const card = cardTemplate.content.cloneNode(true).children[0];
      const img = qs("img", card);
      img.src = r.image;
      img.alt = r.name;
      qs("h3", card).textContent = r.name;

      const tags = qs(".flex-wrap", card);
      tags.innerHTML = "";
      const diff = document.createElement("span");
      diff.className = "px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800";
      diff.textContent = r.difficulty;
      tags.appendChild(diff);
      (r.flavor || []).forEach((f) => {
        const span = document.createElement("span");
        span.className = "px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800";
        span.textContent = f;
        tags.appendChild(span);
      });

      const ul = qs("ul", card);
      (r.ingredients || []).forEach((ing) => {
        const li = document.createElement("li");
        li.textContent = ing;
        ul.appendChild(li);
      });

      const ol = qs("ol", card);
      (r.instructions || []).forEach((step) => {
        const li = document.createElement("li");
        li.textContent = step;
        ol.appendChild(li);
      });

      recipeGrid.appendChild(card);
    });

    if (typeof lucide !== "undefined") lucide.createIcons();
  }

  function clearAll() {
    qsa(".filter-checkbox", desktopAccordionContainer).forEach((cb) => (cb.checked = false));
    if (searchInputDesktop) searchInputDesktop.value = "";
    if (searchInputMobile)  searchInputMobile.value  = "";
    recipeGrid.innerHTML = "";
    recipeGrid.classList.remove("hidden");
    noResultsMessage.classList.add("hidden");
    initialMessage.classList.remove("hidden");
  }

  async function initWhenReady() {
    await new Promise((r) => {
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", r, { once: true });
      else r();
    });
    await new Promise((r) => setTimeout(r, 0));

    recipeGrid = qs("#recipe-grid");
    noResultsMessage = qs("#no-results");
    initialMessage = qs("#initial-message");
    cardTemplate = qs("#recipe-card-template");

    desktopAccordionContainer = qs("#filter-accordions-desktop");
    desktopGlasswareContainer = qs("#filter-glassware-options");

    searchInputDesktop = qs("#search");
    searchInputMobile  = qs("#search-mobile");
    showBtn = qs("#show-recipes-desktop");
    clearBtn = qs("#clear-filters-desktop");

    if (!window.allRecipes) window.allRecipes = [];
    console.log("Total recipes loaded:", window.allRecipes.length);

    populateGlasswareFilter(desktopGlasswareContainer, window.allRecipes);
    setupAccordions(desktopAccordionContainer);

    showBtn?.addEventListener("click", applyFilters);
    clearBtn?.addEventListener("click", clearAll);

    searchInputDesktop?.addEventListener("keydown", (e) => { if (e.key === "Enter") applyFilters(); });
    searchInputMobile ?.addEventListener("keydown", (e) => { if (e.key === "Enter") applyFilters(); });

    if (typeof lucide !== "undefined") lucide.createIcons();
  }

  /* -----------------------------
   Mobile Filters: slide-in modal
--------------------------------*/
(() => {
  const btn        = document.getElementById('mobile-filter-button');
  const modal      = document.getElementById('filter-modal');
  const backdrop   = document.getElementById('filter-modal-backdrop');
  const desktopBox = document.querySelector('#desktop-filter-panel > div'); // inner wrapper
  const desktopApplyBtn = document.getElementById('show-recipes-desktop');

  if (!btn || !modal || !backdrop || !desktopBox) return;

  // Build the mobile panel content once (on first open)
  const buildMobilePanel = () => {
    // Basic shell (close + content container + apply/clear)
    modal.innerHTML = `
      <div class="h-full flex flex-col">
        <div class="flex items-center justify-between p-4 border-b">
          <h2 class="text-xl font-semibold">Filters</h2>
          <button id="mobile-close" class="p-2 rounded hover:bg-slate-100" aria-label="Close filters">
            ✕
          </button>
        </div>
        <div id="mobile-filters-content" class="flex-1 overflow-y-auto p-4 space-y-4"></div>
        <div class="p-4 border-t grid grid-cols-2 gap-3">
          <button id="mobile-clear" class="w-full border border-slate-300 rounded-lg py-2 font-medium hover:bg-slate-50">Clear</button>
          <button id="mobile-apply" class="w-full bg-blue-600 text-white rounded-lg py-2 font-semibold hover:bg-blue-700">Apply</button>
        </div>
      </div>
    `;

    // Clone desktop filter UI into mobile content area
    const content = modal.querySelector('#mobile-filters-content');
    const clone = desktopBox.cloneNode(true);

    // Remove sticky/width classes that don’t make sense in the drawer
    clone.classList.remove('sticky', 'top-6', 'md:sticky', 'md:top-6', 'pr-6');

    // Avoid duplicate IDs by stripping id attributes inside the clone
    clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));

    content.appendChild(clone);

    // Re-render Lucide icons inside the newly injected HTML (if available)
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }

    // Wire up buttons
    modal.querySelector('#mobile-close').addEventListener('click', closeModal);
    modal.querySelector('#mobile-clear').addEventListener('click', () => {
      // Clear all checkboxes & the search field (both mobile and desktop, to keep in sync)
      document.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = false; });
      const searchInputs = document.querySelectorAll('input#search');
      searchInputs.forEach(inp => { inp.value = ''; });
    });

    modal.querySelector('#mobile-apply').addEventListener('click', () => {
      // Trigger the same apply behavior as desktop
      if (desktopApplyBtn) desktopApplyBtn.click();
      closeModal();
    });

    // Keep search fields synced (typing in mobile mirrors desktop)
    const mobileSearch = modal.querySelector('input#search');
    const desktopSearch = document.querySelector('#desktop-filter-panel input#search');
    if (mobileSearch && desktopSearch) {
      mobileSearch.addEventListener('input', () => { desktopSearch.value = mobileSearch.value; });
      desktopSearch.addEventListener('input', () => { mobileSearch.value = desktopSearch.value; });
    }
  };

  const openModal = () => {
    if (!modal.hasChildNodes()) buildMobilePanel();
    modal.classList.remove('hidden');
    backdrop.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.add('hidden');
    backdrop.classList.add('hidden');
    document.body.style.overflow = '';
  };

  // Open
  btn.addEventListener('click', openModal);

  // Close on backdrop or Esc
  backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
  });
})();


  initWhenReady();
})();
