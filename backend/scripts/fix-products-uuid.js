const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function fixProductsUuid() {
  try {
    console.log('Starting fix: Ensure all products have UUID...');
    
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Check if uuid column exists
    const [uuidCheck] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'uuid';
    `);

    if (uuidCheck.length === 0) {
      console.log('UUID column does not exist. Adding UUID column...');
      await sequelize.query(`
        ALTER TABLE products 
        ADD COLUMN uuid UUID;
      `);
      console.log('UUID column added.');
    } else {
      console.log('UUID column exists.');
    }

    // Find products without UUID
    const productsWithoutUuid = await sequelize.query(`
      SELECT id, title
      FROM products
      WHERE uuid IS NULL;
    `, { type: QueryTypes.SELECT });

    const productsArray = Array.isArray(productsWithoutUuid) ? productsWithoutUuid : [];
    
    if (productsArray.length === 0) {
      console.log('✅ All products already have UUID. No fix needed.');
      
      // Make UUID NOT NULL and add unique constraint if not already set
      try {
        await sequelize.query(`
          ALTER TABLE products 
          ALTER COLUMN uuid SET NOT NULL;
        `);
        console.log('UUID column set to NOT NULL.');
      } catch (error) {
        if (error.message.includes('already')) {
          console.log('UUID column is already NOT NULL.');
        } else {
          throw error;
        }
      }

      try {
        await sequelize.query(`
          ALTER TABLE products 
          ADD CONSTRAINT products_uuid_unique UNIQUE (uuid);
        `);
        console.log('Unique constraint added to UUID column.');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('Unique constraint already exists on UUID column.');
        } else {
          throw error;
        }
      }

      return;
    }

    console.log(`Found ${productsArray.length} products without UUID.`);

    // Add UUID to products that don't have one using database function
    let fixedCount = 0;
    for (const product of productsArray) {
      await sequelize.query(`
        UPDATE products 
        SET uuid = gen_random_uuid()
        WHERE id = :id AND uuid IS NULL;
      `, {
        replacements: { id: product.id }
      });

      fixedCount++;
      const title = product.title ? product.title.substring(0, 50) : 'Untitled';
      console.log(`   Fixed product ${product.id}: ${title}...`);
    }

    console.log(`✅ Fixed ${fixedCount} products with UUID.`);

    // Make UUID NOT NULL and add unique constraint
    try {
      await sequelize.query(`
        ALTER TABLE products 
        ALTER COLUMN uuid SET NOT NULL;
      `);
      console.log('UUID column set to NOT NULL.');
    } catch (error) {
      if (error.message.includes('already')) {
        console.log('UUID column is already NOT NULL.');
      } else {
        throw error;
      }
    }

    try {
      await sequelize.query(`
        ALTER TABLE products 
        ADD CONSTRAINT products_uuid_unique UNIQUE (uuid);
      `);
      console.log('Unique constraint added to UUID column.');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('Unique constraint already exists on UUID column.');
      } else {
        throw error;
      }
    }

    // Verify all products have UUID
    const [verify] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM products
      WHERE uuid IS NULL;
    `, { type: QueryTypes.SELECT });

    const nullCount = verify?.count || 0;
    if (nullCount === 0) {
      console.log('✅ Verification: All products now have UUID!');
    } else {
      console.log(`⚠️  Warning: ${nullCount} products still missing UUID.`);
    }

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.error('Full error:', error);
    throw error;
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

// Run fix
if (require.main === module) {
  fixProductsUuid()
    .then(() => {
      console.log('Fix script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fix script failed:', error);
      process.exit(1);
    });
}

module.exports = fixProductsUuid;

