#!/usr/bin/env node

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'design_templates_user',
  password: 'designtemplates001',
  database: 'design_templates_test'
};

async function exportDesigns() {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Create export directory
    const exportDir = path.join(__dirname, 'exported_designs');
    await fs.mkdir(exportDir, { recursive: true });
    console.log(`📁 Created export directory: ${exportDir}`);

    // Query all converted designs
    const [rows] = await connection.execute(`
      SELECT 
        id,
        name,
        title,
        description,
        data,
        layers,
        thumbnail,
        width,
        height,
        userId,
        projectId,
        isPublic,
        createdAt,
        updatedAt,
        originalId
      FROM designs_converted 
      ORDER BY id
    `);

    console.log(`📊 Found ${rows.length} designs to export`);

    // Export individual design files
    const designsManifest = [];
    let exportCount = 0;

    for (const design of rows) {
      try {
        // Parse JSON fields (check if they're already objects or need parsing)
        const designData = {
          id: design.id,
          name: design.name,
          title: design.title,
          description: design.description,
          data: typeof design.data === 'string' ? JSON.parse(design.data) : design.data,
          layers: design.layers ? (typeof design.layers === 'string' ? JSON.parse(design.layers) : design.layers) : null,
          thumbnail: design.thumbnail,
          width: design.width,
          height: design.height,
          userId: design.userId,
          projectId: design.projectId,
          isPublic: Boolean(design.isPublic),
          createdAt: design.createdAt.toISOString(),
          updatedAt: design.updatedAt.toISOString(),
          originalId: design.originalId
        };

        // Save individual design file
        const designFile = path.join(exportDir, `${design.id}.json`);
        await fs.writeFile(designFile, JSON.stringify(designData, null, 2));

        // Add to manifest
        designsManifest.push({
          id: design.id,
          name: design.name,
          title: design.title,
          width: design.width,
          height: design.height,
          thumbnail: design.thumbnail,
          isPublic: Boolean(design.isPublic),
          file: `${design.id}.json`
        });

        exportCount++;
        if (exportCount % 50 === 0) {
          console.log(`✅ Exported ${exportCount} designs...`);
        }

      } catch (error) {
        console.error(`❌ Failed to export design ${design.id}:`, error.message);
      }
    }

    // Create designs manifest
    const manifestFile = path.join(exportDir, 'designs_manifest.json');
    await fs.writeFile(manifestFile, JSON.stringify({
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      totalDesigns: designsManifest.length,
      designs: designsManifest
    }, null, 2));

    // Create README for the export
    const readmeContent = `# Design Templates Export

This directory contains ${exportCount} converted design templates that adhere to the Design type standard.

## Structure

- \`designs_manifest.json\` - Index of all exported designs
- \`{design-id}.json\` - Individual design files

## Usage

Each design file follows the Design interface structure defined in \`type.ts\`:

\`\`\`typescript
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
\`\`\`

## Import Example

\`\`\`javascript
// Load a specific design
const design = require('./exported_designs/089b7b2bce0e1cec1605c21b16ccb8b6.json');

// Load the manifest to browse all designs
const manifest = require('./exported_designs/designs_manifest.json');
console.log(\`Found \${manifest.totalDesigns} designs\`);
\`\`\`

Generated on: ${new Date().toISOString()}
`;

    const readmeFile = path.join(exportDir, 'README.md');
    await fs.writeFile(readmeFile, readmeContent);

    console.log('\n🎉 Export completed successfully!');
    console.log(`✅ Exported ${exportCount} designs`);
    console.log(`📁 Files saved to: ${exportDir}`);
    console.log(`📋 Manifest: designs_manifest.json`);
    console.log(`📖 Documentation: README.md`);

  } catch (error) {
    console.error('❌ Export failed:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Disconnected from database');
    }
  }
}

// Run the export
exportDesigns();
