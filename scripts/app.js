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

  initWhenReady();
})();
