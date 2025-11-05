# Cocktail Finder

Filter and discover cocktail recipes by base spirit, flavor, difficulty, and glassware. Built with plain HTML/CSS/JS + Tailwind CDN so it deploys easily to GitHub Pages.

## Features
- Responsive filter panel with mobile slide-in.
- Search across names and ingredients.
- Recipes stored in `data/recipes.json` (easy to extend via PRs).
- Accessible: live region for results, focusable controls, reduced-motion friendly.

## Getting Started

1. **Clone**
   ```bash
   git clone https://github.com/<your-username>/cocktail-finder.git
   cd cocktail-finder
   ```

2. **Run locally**
   ```bash
   python -m http.server 8080
   # visit http://localhost:8080
   ```

3. **Edit recipes**
   - Add items to `data/recipes.json` following the schema:
     ```json
     {
       "id": 123,
       "name": "Name",
       "mainLiquor": ["Tequila"],
       "flavor": ["Sweet", "Sour"],
       "difficulty": "Easy",
       "glassware": "Rocks Glass",
       "image": "assets/your-image.jpg",
       "ingredients": ["..."],
       "instructions": ["..."]
     }
     ```
   - Place any local images under `assets/` and reference them relatively.

## Deploy to GitHub Pages

1. Push to a GitHub repo.
2. Settings → Pages → Source: *Deploy from a branch* → Branch: `main` (Folder: `/`).
3. Keep `.nojekyll` to avoid Jekyll processing.

## Conventions
- Data/UI separation (`data/recipes.json`).
- Semantic elements, alt text for images.
- External assets via CDN for simplicity; self-host if you want a stricter CSP.

## Roadmap
- Favorites (localStorage).
- Pantry mode.
- Print-friendly recipe cards.
- PWA & manifest.
