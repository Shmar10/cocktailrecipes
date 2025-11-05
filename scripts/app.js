(function () {
  const state = { allRecipes: [], isLoaded: false };

  const recipeGrid = document.getElementById("recipe-grid");
  const noResultsMessage = document.getElementById("no-results");
  const initialMessage = document.getElementById("initial-message");
  const cardTemplate = document.getElementById("recipe-card-template");

  const desktopAccordionContainer = document.getElementById("filter-accordions-desktop");

  const showRecipesButtonDesktop = document.getElementById("show-recipes-desktop");
  const clearFiltersButtonDesktop = document.getElementById("clear-filters-desktop");
  const searchInputDesktop = document.getElementById("search");

  const mobileFilterButton = document.getElementById("mobile-filter-button");
  const filterModal = document.getElementById("filter-modal");
  const filterModalBackdrop = document.getElementById("filter-modal-backdrop");

  let mobileAccordionContainer, showRecipesButtonMobile, clearFiltersButtonMobile, searchInputMobile;

  document.body.setAttribute("data-js-enabled", "true");
  fetch("./data/recipes.json")
    .then((res) => res.json())
    .then((data) => {
      state.allRecipes = Array.isArray(data) ? data : [];
      state.isLoaded = true;
      console.log(`Total recipes loaded: ${state.allRecipes.length}`);
      populateGlasswareFilter(document.getElementById("filter-glassware-options"));
      createMobileFilterPanel();
      setupAccordions(desktopAccordionContainer);
      initEvents();
      if (window.lucide) lucide.createIcons();
    })
    .catch((err) => {
      console.error("Failed to load recipes.json", err);
      if (initialMessage) {
        initialMessage.innerHTML = `<p class="text-red-600">Error loading recipes. Check <code>data/recipes.json</code>.</p>`;
      }
    });

  function createMobileFilterPanel() {
    const searchInputDesktopContainer = document.getElementById("desktop-search-container");
    if (!searchInputDesktopContainer || !desktopAccordionContainer || !filterModal) return;

    const mobileSearchContainer = searchInputDesktopContainer.cloneNode(true);
    mobileAccordionContainer = desktopAccordionContainer.cloneNode(true);

    const mobileHeader = document.createElement("div");
    mobileHeader.className = "flex justify-between items-center mb-4 p-6 border-b border-slate-200";
    mobileHeader.innerHTML = `
      <h2 class="text-2xl font-bold text-slate-900">Filters</h2>
      <button id="close-filter-modal" class="text-slate-500 hover:text-slate-800" aria-label="Close filters">
        <i data-lucide="x" class="w-6 h-6" aria-hidden="true"></i>
      </button>`;

    const mobileFooter = document.createElement("div");
    mobileFooter.className = "mt-6 p-6 border-t border-slate-200 space-y-3";
    mobileFooter.innerHTML = `
      <button id="show-recipes-mobile" class="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md">Show Recipes</button>
      <button id="clear-filters-mobile" class="w-full bg-slate-200 text-slate-800 font-semibold py-3 rounded-lg hover:bg-slate-300 transition-colors">Clear All</button>`;

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
    if (closeButton) closeButton.addEventListener("click", closeFilterModal);
    if (showRecipesButtonMobile) showRecipesButtonMobile.addEventListener("click", () => { filterRecipes(true); closeFilterModal(); });
    if (clearFiltersButtonMobile) clearFiltersButtonMobile.addEventListener("click", () => clearFilters(true));

    const mobileGlasswareContainer = mobileAccordionContainer.querySelector("#filter-glassware-options");
    if (mobileGlasswareContainer) populateGlasswareFilter(mobileGlasswareContainer);

    setupAccordions(mobileAccordionContainer);
    if (window.lucide) lucide.createIcons();
  }

  function openFilterModal() {
    if (filterModalBackdrop) filterModalBackdrop.classList.remove("hidden");
    if (filterModal) filterModal.classList.remove("hidden");
  }
  function closeFilterModal() {
    if (filterModalBackdrop) filterModalBackdrop.classList.add("hidden");
    if (filterModal) filterModal.classList.add("hidden");
  }

  function setupAccordions(container) {
    if (!container) return;
    container.querySelectorAll(".accordion-button").forEach((button) => {
      const content = button.nextElementSibling;
      if (!content) return;
      button.addEventListener("click", () => {
        const isExpanded = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", String(!isExpanded));
        content.style.maxHeight = isExpanded ? "0px" : content.scrollHeight + "px";
      });
    });
  }

  function getSelectedFilters(isMobile = false) {
    const panel = isMobile ? mobileAccordionContainer : desktopAccordionContainer;
    if (!panel) return { liquors: [], flavors: [], difficulties: [], glassware: [] };

    const selectedLiquors = [...panel.querySelectorAll('#filter-liquor .filter-checkbox:checked')].map((el) => el.value);
    const selectedFlavors = [...panel.querySelectorAll('#filter-flavor .filter-checkbox:checked')].map((el) => el.value);
    const selectedDifficulties = [...panel.querySelectorAll('#filter-difficulty .filter-checkbox:checked')].map((el) => el.value);
    const selectedGlassware = [...panel.querySelectorAll('#filter-glassware-options .filter-checkbox:checked')].map((el) => el.value);

    return { liquors: selectedLiquors, flavors: selectedFlavors, difficulties: selectedDifficulties, glassware: selectedGlassware };
  }

  function filterRecipes(isMobile = false) {
    const { liquors, flavors, difficulties, glassware } = getSelectedFilters(isMobile);
    const searchTerm = (isMobile ? (searchInputMobile?.value || "") : (searchInputDesktop?.value || "")).toLowerCase().trim();

    const filtered = state.allRecipes.filter((recipe) => {
      const liquorMatch = liquors.length === 0 || recipe.mainLiquor.some((l) => liquors.includes(l));
      const flavorMatch = flavors.length === 0 || flavors.every((f) => recipe.flavor.includes(f));
      const difficultyMatch = difficulties.length === 0 || difficulties.includes(recipe.difficulty);
      const glasswareMatch = glassware.length === 0 || glassware.includes(recipe.glassware);
      const nameMatch = recipe.name.toLowerCase().includes(searchTerm);
      const ingredientsMatch = recipe.ingredients.some((ing) => ing.toLowerCase().includes(searchTerm));
      const searchMatch = searchTerm === "" || nameMatch || ingredientsMatch;
      return liquorMatch && flavorMatch && difficultyMatch && glasswareMatch && searchMatch;
    });

    displayRecipes(filtered);
  }

  function displayRecipes(recipes) {
    if (!recipeGrid || !initialMessage || !noResultsMessage || !cardTemplate) return;

    recipeGrid.setAttribute("aria-busy", "true");
    recipeGrid.innerHTML = "";
    initialMessage.classList.add("hidden");

    if (recipes.length === 0) {
      noResultsMessage.classList.remove("hidden");
      recipeGrid.classList.add("hidden");
    } else {
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

        const difficultyTag = document.createElement("span");
        difficultyTag.className = "px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800";
        difficultyTag.textContent = recipe.difficulty;
        tagsContainer.appendChild(difficultyTag);

        recipe.flavor.forEach((f) => {
          const t = document.createElement("span");
          t.className = "px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800";
          t.textContent = f;
          tagsContainer.appendChild(t);
        });

        const ul = card.querySelector("ul");
        recipe.ingredients.forEach((ing) => {
          const li = document.createElement("li");
          li.textContent = ing;
          ul.appendChild(li);
        });

        const ol = card.querySelector("ol");
        recipe.instructions.forEach((step) => {
          const li = document.createElement("li");
          li.textContent = step;
          ol.appendChild(li);
        });

        recipeGrid.appendChild(card);
      });

      if (window.lucide) lucide.createIcons();
    }

    recipeGrid.setAttribute("aria-busy", "false");
  }

  function clearFilters(isMobile = false) {
    const panel = isMobile ? mobileAccordionContainer : desktopAccordionContainer;
    if (panel) panel.querySelectorAll(".filter-checkbox").forEach((cb) => (cb.checked = false));

    if (isMobile) {
      if (searchInputMobile) searchInputMobile.value = "";
      if (desktopAccordionContainer) desktopAccordionContainer.querySelectorAll(".filter-checkbox").forEach((cb) => (cb.checked = false));
      if (searchInputDesktop) searchInputDesktop.value = "";
    } else {
      if (searchInputDesktop) searchInputDesktop.value = "";
      if (mobileAccordionContainer) mobileAccordionContainer.querySelectorAll(".filter-checkbox").forEach((cb) => (cb.checked = false));
      if (searchInputMobile) searchInputMobile.value = "";
    }

    if (recipeGrid) recipeGrid.innerHTML = "";
    if (recipeGrid) recipeGrid.classList.remove("hidden");
    if (noResultsMessage) noResultsMessage.classList.add("hidden");
    if (initialMessage) initialMessage.classList.remove("hidden");
  }

  function populateGlasswareFilter(container) {
    if (!container) return;
    const allGlassware = state.allRecipes.map((r) => r.glassware);
    const unique = [...new Set(allGlassware)].sort();
    container.innerHTML = "";
    unique.forEach((glass) => {
      const label = document.createElement("label");
      label.className = "flex items-center gap-2 text-slate-700 cursor-pointer";
      label.innerHTML = `<input type="checkbox" value="${glass}" class="filter-checkbox rounded text-blue-600 focus:ring-blue-500" /><span>${glass}</span>`;
      container.appendChild(label);
    });
  }

  function initEvents() {
    if (showRecipesButtonDesktop) showRecipesButtonDesktop.addEventListener("click", () => filterRecipes(false));
    if (clearFiltersButtonDesktop) clearFiltersButtonDesktop.addEventListener("click", () => clearFilters(false));
    if (mobileFilterButton) mobileFilterButton.addEventListener("click", openFilterModal);
    if (filterModalBackdrop) filterModalBackdrop.addEventListener("click", closeFilterModal);
  }
})();