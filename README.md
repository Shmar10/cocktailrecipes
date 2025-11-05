# 🍸 Cocktail Finder

A clean, mobile-friendly cocktail recipe finder built with **HTML, TailwindCSS, and vanilla JavaScript** — no frameworks or build tools required. Designed to be hosted directly on **GitHub Pages**.

---

## 🚀 Features

- **Live search** for drink names and ingredients (debounced for performance)  
- **Filter by:** Liquor, Flavor, Difficulty, and Glassware  
- **Multi-liquor logic** — toggle between **Match ANY** or **Match ALL** selected liquors  
- **Mobile-first layout** with top search bar, bottom-sheet filters, and active filter chips  
- **Responsive recipe cards** with lazy-loaded images  
- **Accessible** and keyboard-friendly controls  
- **Data separated from UI** — easy to update via `data/recipes.json`

---

## 📂 File Structure

index.html
styles.css
scripts/
└── app.js
data/
└── recipes.json
assets/
└── (your images here)
.nojekyll
README.md
LICENSE
.gitignore


---

## 💻 Local Preview

To test locally without a server setup:

```bash
# From the project root:
python -m http.server 8080
# Then visit:
# http://localhost:8080


All recipes are stored in data/recipes.json as an array of objects:
{
  "id": 7,
  "name": "Whiskey Boulevardier",
  "mainLiquor": ["Whiskey", "Aperol"],
  "flavor": ["Strong", "Bitter"],
  "difficulty": "Medium",
  "glassware": "Coupe Glass",
  "image": "assets/boulevardier.jpg",
  "ingredients": [
    "1 oz Whiskey",
    "1 oz Aperol",
    "1 oz Sweet Vermouth"
  ],
  "instructions": [
    "Stir ingredients with ice until chilled.",
    "Strain into a coupe glass.",
    "Garnish with orange peel."
  ]
}


Guidelines:
Each recipe needs a unique id
Add or remove fields consistently
Image paths can be local (in assets/) or hosted URLs
Include "glassware" for every recipe (used in filters)
