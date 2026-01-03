// fix-remaining-issues.js
const { Pool } = require('pg');
require('dotenv').config();

async function fixRemainingIssues() {
  const appPool = new Pool({
    database: 'tbarimt_db',
    user: 'postgres',
    password: process.env.DB_PASSWORD || 'Joker0328',
    host: 'localhost',
    port: 5432
  });

  try {
    console.log('Fixing remaining migration issues...\n');

    // 1. Fix subcategory issues
    console.log('1. Fixing subcategory foreign key issues...');
    await appPool.query(`
      UPDATE products 
      SET "subcategoryId" = NULL 
      WHERE "subcategoryId" IS NOT NULL 
        AND "subcategoryId" NOT IN (SELECT id FROM subcategories)
    `);
    
    const fixedResult = await appPool.query(`
      SELECT COUNT(*) as fixed_count FROM products 
      WHERE "subcategoryId" IS NOT NULL 
        AND "subcategoryId" NOT IN (SELECT id FROM subcategories)
    `);
    console.log(`   Found ${fixedResult.rows[0].fixed_count} products with invalid subcategories\n`);

    // 2. Create missing users (FIXED: Cast 'viewer' to enum type)
    console.log('2. Creating missing users...');
    try {
      await appPool.query(`
        INSERT INTO users (id, username, email, password, "fullName", role, "isActive", "createdAt", "updatedAt")
        SELECT 
          DISTINCT p."authorId",
          'user_' || p."authorId",
          'user' || p."authorId" || '@legacy.com',
          'legacy_password_needs_reset',
          'Legacy Author ' || p."authorId",
          'viewer'::enum_users_role,  -- CAST to enum type
          true,
          NOW(),
          NOW()
        FROM products p
        WHERE p."authorId" NOT IN (SELECT id FROM users)
          AND p."authorId" IS NOT NULL
        ON CONFLICT (id) DO NOTHING
      `);
    } catch (error) {
      console.log(`   Error creating users: ${error.message}`);
      console.log('   Trying alternative approach...');
      
      // Alternative: Create users with explicit column list
      await appPool.query(`
        INSERT INTO users (id, username, email, password, "fullName", "isActive", "createdAt", "updatedAt")
        SELECT 
          DISTINCT p."authorId",
          'user_' || p."authorId",
          'user' || p."authorId" || '@legacy.com',
          'legacy_password_needs_reset',
          'Legacy Author ' || p."authorId",
          true,
          NOW(),
          NOW()
        FROM products p
        WHERE p."authorId" NOT IN (SELECT id FROM users)
          AND p."authorId" IS NOT NULL
        ON CONFLICT (id) DO NOTHING
      `);
    }
    
    const usersResult = await appPool.query(`
      SELECT COUNT(*) as users_created 
      FROM users 
      WHERE username LIKE 'user_%' 
        AND email LIKE '%@legacy.com'
    `);
    console.log(`   Created ${usersResult.rows[0].users_created} missing users\n`);

    // 3. Fix any remaining author issues
    console.log('3. Fixing remaining author issues...');
    const defaultUserId = await appPool.query(`
      SELECT id FROM users WHERE "isSuperAdmin" = true OR role = 'admin'::enum_users_role LIMIT 1
    `);
    
    const defaultId = defaultUserId.rows[0]?.id || 1;
    
    await appPool.query(`
      UPDATE products 
      SET "authorId" = $1
      WHERE "authorId" IS NULL 
         OR "authorId" NOT IN (SELECT id FROM users)
    `, [defaultId]);
    
    console.log(`   Set default author ID: ${defaultId} for products with invalid authors\n`);

    // 4. Fix any remaining category issues
    console.log('4. Fixing remaining category issues...');
    const defaultCategoryId = await appPool.query(`
      SELECT id FROM categories LIMIT 1
    `);
    
    const defaultCatId = defaultCategoryId.rows[0]?.id || 1;
    
    await appPool.query(`
      UPDATE products 
      SET "categoryId" = $1
      WHERE "categoryId" IS NULL 
         OR "categoryId" NOT IN (SELECT id FROM categories)
    `, [defaultCatId]);
    
    console.log(`   Set default category ID: ${defaultCatId} for products with invalid categories\n`);

    // 5. Final verification
    console.log('5. Final verification...\n');
    
    const verification = await appPool.query(`
      SELECT 
        COUNT(*) as total_products,
        SUM(CASE WHEN "authorId" NOT IN (SELECT id FROM users) THEN 1 ELSE 0 END) as invalid_authors,
        SUM(CASE WHEN "categoryId" NOT IN (SELECT id FROM categories) THEN 1 ELSE 0 END) as invalid_categories,
        SUM(CASE WHEN "subcategoryId" IS NOT NULL 
                 AND "subcategoryId" NOT IN (SELECT id FROM subcategories) 
                 THEN 1 ELSE 0 END) as invalid_subcategories
      FROM products
    `);

    const stats = verification.rows[0];
    console.log('=== FINAL STATISTICS ===');
    console.log(`Total products: ${stats.total_products}`);
    console.log(`Products with invalid authors: ${stats.invalid_authors}`);
    console.log(`Products with invalid categories: ${stats.invalid_categories}`);
    console.log(`Products with invalid subcategories: ${stats.invalid_subcategories}\n`);

    // Check legacy vs migrated
    const legacyPool = new Pool({
      database: 'tbarimt',
      user: 'postgres',
      password: process.env.DB_PASSWORD || 'Joker0328',
      host: 'localhost',
      port: 5432
    });

    const legacyCount = await legacyPool.query('SELECT COUNT(*) as count FROM tbarimt.base');
    console.log('=== MIGRATION COMPLETENESS ===');
    console.log(`Legacy products: ${legacyCount.rows[0].count}`);
    console.log(`Migrated products: ${stats.total_products}`);
    console.log(`Migration rate: ${((stats.total_products / legacyCount.rows[0].count) * 100).toFixed(1)}%\n`);

    if (stats.invalid_authors === 0 && stats.invalid_categories === 0 && stats.invalid_subcategories === 0) {
      console.log('✅ SUCCESS: All foreign key constraints are satisfied!');
      console.log('🎉 Your Node.js app should now work with all migrated data!');
    } else {
      console.log('⚠️  WARNING: Some foreign key issues remain.');
      console.log('\nRun these SQL commands manually:');
      
      if (stats.invalid_authors > 0) {
        console.log(`\nFix authors (${stats.invalid_authors} products):`);
        console.log(`
          UPDATE products 
          SET "authorId" = ${defaultId} 
          WHERE "authorId" NOT IN (SELECT id FROM users);
        `);
      }
      if (stats.invalid_categories > 0) {
        console.log(`\nFix categories (${stats.invalid_categories} products):`);
        console.log(`
          UPDATE products 
          SET "categoryId" = ${defaultCatId} 
          WHERE "categoryId" NOT IN (SELECT id FROM categories);
        `);
      }
      if (stats.invalid_subcategories > 0) {
        console.log(`\nFix subcategories (${stats.invalid_subcategories} products):`);
        console.log(`
          UPDATE products 
          SET "subcategoryId" = NULL 
          WHERE "subcategoryId" NOT IN (SELECT id FROM subcategories);
        `);
      }
    }

    await legacyPool.end();

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await appPool.end();
  }
}

// Run the fix
fixRemainingIssues();