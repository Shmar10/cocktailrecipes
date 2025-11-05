// app.js — Cocktail Finder (Search-first design, no "Main Liquor" filter)

document.addEventListener("DOMContentLoaded", () => {
  console.log("Cocktail Finder script loaded (final version)");

  // === Element references ===
  const recipeGrid = document.getElementById("recipe-grid");
  const noResultsMessage = document.getElementById("no-results");
  const initialMessage = document.getElementById("initial-message");
  const cardTemplate = document.getElementById("recipe-card-template");

  // Desktop panel
  const desktopAccordionContainer = document.getElementById("filter-accordions-desktop");
  const showRecipesButtonDesktop = document.getElementById("show-recipes-desktop");
  const clearFiltersButtonDesktop = document.getElementById("clear-filters-desktop");
  const searchInputDesktop = document.getElementById("search");

  // Mobile elements
  const mobileFilterButton = document.getElementById("mobile-filter-button");
  const filterModal = document.getElementById("filter-modal");
  const filterModalBackdrop = document.getElementById("filter-modal-backdrop");

  let mobileAccordionContainer, showRecipesButtonMobile, clearFiltersButtonMobile, searchInputMobile;

  // === Utility functions ===
  const normalize = (s) => (s || "").toString().toLowerCase().trim();

  function parseSearchTerms(raw) {
    const val = (raw || "").trim();
    if (!val) return [];
    if (val.includes(",") || val.includes(";")) {
      return val
        .split(/[;,]/g)
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => t.toLowerCase());
    }
    return [val.toLowerCase()];
  }

  function getSelectedFilters(isMobile = false) {
    const panel = isMobile ? mobileAccordionContainer : desktopAccordionContainer;
    if (!panel) return { flavors: [], difficulties: [], glassware: [] };

    const selectedFlavors = [...panel.querySelectorAll("#filter-flavor .filter-checkbox:checked")].map((el) => el.value);
    const selectedDifficulties = [...panel.querySelectorAll("#filter-difficulty .filter-checkbox:checked")].map((el) => el.value);
    const selectedGlassware = [...panel.querySelectorAll("#filter-glassware-options .filter-checkbox:checked")].map((el) => el.value);

    return { flavors: selectedFlavors, difficulties: selectedDifficulties, glassware: selectedGlassware };
  }

  // === Search Matching ===
  function termMatchesRecipe(term, recipe) {
    const t = normalize(term);

    const name = normalize(recipe.name);
    const ingredients = (recipe.ingredients || []).map(normalize);
    const flavors = (recipe.flavor || []).map(normalize);
    const glass = normalize(recipe.glassware);
    const liquors = (recipe.mainLiquor || []).map(normalize); // still searchable

    if (name.includes(t)) return true;
    if (glass.includes(t)) return true;
    if (ingredients.some((i) => i.includes(t))) return true;
    if (flavors.some((f) => f.includes(t))) return true;
    if (liquors.some((l) => l.includes(t))) return true;

    return false;
  }

  function recipeMatchesSearchTerms(terms, recipe) {
    return terms.every((term) => termMatchesRecipe(term, recipe));
  }

  // === Filtering ===
  function filterRecipes(isMobile = false) {
    const { flavors, difficulties, glassware } = getSelectedFilters(isMobile);
    const rawSearch = isMobile ? (searchInputMobile?.value || "") : (searchInputDesktop?.value || "");
    const terms = parseSearchTerms(rawSearch);

    const filtered = allRecipes.filter((recipe) => {
      const flavorOK = flavors.length === 0 || flavors.every((f) => (recipe.flavor || []).includes(f));
      const diffOK = difficulties.length === 0 || difficulties.includes(recipe.difficulty);
      const glassOK = glassware.length === 0 || glassware.includes(recipe.glassware);
      const searchOK = terms.length === 0 || recipeMatchesSearchTerms(terms, recipe);

      return flavorOK && diffOK && glassOK && searchOK;
    });

    displayRecipes(filtered);
  }

  // === Display ===
  function displayRecipes(recipes) {
    if (!recipeGrid || !initialMessage || !noResultsMessage || !cardTemplate) return;

    recipeGrid.innerHTML = "";
    initialMessage.classList.add("hidden");

    if (recipes.length === 0) {
      noResultsMessage.classList.remove("hidden");
      recipeGrid.classList.add("hidden");
      return;
    }

    noResultsMessage.classList.add("hidden");
    recipeGrid.classList.remove("hidden");

    recipes.forEach((recipe) => {
      const card = cardTemplate.content.cloneNode(true).children[0];

      const img = card.querySelector("img");
      img.src = recipe.image;
      img.alt = recipe.name;
      card.querySelector("h3").textContent = recipe.name;

      const tagsContainer = card.querySelector(".flex-wrap");
      tagsContainer.innerHTML = "";

      // Difficulty tag
      const diff = document.createElement("span");
      diff.className = "px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800";
      diff.textContent = recipe.difficulty;
      tagsContainer.appendChild(diff);

      // Flavor tags
      (recipe.flavor || []).forEach((f) => {
        const tag = document.createElement("span");
        tag.className = "px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800";
        tag.textContent = f;
        tagsContainer.appendChild(tag);
      });

      // Ingredients
      const ingredientsList = card.querySelector("ul");
      ingredientsList.innerHTML = "";
      (recipe.ingredients || []).forEach((ing) => {
        const li = document.createElement("li");
        li.textContent = ing;
        ingredientsList.appendChild(li);
      });

      // Instructions
      const instructionsList = card.querySelector("ol");
      instructionsList.innerHTML = "";
      (recipe.instructions || []).forEach((step) => {
        const li = document.createElement("li");
        li.textContent = step;
        instructionsList.appendChild(li);
      });

      recipeGrid.appendChild(card);
    });

    if (typeof lucide !== "undefined") lucide.createIcons();
  }

  // === Filter & Modal Helpers ===
  function clearFilters(isMobile = false) {
    const panel = isMobile ? mobileAccordionContainer : desktopAccordionContainer;
    if (!panel) return;

    panel.querySelectorAll(".filter-checkbox").forEach((cb) => (cb.checked = false));

    if (isMobile && searchInputMobile) searchInputMobile.value = "";
    if (!isMobile && searchInputDesktop) searchInputDesktop.value = "";

    if (isMobile && desktopAccordionContainer) {
      desktopAccordionContainer.querySelectorAll(".filter-checkbox").forEach((cb) => (cb.checked = false));
      if (searchInputDesktop) searchInputDesktop.value = "";
    }
    if (!isMobile && mobileAccordionContainer) {
      mobileAccordionContainer.querySelectorAll(".filter-checkbox").forEach((cb) => (cb.checked = false));
      if (searchInputMobile) searchInputMobile.value = "";
    }

    recipeGrid.innerHTML = "";
    recipeGrid.classList.remove("hidden");
    noResultsMessage.classList.add("hidden");
    initialMessage.classList.remove("hidden");
  }

  function populateGlasswareFilter(container) {
    if (!container) return;
    const allGlass = allRecipes.map((r) => r.glassware).filter(Boolean);
    const unique = [...new Set(allGlass)].sort();
    container.innerHTML = "";
    unique.forEach((glass) => {
      const label = document.createElement("label");
      label.className = "flex items-center space-x-2 font-normal text-slate-700 cursor-pointer";
      label.innerHTML = `
        <input type="checkbox" value="${glass}" class="filter-checkbox rounded text-blue-600 focus:ring-blue-500">
        <span>${glass}</span>
      `;
      container.appendChild(label);
    });
  }

  function setupAccordions(container) {
    if (!container) return;
    container.querySelectorAll(".accordion-button").forEach((button) => {
      const content = button.nextElementSibling;
      if (!content) return;
      button.addEventListener("click", () => {
        const isExpanded = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", !isExpanded);
        content.style.maxHeight = isExpanded ? "0px" : content.scrollHeight + "px";
      });
    });
  }

  function createMobileFilterPanel() {
    const searchInputDesktopContainer = document.getElementById("desktop-search-container");
    if (!searchInputDesktopContainer) return;
    const mobileSearchContainer = searchInputDesktopContainer.cloneNode(true);

    mobileAccordionContainer = desktopAccordionContainer.cloneNode(true);

    const mobileHeader = document.createElement("div");
    mobileHeader.className = "flex justify-between items-center mb-4 p-6 border-b border-slate-200";
    mobileHeader.innerHTML = `
      <h2 class="text-2xl font-bold text-slate-900">Filters</h2>
      <button id="close-filter-modal" class="text-slate-500 hover:text-slate-800">
        <i data-lucide="x" class="w-6 h-6"></i>
      </button>
    `;

    const mobileFooter = document.createElement("div");
    mobileFooter.className = "mt-6 p-6 border-t border-slate-200 space-y-3";
    mobileFooter.innerHTML = `
      <button id="show-recipes-mobile" class="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md">
        Show Recipes
      </button>
      <button id="clear-filters-mobile" class="w-full bg-slate-200 text-slate-800 font-semibold py-3 rounded-lg hover:bg-slate-300 transition-colors">
        Clear All
      </button>
    `;

    const mobileScrollWrapper = document.createElement("div");
    mobileScrollWrapper.className = "px-6";
    mobileScrollWrapper.appendChild(mobileSearchContainer);
    mobileScrollWrapper.appendChild(mobileAccordionContainer);

    filterModal.innerHTML = "";
    filterModal.appendChild(mobileHeader);
    filterModal.appendChild(mobileScrollWrapper);
    filterModal.appendChild(mobileFooter);

    searchInputMobile = mobileSearchContainer.querySelector("input");
    showRecipesButtonMobile = document.getElementById("show-recipes-mobile");
    clearFiltersButtonMobile = document.getElementById("clear-filters-mobile");

    const closeButton = document.getElementById("close-filter-modal");
    closeButton?.addEventListener("click", closeFilterModal);
    showRecipesButtonMobile?.addEventListener("click", () => {
      filterRecipes(true);
      closeFilterModal();
    });
    clearFiltersButtonMobile?.addEventListener("click", () => clearFilters(true));

    const mobileGlasswareContainer = mobileAccordionContainer.querySelector("#filter-glassware-options");
    populateGlasswareFilter(mobileGlasswareContainer);

    setupAccordions(mobileAccordionContainer);
    if (typeof lucide !== "undefined") lucide.createIcons();
  }

  function openFilterModal() {
    filterModalBackdrop?.classList.remove("hidden");
    filterModal?.classList.remove("hidden");
  }

  function closeFilterModal() {
    filterModalBackdrop?.classList.add("hidden");
    filterModal?.classList.add("hidden");
  }

  // === Initialization ===
  console.log(`Total recipes loaded: ${allRecipes.length}`);

  const desktopGlasswareContainer = document.getElementById("filter-glassware-options");
  populateGlasswareFilter(desktopGlasswareContainer);
  createMobileFilterPanel();
  setupAccordions(desktopAccordionContainer);

  showRecipesButtonDesktop?.addEventListener("click", () => filterRecipes(false));
  clearFiltersButtonDesktop?.addEventListener("click", () => clearFilters(false));
  mobileFilterButton?.addEventListener("click", openFilterModal);
  filterModalBackdrop?.addEventListener("click", closeFilterModal);

  if (typeof lucide !== "undefined") lucide.createIcons();
});
