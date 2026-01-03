// migrate-products-final.js
const { Pool } = require('pg');
const { randomBytes } = require('crypto');
require('dotenv').config();

// Simple UUID generator
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function migrateProductsFinal() {
  console.log('=== Final Product Migration (Handling Foreign Key Issues) ===\n');
  
  const legacyPool = new Pool({
    database: 'tbarimt',
    user: 'postgres',
    password: process.env.DB_PASSWORD || 'Joker0328',
    host: 'localhost',
    port: 5432
  });

  const appPool = new Pool({
    database: 'tbarimt_db',
    user: 'postgres',
    password: process.env.DB_PASSWORD || 'Joker0328',
    host: 'localhost',
    port: 5432
  });

  try {
    console.log('1. Preparing migration...\n');
    
    // Get all existing users in the new system
    const { rows: existingUsers } = await appPool.query(
      'SELECT id FROM users ORDER BY id'
    );
    const existingUserIds = new Set(existingUsers.map(row => row.id));
    
    console.log(`Found ${existingUserIds.size} existing users in tbarimt_db\n`);
    
    // Get all existing categories
    const { rows: existingCategories } = await appPool.query(
      'SELECT id FROM categories ORDER BY id'
    );
    const existingCategoryIds = new Set(existingCategories.map(row => row.id));
    
    console.log(`Found ${existingCategoryIds.size} existing categories in tbarimt_db\n`);
    
    // Get legacy products
    console.log('Fetching legacy products...');
    const { rows: legacyProducts } = await legacyPool.query(`
      SELECT 
        id, title, thumb, pic1, pic2, pic3, descraption, 
        view, date, cat_id, sec_id, download_link, 
        hel, size, user_id, tailbar, survalj, butsaah_eseh, price
      FROM tbarimt.base 
      ORDER BY id
    `);
    
    console.log(`Found ${legacyProducts.length} legacy products\n`);
    
    // Get existing product IDs to avoid duplicates
    const { rows: existingProductIds } = await appPool.query(
      'SELECT id FROM products'
    );
    const existingProductIdSet = new Set(existingProductIds.map(row => row.id));
    
    console.log(`Already have ${existingProductIdSet.size} products, will skip these\n`);
    
    // Find a valid default user (admin or first user)
    let defaultUserId = 1;
    if (existingUserIds.size > 0) {
      defaultUserId = Math.min(...Array.from(existingUserIds));
    }
    console.log(`Default author (user) ID: ${defaultUserId}\n`);
    
    // Find a valid default category
    let defaultCategoryId = 1;
    if (existingCategoryIds.size > 0) {
      defaultCategoryId = Math.min(...Array.from(existingCategoryIds));
    }
    console.log(`Default category ID: ${defaultCategoryId}\n`);
    
    console.log('2. Analyzing legacy data issues...\n');
    
    // Analyze user_id issues
    const uniqueLegacyUserIds = [...new Set(legacyProducts.map(p => parseInt(p.user_id) || 0))].sort((a, b) => a - b);
    const missingUserIds = uniqueLegacyUserIds.filter(id => id > 0 && !existingUserIds.has(id));
    
    console.log(`Unique user_ids in legacy products: ${uniqueLegacyUserIds.length}`);
    console.log(`Missing user_ids (not in users table): ${missingUserIds.length}`);
    if (missingUserIds.length > 0) {
      console.log(`Missing IDs: ${missingUserIds.slice(0, 20).join(', ')}${missingUserIds.length > 20 ? '...' : ''}`);
    }
    console.log('');
    
    // Analyze category issues
    const uniqueLegacyCatIds = [...new Set(legacyProducts.map(p => parseInt(p.cat_id) || 0))].sort((a, b) => a - b);
    const missingCatIds = uniqueLegacyCatIds.filter(id => id > 0 && !existingCategoryIds.has(id));
    
    console.log(`Unique cat_ids in legacy products: ${uniqueLegacyCatIds.length}`);
    console.log(`Missing cat_ids (not in categories table): ${missingCatIds.length}`);
    if (missingCatIds.length > 0) {
      console.log(`Missing IDs: ${missingCatIds.slice(0, 20).join(', ')}${missingCatIds.length > 20 ? '...' : ''}`);
    }
    console.log('');
    
    console.log('3. Starting product migration with fallback logic...\n');
    
    let migratedProducts = 0;
    let skippedProducts = 0;
    let errorProducts = 0;
    
    // Process products
    for (const product of legacyProducts) {
      try {
        // Skip if already exists
        if (existingProductIdSet.has(product.id)) {
          skippedProducts++;
          continue;
        }
        
        // Determine author (user_id) with fallback
        const legacyUserId = parseInt(product.user_id) || 0;
        const authorId = existingUserIds.has(legacyUserId) ? legacyUserId : defaultUserId;
        
        // Determine category with fallback
        const legacyCatId = parseInt(product.cat_id) || 0;
        const categoryId = existingCategoryIds.has(legacyCatId) ? legacyCatId : defaultCategoryId;
        
        // Log if using fallback
        if (authorId === defaultUserId && legacyUserId !== defaultUserId) {
          console.log(`  Product ${product.id}: user_id ${legacyUserId} not found, using default ${defaultUserId}`);
        }
        if (categoryId === defaultCategoryId && legacyCatId !== defaultCategoryId) {
          console.log(`  Product ${product.id}: cat_id ${legacyCatId} not found, using default ${defaultCategoryId}`);
        }
        
        // Build description
        const descriptionParts = [];
        if (product.descraption && product.descraption.trim() !== '') 
          descriptionParts.push(product.descraption.trim());
        if (product.tailbar && product.tailbar.trim() !== '') 
          descriptionParts.push(product.tailbar.trim());
        if (product.hel && product.hel.trim() !== '') 
          descriptionParts.push(product.hel.trim());
        if (product.survalj && product.survalj.trim() !== '') 
          descriptionParts.push(product.survalj.trim());
        
        const description = descriptionParts.join('\n\n').substring(0, 10000);

        // Build preview images array
        const previewImages = [];
        if (product.pic1 && product.pic1.trim() !== '') previewImages.push(product.pic1.trim());
        if (product.pic2 && product.pic2.trim() !== '') previewImages.push(product.pic2.trim());
        if (product.pic3 && product.pic3.trim() !== '') previewImages.push(product.pic3.trim());

        // Parse date
        let createdAt = new Date();
        if (product.date) {
          try {
            const dateStr = product.date.toString().trim();
            const parsedDate = new Date(dateStr);
            if (!isNaN(parsedDate.getTime())) {
              createdAt = parsedDate;
            }
          } catch (e) {
            // Use current date if parsing fails
          }
        }

        // Determine status
        const status = product.butsaah_eseh === 1 ? 'cancelled' : 'new';
        
        // Generate UUID
        const uuid = generateUUID();

        // Insert product
        await appPool.query(
          `INSERT INTO products (
            id, title, description, "categoryId", "subcategoryId",
            "authorId", price, image, "previewImages", "fileUrl",
            "filePath", "fileSize", size, tags, rating, views,
            downloads, "isDiploma", "isActive", status, "createdAt",
            "updatedAt", uuid
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 
                   $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
          ON CONFLICT (id) DO NOTHING`,
          [
            product.id,
            (product.title?.substring(0, 500) || 'Untitled Product').trim(),
            description || null,
            categoryId,
            product.sec_id > 0 ? product.sec_id : null,
            authorId,
            parseFloat(product.price) || 1000.00,
            product.thumb?.trim() || null,
            JSON.stringify(previewImages),
            product.download_link?.trim() || null,
            product.download_link?.trim() || null,
            product.size?.trim() || null,
            product.size?.trim() || null,
            JSON.stringify([]),
            0.00,
            parseInt(product.view) || 0,
            0,
            false,
            true,
            status,
            createdAt,
            new Date(),
            uuid
          ]
        );

        migratedProducts++;
        
        // Log progress every 100 products
        if (migratedProducts % 100 === 0) {
          console.log(`  ...${migratedProducts} products migrated`);
        }
        
      } catch (error) {
        console.log(`  Error with product ${product.id}: ${error.message}`);
        errorProducts++;
      }
    }
    
    console.log(`\n✓ Migration Summary:`);
    console.log(`  Migrated: ${migratedProducts}`);
    console.log(`  Skipped (already exists): ${skippedProducts}`);
    console.log(`  Errors: ${errorProducts}\n`);
    
    // Final verification
    console.log('4. Final verification...\n');
    
    const { rows: finalProductCount } = await appPool.query(
      'SELECT COUNT(*) as count FROM products'
    );
    
    console.log(`Total products in tbarimt_db: ${finalProductCount[0].count}`);
    console.log('\n✅ Migration completed successfully!');
    
    // Show some sample migrated products
    console.log('\n5. Sample migrated products:');
    const { rows: sampleProducts } = await appPool.query(`
      SELECT p.id, p.title, u.username as author, c.name as category
      FROM products p
      LEFT JOIN users u ON p."authorId" = u.id
      LEFT JOIN categories c ON p."categoryId" = c.id
      ORDER BY p.id DESC
      LIMIT 5
    `);
    
    sampleProducts.forEach(p => {
      console.log(`  ID: ${p.id}, Title: ${p.title.substring(0, 30)}..., Author: ${p.author}, Category: ${p.category}`);
    });

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  } finally {
    await legacyPool.end();
    await appPool.end();
  }
}

// Run migration
if (require.main === module) {
  console.log('Starting final product migration...\n');
  migrateProductsFinal().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { migrateProductsFinal };