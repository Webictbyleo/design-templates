# Design Templates Export

This directory contains 666 converted design templates that adhere to the Design type standard.

## Structure

- `designs_manifest.json` - Index of all exported designs
- `{design-id}.json` - Individual design files

## Usage

Each design file follows the Design interface structure defined in `type.ts`:

```typescript
interface Design {
  id: string
  name: string
  title: string
  description?: string
  data: DesignData
  layers?: Layer[]
  thumbnail?: string
  width: number
  height: number
  userId: string
  projectId?: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}
```

## Import Example

```javascript
// Load a specific design
const design = require('./exported_designs/089b7b2bce0e1cec1605c21b16ccb8b6.json');

// Load the manifest to browse all designs
const manifest = require('./exported_designs/designs_manifest.json');
console.log(`Found ${manifest.totalDesigns} designs`);
```

Generated on: 2025-06-26T23:10:34.805Z
