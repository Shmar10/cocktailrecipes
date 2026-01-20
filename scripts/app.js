// scripts/app.js
(function () {
  const APP_VERSION = "v3.1.3";

  // --- State ---
  let allRecipes = [];
  let favorites = new Set();
  let myBarIngredients = new Set();
  let viewMode = 'search'; // 'search', 'favorites', 'mybar'

  // --- DOM Elements ---
  const el = {
    // Layout
    heroSection: document.getElementById("search-hero"),
    myBarSection: document.getElementById("my-bar-section"),
    grid: document.getElementById("recipe-grid"),
    noResults: document.getElementById("no-results"),
    initialMsg: document.getElementById("initial-message"),
    template: document.getElementById("recipe-card-template"),

    // Top Navigation (Tabs)
    navSearch: document.getElementById("nav-search"),
    navMyBar: document.getElementById("nav-mybar"),
    navFavorites: document.getElementById("nav-favorites"),

    // Search View Inputs
    selectSpirit: document.getElementById("filter-spirit"),
    selectFlavor: document.getElementById("filter-flavor"),
    selectDifficulty: document.getElementById("filter-difficulty"),
    searchInput: document.getElementById("search"),
    btnFind: document.getElementById("find-recipes-btn"),
    btnClear: document.getElementById("clear-filters"),

    // My Bar Elements (Dynamic)
    myBarList: document.getElementById("my-bar-list"),
    btnMyBarFind: document.getElementById("my-bar-find-btn"),
    btnMyBarClear: document.getElementById("my-bar-clear-btn"),

    // Version
    versionLabel: document.getElementById("app-version"),
  };

  // --- Init ---
  async function init() {
    try {
      if (el.versionLabel) el.versionLabel.textContent = APP_VERSION;

      const res = await fetch("./data/recipes.json");
      allRecipes = await res.json();

      loadPersistedData();
      updateDropdowns();
      renderMyBarIngredients(); // Pre-render the checklist
      setupEventListeners();

      // Default View
      switchView('search');

      if (window.lucide) window.lucide.createIcons();

    } catch (err) {
      console.error(err);
    }
  }

  // --- Persistence ---
  function loadPersistedData() {
    const savedFavs = localStorage.getItem("cocktail-favorites");
    if (savedFavs) favorites = new Set(JSON.parse(savedFavs));

    const savedBar = localStorage.getItem("cocktail-mybar");
    if (savedBar) myBarIngredients = new Set(JSON.parse(savedBar));
  }

  function saveFavorites() {
    localStorage.setItem("cocktail-favorites", JSON.stringify([...favorites]));
  }

  function saveMyBar() {
    localStorage.setItem("cocktail-mybar", JSON.stringify([...myBarIngredients]));
  }

  // --- Core Logic ---

  // 1. Dropdowns (Search Mode)
  // 1. Dropdowns (Cascading Options)
  function updateDropdowns() {
    const curSpirit = el.selectSpirit ? el.selectSpirit.value : "";
    const curFlavor = el.selectFlavor ? el.selectFlavor.value : "";
    const curDiff = el.selectDifficulty ? el.selectDifficulty.value : "";

    const getMatches = (s, f, d) => {
      return allRecipes.filter(r => {
        const mS = !s || (r.mainLiquor || []).includes(s);
        const mF = !f || (r.flavor || []).includes(f);
        const mD = !d || r.difficulty === d;
        return mS && mF && mD;
      });
    };

    // Calculate available options based on OTHER filters
    const spiritSet = new Set(getMatches(null, curFlavor, curDiff).flatMap(r => r.mainLiquor || []));
    const flavorSet = new Set(getMatches(curSpirit, null, curDiff).flatMap(r => r.flavor || []));
    const diffSet = new Set(getMatches(curSpirit, curFlavor, null).map(r => r.difficulty));

    const update = (sel, set, current) => {
      if (!sel) return;
      // Preserve first option (placeholder)
      const placeholder = sel.options[0] ? sel.options[0].text : "Select";
      sel.innerHTML = `<option value="">${placeholder}</option>`;

      [...set].sort().forEach(val => {
        const opt = document.createElement("option");
        opt.value = val;
        opt.innerText = val;
        if (val === current) opt.selected = true;
        sel.appendChild(opt);
      });
    };

    update(el.selectSpirit, spiritSet, curSpirit);
    update(el.selectFlavor, flavorSet, curFlavor);
    update(el.selectDifficulty, diffSet, curDiff);
  }

  // 2. My Bar Ingredient List
  function renderMyBarIngredients() {
    if (!el.myBarList) return;

    // Get top 40 common ingredients
    const counts = {};
    allRecipes.forEach(r => {
      (r.ingredients || []).forEach(raw => {
        // Robust normalization
        let name = raw.toLowerCase();

        // Remove parens
        name = name.split('(')[0];

        // Remove prefixes
        name = name.replace(/^(fresh|juice of|chilled|hot|dry|sweet) /g, '');

        // Remove quantities and units (aggressive)
        // Matches: Numbers, fractions, ranges followed by potential units
        name = name.replace(/^[\d\s\.\/\-\u00BC-\u00BE\u2150-\u215E]+(oz|cl|ml|dash|dashes|tsp|tbsp|cup|cups|qt|liter|litre|shot|shots|part|parts|piece|pieces|slice|slices|wedge|wedges|leaf|leaves|sprig|sprigs|stick|sticks|drop|drops|bottle|bottles|can|cans)?\s*/g, '');

        // Remove "of " if left
        name = name.replace(/^of\s+/, '');

        // Capitalize
        name = name.trim().split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

        if (name) counts[name] = (counts[name] || 0) + 1;
      });
    });

    const topIngredients = Object.keys(counts)
      .sort((a, b) => counts[b] - counts[a])
      .slice(0, 48) // Top 48
      .sort();

    el.myBarList.innerHTML = "";
    topIngredients.forEach(ing => {
      const label = document.createElement("label");
      label.className = "flex items-start space-x-3 p-3 rounded-xl bg-slate-800 border border-slate-700 cursor-pointer hover:bg-slate-700 transition-colors select-none";

      const checked = myBarIngredients.has(ing);

      label.innerHTML = `
            <div class="relative flex items-center mt-0.5">
              <input type="checkbox" value="${ing}" class="peer h-5 w-5 appearance-none rounded border border-slate-600 bg-slate-900 checked:bg-primary-500 checked:border-primary-500 transition-all shrink-0">
              <i data-lucide="check" class="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity left-0.5"></i>
            </div>
            <span class="text-sm font-medium text-slate-300 peer-checked:text-white break-words w-full leading-tight pt-0.5">${ing}</span>
          `;

      // Bind
      const input = label.querySelector("input");
      input.checked = checked;
      input.addEventListener("change", (e) => {
        if (e.target.checked) myBarIngredients.add(ing);
        else myBarIngredients.delete(ing);
        saveMyBar();
      });

      el.myBarList.appendChild(label);
    });
  }

  // --- Filtering ---
  function getFilteredRecipes() {
    if (viewMode === 'favorites') {
      return allRecipes.filter(r => favorites.has(String(r.id)));
    }

    if (viewMode === 'mybar') {
      if (myBarIngredients.size === 0) return [];
      // Logic: Recipe I can make. 
      // Allows simple string matching logic against the raw ingredient string.
      // Strict mode: checks if user has EVERY ingredient needed.
      return allRecipes.filter(r => {
        const needed = r.ingredients || [];
        // Check if every needed ingredient is "covered" by a My Bar item
        // We do loose matching: if recipe says "2 oz Gin", and My Bar has "Gin", it's a match.
        return needed.every(need => {
          return [...myBarIngredients].some(have => need.toLowerCase().includes(have.toLowerCase()));
        });
      });
    }

    // Search Mode
    const filters = {
      spirit: el.selectSpirit?.value || "",
      flavor: el.selectFlavor?.value || "",
      difficulty: el.selectDifficulty?.value || "",
      search: (el.searchInput?.value || "").toLowerCase().trim()
    };

    const terms = filters.search.split(/[,\s]+/).filter(Boolean);

    return allRecipes.filter(r => {
      const mSpirit = !filters.spirit || (r.mainLiquor || []).includes(filters.spirit);
      const mFlavor = !filters.flavor || (r.flavor || []).includes(filters.flavor);
      const mDiff = !filters.difficulty || r.difficulty === filters.difficulty;

      const text = [r.name, ...(r.ingredients || [])].join(" ").toLowerCase();
      const mSearch = !terms.length || terms.every(t => text.includes(t));

      return mSpirit && mFlavor && mDiff && mSearch;
    });
  }

  // --- Rendering ---
  function render(results, forceMessage = false) {
    if (forceMessage) {
      el.grid.classList.add("hidden");
      el.noResults.classList.add("hidden");
      el.initialMsg.classList.remove("hidden");
      // Update message text based on mode
      const p = el.initialMsg.querySelector("p.text-lg");
      if (viewMode === 'search') p.textContent = "Select preferences and click 'Find Recipes'";
      if (viewMode === 'mybar') p.textContent = "Check ingredients you have and click 'What can I make?'";
      return;
    }

    el.initialMsg.classList.add("hidden");
    el.grid.innerHTML = "";

    if (!results || results.length === 0) {
      el.grid.classList.add("hidden");
      el.noResults.classList.remove("hidden");
      const p = el.noResults.querySelector(".font-medium");
      if (viewMode === 'favorites') {
        p.textContent = "No favorite drinks yet.";
      } else if (viewMode === 'mybar') {
        p.textContent = "No recipes match your ingredients exactly.";
      }
      return;
    }

    el.noResults.classList.add("hidden");
    el.grid.classList.remove("hidden");

    const frag = document.createDocumentFragment();
    results.forEach((r, idx) => {
      const card = el.template.content.cloneNode(true).children[0];
      card.style.animationDelay = `${Math.min(idx * 50, 1000)}ms`;
      card.classList.add('animate-slide-up', 'opacity-0');

      // Content
      card.querySelector("img").src = r.image;
      card.querySelector("h3").textContent = r.name;

      // Favorite Button Injection
      const favBtn = document.createElement("button");
      favBtn.className = "absolute top-2 right-2 p-2 rounded-full bg-slate-900/60 backdrop-blur-md border border-slate-700 hover:border-red-500/50 transition-all hover:scale-110 active:scale-95 z-50 cursor-pointer pointer-events-auto shadow-lg";
      const isFav = favorites.has(String(r.id));
      favBtn.innerHTML = `<i data-lucide="heart" class="w-5 h-5 ${isFav ? 'fill-red-500 text-red-500' : 'text-slate-300'}"></i>`;

      favBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (favorites.has(String(r.id))) favorites.delete(String(r.id));
        else favorites.add(String(r.id));
        saveFavorites();

        // Re-render button state
        favBtn.innerHTML = `<i data-lucide="heart" class="w-5 h-5 ${favorites.has(String(r.id)) ? 'fill-red-500 text-red-500' : 'text-slate-300'}"></i>`;
        if (window.lucide) window.lucide.createIcons();

        // If in favorites view, remove card
        if (viewMode === 'favorites' && !favorites.has(String(r.id))) {
          card.remove();
          if (el.grid.children.length === 0) render([], false);
        }
      });
      card.appendChild(favBtn);

      // Ingredients list
      const ul = card.querySelector("ul");
      (r.ingredients || []).forEach(i => {
        const li = document.createElement("li");
        li.className = "text-slate-300";
        li.textContent = i;
        ul.appendChild(li);
      });

      // Instructions list
      const ol = card.querySelector("ol");
      (r.instructions || []).forEach(step => {
        const li = document.createElement("li");
        li.className = "text-slate-300";
        li.textContent = step;
        ol.appendChild(li);
      });

      frag.appendChild(card);
    });
    el.grid.appendChild(frag);
    if (window.lucide) window.lucide.createIcons();
  }

  // --- Layout Switching ---
  function switchView(mode) {
    viewMode = mode;

    // Nav State
    [el.navSearch, el.navMyBar, el.navFavorites].forEach(n => {
      if (!n) return;
      n.classList.remove("text-primary-400", "border-b-2", "border-primary-500");
      n.classList.add("text-slate-400");
    });

    const activeNav = mode === 'search' ? el.navSearch : mode === 'mybar' ? el.navMyBar : el.navFavorites;
    if (activeNav) {
      activeNav.classList.remove("text-slate-400");
      activeNav.classList.add("text-primary-400", "border-b-2", "border-primary-500");
    }

    // Visibility
    if (mode === 'search') {
      el.heroSection.classList.remove("hidden");
      el.myBarSection?.classList.add("hidden");
      render([], true); // Show initial search msg
    } else if (mode === 'mybar') {
      el.heroSection.classList.add("hidden");
      el.myBarSection?.classList.remove("hidden");
      render([], true); // Show initial mybar msg
    } else if (mode === 'favorites') {
      el.heroSection.classList.add("hidden");
      el.myBarSection?.classList.add("hidden");
      render(getFilteredRecipes()); // Auto render favs
    }
  }

  // --- Events ---
  function setupEventListeners() {
    // Nav Clicks
    el.navSearch?.addEventListener("click", () => switchView('search'));
    el.navMyBar?.addEventListener("click", () => switchView('mybar'));
    el.navFavorites?.addEventListener("click", () => switchView('favorites'));

    // Dropdown Cascading Logic
    [el.selectSpirit, el.selectFlavor, el.selectDifficulty].forEach(sel => {
      if (sel) {
        sel.addEventListener("change", () => {
          updateDropdowns(); // Re-calculate options based on new selection
        });
      }
    });

    // Search Actions
    el.btnFind?.addEventListener("click", () => render(getFilteredRecipes()));
    el.btnClear?.addEventListener("click", () => {
      el.selectSpirit.value = "";
      el.selectFlavor.value = "";
      el.selectDifficulty.value = "";
      el.searchInput.value = "";
      updateDropdowns(); // Reset options
      render([], true);
    });

    // My Bar Actions
    el.btnMyBarFind?.addEventListener("click", () => render(getFilteredRecipes()));
    el.btnMyBarClear?.addEventListener("click", () => {
      myBarIngredients.clear();
      saveMyBar();
      renderMyBarIngredients();
    });
  }

  init();
})();
