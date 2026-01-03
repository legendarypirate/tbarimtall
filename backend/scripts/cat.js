// migrate-categories-simple-final.js
const { Pool } = require('pg');
require('dotenv').config();

async function migrateCategoriesSimple() {
  console.log('=== Simple Migration: Categories & Subcategories ===\n');
  
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
    console.log('1. Checking current data...\n');
    
    // Get current counts
    const sectionsCount = await legacyPool.query('SELECT COUNT(*) as count FROM tbarimt.section');
    const menusCount = await legacyPool.query('SELECT COUNT(*) as count FROM tbarimt.menu');
    
    const currentCats = await appPool.query('SELECT COUNT(*) as count FROM categories');
    const currentSubs = await appPool.query('SELECT COUNT(*) as count FROM subcategories');
    
    console.log('Legacy data (tbarimt):');
    console.log(`  - Sections: ${sectionsCount.rows[0].count}`);
    console.log(`  - Menus: ${menusCount.rows[0].count}\n`);
    
    console.log('Current data (tbarimt_db):');
    console.log(`  - Categories: ${currentCats.rows[0].count}`);
    console.log(`  - Subcategories: ${currentSubs.rows[0].count}\n`);
    
    console.log('2. Migrating categories (section -> categories)...\n');
    
    const { rows: sections } = await legacyPool.query(`
      SELECT * FROM tbarimt.section ORDER BY id
    `);
    
    let migratedCats = 0;
    for (const section of sections) {
      try {
        await appPool.query(`
          INSERT INTO categories (id, name, icon, description, "isActive", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING
        `, [
          section.id,
          section.name || `Category ${section.id}`,
          section.pic || null,
          `Legacy section #${section.id}`,
          true,
          new Date(),
          new Date()
        ]);
        migratedCats++;
      } catch (error) {
        console.log(`  Error with section ${section.id}: ${error.message}`);
      }
    }
    console.log(`✓ Categories migrated: ${migratedCats}\n`);
    
    console.log('3. Migrating subcategories (menu -> subcategories)...\n');
    
    const { rows: menus } = await legacyPool.query(`
      SELECT * FROM tbarimt.menu WHERE sec_id IS NOT NULL ORDER BY id
    `);
    
    let migratedSubs = 0;
    for (const menu of menus) {
      try {
        // Check if parent category exists
        const catExists = await appPool.query(
          'SELECT 1 FROM categories WHERE id = $1',
          [menu.sec_id]
        );
        
        if (catExists.rows.length === 0) {
          console.log(`  Menu ${menu.id}: Category ${menu.sec_id} doesn't exist, skipping`);
          continue;
        }
        
        await appPool.query(`
          INSERT INTO subcategories (id, name, "categoryId", description, "isActive", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING
        `, [
          menu.id,
          menu.name || `Subcategory ${menu.id}`,
          menu.sec_id,
          menu.descraption || `Legacy menu #${menu.id}`,
          true,
          new Date(),
          new Date()
        ]);
        migratedSubs++;
      } catch (error) {
        console.log(`  Error with menu ${menu.id}: ${error.message}`);
      }
    }
    console.log(`✓ Subcategories migrated: ${migratedSubs}\n`);
    
    console.log('4. Verification...\n');
    
    const finalCats = await appPool.query('SELECT COUNT(*) as count FROM categories');
    const finalSubs = await appPool.query('SELECT COUNT(*) as count FROM subcategories');
    
    console.log('Final counts:');
    console.log(`  - Categories: ${finalCats.rows[0].count}`);
    console.log(`  - Subcategories: ${finalSubs.rows[0].count}\n`);
    
    console.log('✅ Migration completed!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await legacyPool.end();
    await appPool.end();
  }
}

migrateCategoriesSimple();