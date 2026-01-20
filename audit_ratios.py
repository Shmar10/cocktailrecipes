import json
import re

def parse_oz(ing_str):
    # Extract oz value
    match = re.search(r'([\d\.]+)\s*oz', ing_str.lower())
    if match:
        try:
            return float(match.group(1))
        except:
            return 0
    return 0

with open('data/recipes.json', 'r') as f:
    recipes = json.load(f)

issues = []

for r in recipes:
    ingredients = r.get('ingredients', [])
    total_vol = 0
    acid_vol = 0
    sweet_vol = 0
    spirit_vol = 0
    
    has_main = False
    main_liquors = [m.lower() for m in r.get('mainLiquor', [])]
    
    # Check for main liquor in ingredients
    ing_text = " ".join(ingredients).lower()
    for m in main_liquors:
        if m in ing_text:
            has_main = True
        # Handle specific cases
        if m == "whiskey" and ("bourbon" in ing_text or "rye" in ing_text or "scotch" in ing_text):
            has_main = True
        if m == "bourbon" and "whiskey" in ing_text:
             has_main = True

    if not has_main and main_liquors and "liqueur" not in main_liquors and "bitters" not in main_liquors and "punch" not in r['name'].lower():
        issues.append(f"ID {r['id']} ({r['name']}): Main liquor {main_liquors} not found in ingredients.")

    for ing in ingredients:
        oz = parse_oz(ing)
        total_vol += oz
        
        low = ing.lower()
        if "lemon" in low or "lime" in low or "grapefruit" in low:
             acid_vol += oz
        if "syrup" in low or "sugar" in low or "cordial" in low or "liqueur" in low or "vermouth" in low:
             sweet_vol += oz
        if "vodka" in low or "gin" in low or "rum" in low or "whiskey" in low or "tequila" in low or "bourbon" in low or "brandy" in low or "cognac" in low or "mezcal" in low:
             spirit_vol += oz

    # Heuristics
    if total_vol > 12 and "punch" not in r['name'].lower() and "bowl" not in r['name'].lower() and "pitcher" not in r['name'].lower():
         issues.append(f"ID {r['id']} ({r['name']}): Suspiciously large volume ({total_vol} oz).")
         
    if acid_vol > 2.5:
         issues.append(f"ID {r['id']} ({r['name']}): Extreme Acid ({acid_vol} oz).")
         
    if sweet_vol > 3.5 and "punch" not in r['name'].lower():
         issues.append(f"ID {r['id']} ({r['name']}): Extreme Sweet ({sweet_vol} oz).")

print(f"Scanned {len(recipes)} recipes.")
print("\nPossible Issues:")
for i in issues:
    print(i)
