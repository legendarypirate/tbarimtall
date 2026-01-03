// migrate-legacy-data.js
const { Pool } = require('pg');
const { randomBytes } = require('crypto');
require('dotenv').config();

// Simple UUID v4 generator (no external dependency)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function migrateLegacyData() {
  console.log('=== Migrating from tbarimt.tbarimt to tbarimt_db.public ===\n');
  
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
    console.log('1. Checking data counts...\n');
    
    // Check legacy data
    const memberCount = await legacyPool.query('SELECT COUNT(*) as count FROM tbarimt.member');
    const baseCount = await legacyPool.query('SELECT COUNT(*) as count FROM tbarimt.base');
    
    console.log(`Legacy database (tbarimt.tbarimt):`);
    console.log(`  - Members: ${memberCount.rows[0].count}`);
    console.log(`  - Products: ${baseCount.rows[0].count}\n`);
    
    // Check current app data
    const appUserCount = await appPool.query('SELECT COUNT(*) as count FROM users');
    const appProductCount = await appPool.query('SELECT COUNT(*) as count FROM products');
    
    console.log(`App database (tbarimt_db.public):`);
    console.log(`  - Current users: ${appUserCount.rows[0].count}`);
    console.log(`  - Current products: ${appProductCount.rows[0].count}\n`);

    console.log('2. Starting migration...\n');
    
    // MIGRATE USERS
    console.log('Migrating users...');
    const { rows: legacyUsers } = await legacyPool.query(`
      SELECT id, string_id, photo, fullname, password, email,
             tolov, type, last_login, created_at, updated_at
      FROM tbarimt.member 
      ORDER BY id
    `);

    let migratedUsers = 0;
    let userErrors = 0;
    
    for (const user of legacyUsers) {
      try {
        // Generate username
        let username = user.string_id;
        if (!username || username.trim() === '') {
          const emailPrefix = user.email ? user.email.split('@')[0] : '';
          username = emailPrefix ? 
            `${emailPrefix.substring(0, 20)}_${user.id}` : 
            `user_${user.id}`;
        }
        
        // Ensure unique email
        let email = user.email;
        if (!email || email.trim() === '') {
          email = `user${user.id}@legacy.com`;
        }
        
        // Determine role
        let role = 'viewer';
        if (user.type === 1) role = 'admin';
        else if (user.type === 2) role = 'journalist';
        
        // Check if email already exists
        const existingUser = await appPool.query(
          'SELECT id FROM users WHERE email = $1 LIMIT 1',
          [email]
        );

        if (existingUser.rows.length > 0) {
          // Skip if user already exists
          migratedUsers++;
          continue;
        }

        // Insert user
        await appPool.query(
          `INSERT INTO users (
            id, username, email, password, "fullName", avatar, role,
            "membership_type", "isActive", "isSuperAdmin",
            "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO NOTHING`,
          [
            user.id,
            username.substring(0, 100),
            email,
            user.password || 'legacy_password_needs_reset',
            (user.fullname?.substring(0, 255) || `User ${user.id}`).trim(),
            user.photo || null,
            role,
            user.tolov || null,
            true,
            user.type === 1,
            user.created_at || new Date(),
            user.updated_at || new Date()
          ]
        );

        migratedUsers++;
        if (migratedUsers % 100 === 0) {
          console.log(`  ...${migratedUsers} users migrated`);
        }
      } catch (error) {
        console.log(`  Error with user ${user.id}: ${error.message}`);
        userErrors++;
      }
    }
    console.log(`✓ Users migrated: ${migratedUsers}/${legacyUsers.length} (errors: ${userErrors})\n`);

    // MIGRATE PRODUCTS
    console.log('Migrating products...');
    const { rows: legacyProducts } = await legacyPool.query(`
      SELECT id, title, thumb, pic1, pic2, pic3, descraption, 
             view, date, cat_id, sec_id, download_link, 
             hel, size, user_id, tailbar, survalj, butsaah_eseh, price
      FROM tbarimt.base 
      ORDER BY id
    `);

    let migratedProducts = 0;
    let productErrors = 0;
    
    for (const product of legacyProducts) {
      try {
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

        // Check if product already exists
        const existingProduct = await appPool.query(
          'SELECT id FROM products WHERE id = $1 LIMIT 1',
          [product.id]
        );

        if (existingProduct.rows.length > 0) {
          migratedProducts++;
          continue;
        }

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
            product.cat_id || 1,
            product.sec_id > 0 ? product.sec_id : null,
            product.user_id || 1,
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
        if (migratedProducts % 100 === 0) {
          console.log(`  ...${migratedProducts} products migrated`);
        }
      } catch (error) {
        console.log(`  Error with product ${product.id}: ${error.message}`);
        productErrors++;
      }
    }
    console.log(`✓ Products migrated: ${migratedProducts}/${legacyProducts.length} (errors: ${productErrors})\n`);

    // FINAL CHECK
    console.log('3. Final verification...\n');
    
    const finalUserCount = await appPool.query('SELECT COUNT(*) as count FROM users');
    const finalProductCount = await appPool.query('SELECT COUNT(*) as count FROM products');
    
    console.log(`Final counts in tbarimt_db:`);
    console.log(`  - Users: ${finalUserCount.rows[0].count}`);
    console.log(`  - Products: ${finalProductCount.rows[0].count}\n`);

    // Show summary
    console.log('=== Migration Summary ===');
    console.log(`Users: ${migratedUsers} migrated, ${userErrors} errors`);
    console.log(`Products: ${migratedProducts} migrated, ${productErrors} errors`);
    console.log('\n✅ Migration completed!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  } finally {
    await legacyPool.end();
    await appPool.end();
  }
}

// Run migration
if (require.main === module) {
  console.log('Starting migration process...\n');
  migrateLegacyData().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { migrateLegacyData };