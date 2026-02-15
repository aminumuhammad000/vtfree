#!/bin/bash

# Script to rename all VTPay references to VTStack
# This will update variable names, file paths, API endpoints, and UI labels

echo "🔄 Starting VTPay → VTStack migration..."

# Define the base directory
BASE_DIR="/home/amee/Desktop/vtfree"

# Files to update (excluding node_modules, dist, build, .next)
FILES=$(find "$BASE_DIR" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/dist/*" \
  ! -path "*/dist300/*" \
  ! -path "*/.next/*" \
  ! -path "*/build/*" \
  ! -path "*/builds/*")

# Counter for changes
CHANGED=0

# Perform replacements
for file in $FILES; do
  if grep -q "vtpay\|VTPay\|VTPAY" "$file" 2>/dev/null; then
    echo "📝 Updating: $file"
    
    # Create backup
    cp "$file" "$file.bak"
    
    # Replace all variations
    sed -i 's/vtpay/vtstack/g' "$file"
    sed -i 's/VTPay/VTStack/g' "$file"
    sed -i 's/VTPAY/VTSTACK/g' "$file"
    sed -i 's/Vtpay/Vtstack/g' "$file"
    
    CHANGED=$((CHANGED + 1))
  fi
done

echo ""
echo "✅ Updated $CHANGED files"
echo ""
echo "🔄 Renaming directories and files..."

# Rename directories
find "$BASE_DIR" -depth -type d -name "*vtpay*" ! -path "*/node_modules/*" ! -path "*/dist/*" | while read dir; do
  newdir=$(echo "$dir" | sed 's/vtpay/vtstack/g')
  if [ "$dir" != "$newdir" ]; then
    echo "📁 Renaming directory: $dir → $newdir"
    mv "$dir" "$newdir"
  fi
done

# Rename files
find "$BASE_DIR" -type f -name "*vtpay*" ! -path "*/node_modules/*" ! -path "*/dist/*" | while read file; do
  newfile=$(echo "$file" | sed 's/vtpay/vtstack/g')
  if [ "$file" != "$newfile" ]; then
    echo "📄 Renaming file: $file → $newfile"
    mv "$file" "$newfile"
  fi
done

echo ""
echo "🎉 VTPay → VTStack migration complete!"
echo ""
echo "📋 Summary of changes:"
echo "   - Updated $CHANGED files"
echo "   - Renamed directories and files"
echo "   - All 'vtpay' → 'vtstack'"
echo "   - All 'VTPay' → 'VTStack'"
echo "   - All 'VTPAY' → 'VTSTACK'"
echo ""
echo "⚠️  Note: Backup files created with .bak extension"
echo "   You can remove them with: find $BASE_DIR -name '*.bak' -delete"
