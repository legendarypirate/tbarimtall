// fix-product-categories.js
const { Pool } = require('pg');
require('dotenv').config();

async function fixProductCategories() {
  console.log('=== Fixing Product Category Mappings ===\n');
  
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
    console.log('1. Understanding the data structure...\n');
    
    // Get sample products from legacy
    const { rows: sampleProducts } = await legacyPool.query(`
      SELECT b.id, b.cat_id, b.sec_id, m.name as menu_name, m.sec_id as menu_category_id
      FROM tbarimt.base b
      LEFT JOIN tbarimt.menu m ON b.cat_id = m.id
      ORDER BY b.id
      LIMIT 10
    `);
    
    console.log('Sample legacy products:');
    sampleProducts.forEach(p => {
      console.log(`  Product ${p.id}: cat_id=${p.cat_id} (${p.menu_name}), sec_id=${p.sec_id}, menu points to section ${p.menu_category_id}`);
    });
    console.log('');
    
    console.log('2. Creating mapping table...\n');
    
    // Get all menu -> section mappings
    const { rows: menuMappings } = await legacyPool.query(`
      SELECT m.id as menu_id, m.name as menu_name, m.sec_id as section_id, s.name as section_name
      FROM tbarimt.menu m
      LEFT JOIN tbarimt.section s ON m.sec_id = s.id
      WHERE m.sec_id IS NOT NULL
      ORDER BY m.id
    `);
    
    console.log(`Found ${menuMappings.length} menu->section mappings\n`);
    
    // Create a map: menu_id -> section_id
    const menuToSectionMap = new Map();
    menuMappings.forEach(m => {
      menuToSectionMap.set(m.menu_id, m.section_id);
    });
    
    console.log('Sample mappings:');
    menuMappings.slice(0, 5).forEach(m => {
      console.log(`  Menu ${m.menu_id} (${m.menu_name}) -> Section ${m.section_id} (${m.section_name})`);
    });
    console.log('');
    
    console.log('3. Fixing product categories...\n');
    
    // Get all products with their current categoryId (which is actually menu_id)
    const { rows: products } = await appPool.query(`
      SELECT id, "categoryId", "subcategoryId" 
      FROM products 
      ORDER BY id
    `);
    
    console.log(`Found ${products.length} products to fix\n`);
    
    let fixedProducts = 0;
    let errors = 0;
    
    for (const product of products) {
      try {
        const menuId = product.categoryId; // This is actually menu_id in old system
        const sectionId = menuToSectionMap.get(menuId);
        
        if (!sectionId) {
          console.log(`  Product ${product.id}: Menu ${menuId} has no section mapping`);
          
          // Try to find a default section for this menu
          const menuInfo = await legacyPool.query(
            'SELECT sec_id FROM tbarimt.menu WHERE id = $1',
            [menuId]
          );
          
          if (menuInfo.rows.length > 0 && menuInfo.rows[0].sec_id) {
            const actualSectionId = menuInfo.rows[0].sec_id;
            
            // Update product: categoryId = section_id, subcategoryId = menu_id
            await appPool.query(`
              UPDATE products 
              SET "categoryId" = $1, "subcategoryId" = $2
              WHERE id = $3
            `, [actualSectionId, menuId, product.id]);
            
            console.log(`    Fixed: category ${actualSectionId}, subcategory ${menuId}`);
            fixedProducts++;
          } else {
            console.log(`    Could not fix product ${product.id}`);
            errors++;
          }
        } else {
          // Update product: categoryId = section_id, subcategoryId = menu_id
          await appPool.query(`
            UPDATE products 
            SET "categoryId" = $1, "subcategoryId" = $2
            WHERE id = $3
          `, [sectionId, menuId, product.id]);
          
          fixedProducts++;
          
          if (fixedProducts % 100 === 0) {
            console.log(`  ...${fixedProducts} products fixed`);
          }
        }
      } catch (error) {
        console.log(`  Error with product ${product.id}: ${error.message}`);
        errors++;
      }
    }
    
    console.log(`\n✓ Fixed ${fixedProducts}/${products.length} products (errors: ${errors})\n`);
    
    console.log('4. Final verification...\n');
    
    // Check sample fixed products
    const { rows: sampleFixed } = await appPool.query(`
      SELECT p.id, p.title, 
             c.name as category_name, 
             s.name as subcategory_name
      FROM products p
      LEFT JOIN categories c ON p."categoryId" = c.id
      LEFT JOIN subcategories s ON p."subcategoryId" = s.id
      ORDER BY p.id
      LIMIT 5
    `);
    
    console.log('Sample fixed products:');
    sampleFixed.forEach(p => {
      console.log(`  Product ${p.id}: "${p.title?.substring(0, 30)}..."`);
      console.log(`    Category: ${p.category_name || 'none'}`);
      console.log(`    Subcategory: ${p.subcategory_name || 'none'}`);
    });
    console.log('');
    
    // Count products with valid categories/subcategories
    const stats = await appPool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN "categoryId" IN (SELECT id FROM categories) THEN 1 ELSE 0 END) as valid_categories,
        SUM(CASE WHEN "subcategoryId" IN (SELECT id FROM subcategories) THEN 1 ELSE 0 END) as valid_subcategories
      FROM products
    `);
    
    const s = stats.rows[0];
    console.log('Product category status:');
    console.log(`  Total products: ${s.total}`);
    console.log(`  Valid categories: ${s.valid_categories}`);
    console.log(`  Valid subcategories: ${s.valid_subcategories}\n`);
    
    if (s.valid_categories === s.total) {
      console.log('✅ SUCCESS: All products have valid category mappings!');
    } else {
      console.log(`⚠️  ${s.total - s.valid_categories} products still have invalid categories`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await legacyPool.end();
    await appPool.end();
  }
}

fixProductCategories();