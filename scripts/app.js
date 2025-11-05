// scripts/app.js
// Cocktails Finder - stable init with working dropdown accordions & search

(function () {
  // --- Elements ---
  let recipeGrid, noResultsMessage, initialMessage, cardTemplate;

  let desktopAccordionContainer;
  let desktopGlasswareContainer;
  let searchInput, showBtn, clearBtn;

  // Helpers
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ------------------------------
  // Accordion wiring (desktop)
  // ------------------------------
  function setupAccordions(container) {
    if (!container) return;
    qsa(".accordion-button", container).forEach((btn) => {
      const content = btn.nextElementSibling;
      if (!content) return;

      // initial state
      const expanded = btn.getAttribute("aria-expanded") === "true";
      if (expanded) {
        content.style.maxHeight = content.scrollHeight + "px";
      } else {
        content.style.maxHeight = "0px";
      }

      btn.addEventListener("click", () => {
        const isOpen = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!isOpen));
        if (isOpen) {
          content.style.maxHeight = "0px";
        } else {
          content.style.maxHeight = content.scrollHeight + "px";
        }
      });
    });
  }

  // ------------------------------
  // Populate glassware filter
  // ------------------------------
  function populateGlasswareFilter(container, recipes) {
    if (!container || !Array.isArray(recipes)) return;
    const uniq = [...new Set(recipes.map((r) => r.glassware).filter(Boolean))].sort();
    container.innerHTML = "";
    uniq.forEach((glass) => {
      const label = document.createElement("label");
      label.className = "flex items-center space-x-2 font-normal text-slate-700 cursor-pointer";
      label.innerHTML = `
        <input type="checkbox" value="${glass}" class="filter-checkbox rounded text-blue-600 focus:ring-blue-500">
        <span>${glass}</span>
      `;
      container.appendChild(label);
    });
  }

  // ------------------------------
  // Read selected filters
  // ------------------------------
  function getSelectedFilters() {
    const selectedFlavors = qsa('#filter-flavor .filter-checkbox:checked', desktopAccordionContainer).map(el => el.value);
    const selectedDiff   = qsa('#filter-difficulty .filter-checkbox:checked', desktopAccordionContainer).map(el => el.value);
    const selectedGlass  = qsa('#filter-glassware-options .filter-checkbox:checked', desktopAccordionContainer).map(el => el.value);
    return { selectedFlavors, selectedDiff, selectedGlass };
  }

  // ------------------------------
  // Search + filter
  // ------------------------------
  function parseSearchTerms() {
    const raw = (searchInput?.value || "").toLowerCase().trim();
    // support: comma-separated OR space-separated; ignore empty entries
    return raw
      .split(/[,]+/g)
      .map(s => s.trim())
      .filter(Boolean)
      .flatMap(s => s.split(/\s+/g))
      .filter(Boolean);
  }

  function recipeMatches(recipe, terms) {
    if (!terms.length) return true;

    // index fields
    const haystack = [
      recipe.name,
      recipe.difficulty,
      recipe.glassware,
      ...(recipe.mainLiquor || []),
      ...(recipe.flavor || []),
      ...(recipe.ingredients || []),
    ]
      .filter(Boolean)
      .join(" | ")
      .toLowerCase();

    // all terms must appear somewhere
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

  // ------------------------------
  // Render cards
  // ------------------------------
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

      // Difficulty
      const diff = document.createElement("span");
      diff.className = "px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800";
      diff.textContent = r.difficulty;
      tags.appendChild(diff);

      // Flavor tags
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
    if (searchInput) searchInput.value = "";
    recipeGrid.innerHTML = "";
    recipeGrid.classList.remove("hidden");
    noResultsMessage.classList.add("hidden");
    initialMessage.classList.remove("hidden");
  }

  // ------------------------------
  // INIT (runs after DOM is ready AND recipes are loaded)
  // ------------------------------
  async function initWhenReady() {
    // Wait until DOM is ready
    await new Promise((r) => {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", r, { once: true });
      } else r();
    });

    // Wait a tick for recipes loader <script> to finish (it sets window.allRecipes)
    await new Promise((r) => setTimeout(r, 0));

    // Cache elements
    recipeGrid = qs("#recipe-grid");
    noResultsMessage = qs("#no-results");
    initialMessage = qs("#initial-message");
    cardTemplate = qs("#recipe-card-template");

    desktopAccordionContainer = qs("#filter-accordions-desktop");
    desktopGlasswareContainer = qs("#filter-glassware-options");

    searchInput = qs("#search");
    showBtn = qs("#show-recipes-desktop");
    clearBtn = qs("#clear-filters-desktop");

    // Guard
    if (!window.allRecipes) window.allRecipes = [];
    console.log("Total recipes loaded:", window.allRecipes.length);

    // Populate glassware and wire accordions
    populateGlasswareFilter(desktopGlasswareContainer, window.allRecipes);
    setupAccordions(desktopAccordionContainer);

    // Events
    showBtn?.addEventListener("click", applyFilters);
    clearBtn?.addEventListener("click", clearAll);
    // Enter key in search triggers filter
    searchInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") applyFilters();
    });

    // Initialize icons
    if (typeof lucide !== "undefined") lucide.createIcons();
  }

  // kick off
  initWhenReady();
})();
