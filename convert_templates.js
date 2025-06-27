#!/usr/bin/env node

/**
 * Design Templates Conversion Script
 * Converts legacy design templates to new Design type standard
 */

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

// Base paths for asset resolution
const TEMPLATES_BASE_PATH = '/var/www/html/design-templates/templates/all';
const CACHE_BASE_PATH = '/var/www/html/design-templates/cache';

class TemplateConverter {
  constructor() {
    this.connection = null;
    this.convertedCount = 0;
    this.errorCount = 0;
  }

  async connect() {
    this.connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.end();
      console.log('Disconnected from database');
    }
  }

  /**
   * Convert legacy template to new Design type format
   */
  async convertTemplate(legacyTemplate) {
    const { id, title, hash, size, cat, tags, src, created, modified, public: isPublic } = legacyTemplate;
    
    let designData;
    try {
      designData = JSON.parse(src);
    } catch (error) {
      throw new Error(`Failed to parse JSON for template ${id}: ${error.message}`);
    }

    // Extract canvas dimensions
    const [width, height] = designData.sz || ['1920', '1080'];
    
    // Convert to new Design format
    const design = {
      id: hash || `template_${id}`,
      name: title || `Template ${id}`,
      title: title || `Template ${id}`,
      description: this.generateDescription(cat, tags),
      data: this.convertDesignData(designData, hash),
      layers: await this.convertLayers(designData, hash),
      thumbnail: this.generateThumbnailPath(hash),
      width: parseInt(width),
      height: parseInt(height),
      userId: 'legacy_import',
      projectId: null,
      isPublic: isPublic === '1',
      createdAt: created || new Date().toISOString(),
      updatedAt: modified || created || new Date().toISOString()
    };

    return design;
  }

  /**
   * Convert legacy design data to new DesignData format
   */
  convertDesignData(legacyData, hash) {
    const scene = legacyData.s && legacyData.s[0] ? legacyData.s[0] : {};
    
    return {
      backgroundColor: scene.bg?.color || '#ffffff',
      background: this.convertBackground(scene.bg),
      gridSettings: {
        gridSize: 20,
        showGrid: false,
        snapToGrid: true,
        snapToObjects: true,
        snapTolerance: 5
      },
      viewportSettings: {
        zoom: 1,
        panX: 0,
        panY: 0
      }
    };
  }

  /**
   * Convert legacy background to new DesignBackground format
   */
  convertBackground(legacyBg) {
    if (!legacyBg) {
      return { type: 'solid', color: '#ffffff' };
    }

    // Handle legacy color format (e.g., "#0000" -> transparent)
    let color = legacyBg.color || '#ffffff';
    if (color === '#0000') {
      color = 'transparent';
    }

    return {
      type: 'solid',
      color: color
    };
  }

  /**
   * Convert legacy elements to new Layer format
   */
  async convertLayers(legacyData, hash) {
    const scene = legacyData.s && legacyData.s[0] ? legacyData.s[0] : {};
    const elements = scene.e || [];
    
    const layers = [];
    for (let index = 0; index < elements.length; index++) {
      const layer = await this.convertElement(elements[index], index, hash);
      if (layer !== null) {
        layers.push(layer);
      }
    }
    
    return layers;
  }

  /**
   * Convert individual legacy element to Layer
   */
  async convertElement(element, index, hash) {
    const { alias, prop, id, name } = element;
    
    if (!prop) return null;

    const baseLayer = {
      id: parseInt(prop.uid?.split('_')[1]) || index + 1,
      name: name || `Layer ${index + 1}`,
      visible: prop.noshow !== 1,
      locked: false,
      transform: this.convertTransform(prop),
      zIndex: prop.z || index,
      plugins: {}
    };

    // Convert based on element type
    switch (alias) {
      case 'shape':
        if (prop.sym === 'text') {
          return this.convertTextLayer(baseLayer, prop);
        } else {
          return this.convertShapeLayer(baseLayer, prop);
        }
      
      case 'images':
        return await this.convertImageLayer(baseLayer, prop, hash);
      
      default:
        console.warn(`Unknown element type: ${alias}`);
        return null;
    }
  }

  /**
   * Convert legacy transform properties
   */
  convertTransform(prop) {
    return {
      x: this.percentToPixel(prop.left, 1920) || 0,
      y: this.percentToPixel(prop.top, 1080) || 0,
      width: this.percentToPixel(prop.w, 1920) || 100,
      height: this.percentToPixel(prop.h, 1080) || 100,
      rotation: prop.r || 0,
      scaleX: 1,
      scaleY: 1,
      skewX: 0,
      skewY: 0,
      opacity: (prop.opacity || 10) / 10 // Convert from 0-10 to 0-1
    };
  }

  /**
   * Convert text element to TextLayer
   */
  convertTextLayer(baseLayer, prop) {
    const color = this.convertColor(prop.color || prop.background?.color);
    
    return {
      ...baseLayer,
      type: 'text',
      properties: {
        text: prop.text || '',
        fontFamily: prop.font || 'Arial',
        fontSize: prop.size || 16,
        fontWeight: prop.type === 'bold' ? 'bold' : 'normal',
        fontStyle: 'normal',
        textAlign: prop.align || 'left',
        color: color,
        lineHeight: prop.line || 1.2,
        letterSpacing: prop.spacing || 0,
        textDecoration: 'none',
        autoResize: {
          enabled: true,
          mode: 'both',
          padding: { top: 0, right: 0, bottom: 0, left: 0 }
        }
      }
    };
  }

  /**
   * Convert shape element to ShapeLayer
   */
  convertShapeLayer(baseLayer, prop) {
    return {
      ...baseLayer,
      type: 'shape',
      properties: {
        shapeType: 'rectangle',
        fill: {
          type: 'solid',
          color: this.convertColor(prop.background?.color) || '#000000',
          opacity: 1
        },
        stroke: '#000000',
        strokeWidth: 0,
        strokeOpacity: 1,
        cornerRadius: 0,
        sides: 4,
        points: 5,
        innerRadius: 0.5,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100
      }
    };
  }

  /**
   * Convert image element to ImageLayer
   */
  async convertImageLayer(baseLayer, prop, hash) {
    const normalizedSrc = await this.normalizeImagePath(prop.src, hash);
    
    // Skip if image doesn't exist
    if (!normalizedSrc) {
      console.warn(`⚠️  Skipping image layer - no valid source: ${prop.src}`);
      return null;
    }
    
    return {
      ...baseLayer,
      type: 'image',
      properties: {
        src: normalizedSrc,
        alt: baseLayer.name,
        objectPosition: 'center',
        preserveAspectRatio: true,
        quality: 80,
        scaleMode: 'fill',
        blur: 0,
        brightness: 1,
        contrast: 1,
        saturation: 1,
        hue: 0,
        sepia: 0,
        grayscale: 0,
        invert: 0,
        shadow: { enabled: false },
        flipX: false,
        flipY: false
      }
    };
  }

  /**
   * Normalize image paths to relative format, verify existence, and copy to assets directory
   */
  async normalizeImagePath(src, templateHash) {
    if (!src) return null;
    
    let sourcePath = '';
    let relativePath = '';
    
    // Convert URL to local file path
    if (src.includes('/templates/all/')) {
      // Extract everything after /templates/all/
      const pathAfterTemplates = src.split('/templates/all/')[1];
      if (pathAfterTemplates) {
        sourcePath = path.join(__dirname, 'templates', 'all', pathAfterTemplates);
        relativePath = `/templates/all/${pathAfterTemplates}`;
      }
    } else if (src.includes('/cache/')) {
      // Extract everything after /cache/
      const pathAfterCache = src.split('/cache/')[1];
      if (pathAfterCache) {
        sourcePath = path.join(__dirname, 'cache', pathAfterCache);
        relativePath = `/cache/${pathAfterCache}`;
      }
    } else if (!src.startsWith('http') && !src.startsWith('/')) {
      // Simple filename - assume it belongs to the template
      if (templateHash) {
        sourcePath = path.join(__dirname, 'templates', 'all', templateHash, src);
        relativePath = `/templates/all/${templateHash}/${src}`;
      } else {
        return null;
      }
    } else if (src.startsWith('/')) {
      // Already a relative path
      sourcePath = path.join(__dirname, src.substring(1));
      relativePath = src;
    } else {
      // External URL - skip for now
      console.warn(`⚠️  External URL not supported: ${src}`);
      return null;
    }
    
    // Check if the source file exists
    try {
      await fs.access(sourcePath);
    } catch (error) {
      // File doesn't exist - return null to skip this image
      console.warn(`⚠️  Image file not found, skipping: ${sourcePath}`);
      return null;
    }
    
    // Copy file to converted assets directory
    try {
      const assetsDir = path.join(__dirname, 'converted_assets');
      await fs.mkdir(assetsDir, { recursive: true });
      
      // Create unique filename to avoid conflicts
      const ext = path.extname(sourcePath);
      const baseName = path.basename(sourcePath, ext);
      const uniqueName = `${templateHash}_${baseName}${ext}`;
      const destPath = path.join(assetsDir, uniqueName);
      
      // Copy file if it doesn't already exist
      try {
        await fs.access(destPath);
        console.log(`📁 Asset already exists: ${uniqueName}`);
      } catch {
        await fs.copyFile(sourcePath, destPath);
        console.log(`📁 Copied asset: ${sourcePath} → ${uniqueName}`);
      }
      
      // Return new path
      return `/converted_assets/${uniqueName}`;
      
    } catch (error) {
      console.warn(`⚠️  Failed to copy asset ${sourcePath}: ${error.message}`);
      // Return original path as fallback
      return relativePath;
    }
  }

  /**
   * Convert legacy color format to standard hex/rgba
   */
  convertColor(color) {
    if (!color) return '#000000';
    
    // Handle rgba format
    if (color.startsWith('rgba(')) {
      return color;
    }
    
    // Handle hex colors
    if (color.startsWith('#')) {
      if (color === '#0000') return 'transparent';
      return color;
    }
    
    return '#000000';
  }

  /**
   * Convert percentage to pixel value
   */
  percentToPixel(percent, canvasSize) {
    if (typeof percent !== 'number') return 0;
    return Math.round((percent / 100) * canvasSize);
  }

  /**
   * Generate description from category and tags
   */
  generateDescription(cat, tags) {
    const parts = [];
    if (cat) parts.push(`Category: ${cat}`);
    if (tags) parts.push(`Tags: ${tags}`);
    return parts.join(' | ') || null;
  }

  /**
   * Generate thumbnail path
   */
  generateThumbnailPath(hash) {
    return hash ? `/cache/tpl/previews/${hash}.jpg` : null;
  }

  /**
   * Process a single template
   */
  async processTemplate(template) {
    try {
      const convertedDesign = await this.convertTemplate(template);
      console.log(`✓ Converted template ${template.id}: ${template.title}`);
      this.convertedCount++;
      return convertedDesign;
    } catch (error) {
      console.error(`✗ Failed to convert template ${template.id}: ${error.message}`);
      this.errorCount++;
      return null;
    }
  }

  /**
   * Create the new designs table
   */
  async createNewTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS designs_converted (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        data JSON NOT NULL,
        layers JSON,
        thumbnail VARCHAR(500),
        width INT NOT NULL,
        height INT NOT NULL,
        userId VARCHAR(255) NOT NULL,
        projectId VARCHAR(255),
        isPublic BOOLEAN DEFAULT true,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        originalId INT,
        INDEX idx_userId (userId),
        INDEX idx_createdAt (createdAt),
        INDEX idx_isPublic (isPublic)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await this.connection.execute(createTableSQL);
    console.log('Created designs_converted table');
  }

  /**
   * Save converted design to new table
   */
  async saveConvertedDesign(design, originalId) {
    const insertSQL = `
      INSERT INTO designs_converted (
        id, name, title, description, data, layers, thumbnail, 
        width, height, userId, projectId, isPublic, createdAt, updatedAt, originalId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        title = VALUES(title),
        description = VALUES(description),
        data = VALUES(data),
        layers = VALUES(layers),
        thumbnail = VALUES(thumbnail),
        width = VALUES(width),
        height = VALUES(height),
        updatedAt = VALUES(updatedAt)
    `;
    
    const values = [
      design.id,
      design.name,
      design.title,
      design.description,
      JSON.stringify(design.data),
      JSON.stringify(design.layers),
      design.thumbnail,
      design.width,
      design.height,
      design.userId,
      design.projectId,
      design.isPublic,
      design.createdAt,
      design.updatedAt,
      originalId
    ];
    
    await this.connection.execute(insertSQL, values);
  }

  /**
   * Main conversion process
   */
  async run(limit = null) {
    try {
      await this.connect();
      await this.createNewTable();
      
      // Get templates to convert
      let query = 'SELECT * FROM tpl ORDER BY id';
      if (limit) {
        query += ` LIMIT ${limit}`;
      }
      
      const [templates] = await this.connection.execute(query);
      console.log(`Starting conversion of ${templates.length} templates...`);
      
      for (const template of templates) {
        const convertedDesign = await this.processTemplate(template);
        if (convertedDesign) {
          await this.saveConvertedDesign(convertedDesign, template.id);
        }
      }
      
      console.log(`\nConversion completed:`);
      console.log(`✓ Successfully converted: ${this.convertedCount}`);
      console.log(`✗ Failed conversions: ${this.errorCount}`);
      console.log(`📊 Total processed: ${this.convertedCount + this.errorCount}`);
      
    } catch (error) {
      console.error('Conversion failed:', error);
    } finally {
      await this.disconnect();
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const limit = args[0] ? parseInt(args[0]) : null;
  
  const converter = new TemplateConverter();
  converter.run(limit).catch(console.error);
}

module.exports = TemplateConverter;
