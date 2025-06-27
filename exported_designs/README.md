# Design Templates Export

This directory contains 666 converted design templates that adhere to the Design type standard.

## Structure

- `designs_manifest.json` - Index of all exported designs with categories
- `{design-id}.json` - Individual design files

## Usage

Each design file follows the Design interface structure with additional category information:

```typescript
interface ExportedDesign extends Design {
  category?: string  // Template category (e.g., "business", "social", etc.)
  tags?: string      // Template tags (comma-separated)
}
```

## Import Example

```javascript
// Load a specific design
const design = require('./exported_designs/089b7b2bce0e1cec1605c21b16ccb8b6.json');
console.log('Category:', design.category);
console.log('Tags:', design.tags);

// Load the manifest to browse all designs
const manifest = require('./exported_designs/designs_manifest.json');
console.log(`Found ${manifest.totalDesigns} designs`);

// Filter by category
const businessDesigns = manifest.designs.filter(d => d.category === 'business');
console.log(`Found ${businessDesigns.length} business designs`);
```

## Categories Available

The designs include various categories for easy filtering and organization.

Generated on: 2025-06-27T12:14:08.167Z
