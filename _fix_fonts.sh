#!/bin/bash
# Fix fonts and border-radius in all model section files
cd "$(dirname "$0")"

for f in sections/nw-model-*.liquid; do
  echo "Processing: $f"
  
  # Replace 'Articulat CF', 'Raleway', sans-serif → 'Raleway', sans-serif
  sed -i '' "s/'Articulat CF', 'Raleway', sans-serif/'Raleway', sans-serif/g" "$f"
  
  # Replace 'Articulat CF', sans-serif → 'Raleway', sans-serif
  sed -i '' "s/'Articulat CF', sans-serif/'Raleway', sans-serif/g" "$f"
  
  # Replace any remaining 'Articulat CF' → 'Raleway'
  sed -i '' "s/'Articulat CF'/'Raleway'/g" "$f"
  
  # Replace 'Quando', serif → 'Raleway', sans-serif
  sed -i '' "s/'Quando', serif/'Raleway', sans-serif/g" "$f"
  
  # Replace border-radius: 30px → 8px
  sed -i '' 's/border-radius: 30px/border-radius: 8px/g' "$f"
  
  # Replace border-radius: 15px → 8px
  sed -i '' 's/border-radius: 15px/border-radius: 8px/g' "$f"
done

echo ""
echo "=== Verification ==="
echo "Articulat CF remaining:"
grep -c "Articulat CF" sections/nw-model-*.liquid 2>/dev/null || echo "  None found"
echo "Quando remaining:"
grep -c "Quando" sections/nw-model-*.liquid 2>/dev/null || echo "  None found"
echo "border-radius 30px/15px remaining:"
grep -cE "border-radius: (30|15)px" sections/nw-model-*.liquid 2>/dev/null || echo "  None found"

echo ""
echo "Done!"
