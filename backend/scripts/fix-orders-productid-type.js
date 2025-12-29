const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function fixOrdersProductIdType() {
  try {
    console.log('Starting fix: Convert orders.productId from UUID to INTEGER...');
    
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Check current column type
    const [results] = await sequelize.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name = 'productId';
    `);

    if (results.length === 0) {
      console.log('Column productId not found in orders table.');
      return;
    }

    const currentType = results[0].data_type;
    console.log(`Current productId type: ${currentType}`);

    if (currentType === 'integer') {
      console.log('Column is already INTEGER. No fix needed.');
      return;
    }

    if (currentType !== 'uuid') {
      console.log(`Unexpected column type: ${currentType}. Expected uuid.`);
      return;
    }

    // Step 1: Drop foreign key constraint if it exists
    console.log('Step 1: Dropping foreign key constraint...');
    try {
      await sequelize.query(`
        ALTER TABLE orders 
        DROP CONSTRAINT IF EXISTS "orders_productId_fkey";
      `);
      await sequelize.query(`
        ALTER TABLE orders 
        DROP CONSTRAINT IF EXISTS "orders_productId_fkey1";
      `);
      console.log('Foreign key constraints dropped (if they existed).');
    } catch (error) {
      console.log('No foreign key constraint to drop or already dropped.');
    }

    // Step 2: Check if there are any orders with productId
    const [orderCount] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM orders 
      WHERE "productId" IS NOT NULL;
    `, { type: QueryTypes.SELECT });

    const count = orderCount?.count || 0;
    console.log(`Found ${count} orders with productId.`);

    if (count > 0) {
      // Step 3: Map UUID productIds to INTEGER productIds
      console.log('Step 3: Mapping UUID productIds to INTEGER productIds...');
      
      // Get all products with their uuid and id
      const products = await sequelize.query(`
        SELECT id, uuid
        FROM products;
      `, { type: QueryTypes.SELECT });

      // Create a map of uuid -> integer id
      const uuidToIdMap = new Map();
      products.forEach(product => {
        uuidToIdMap.set(product.uuid, product.id);
      });
      
      console.log(`   Created mapping for ${uuidToIdMap.size} products.`);

      // Check the actual type of orders.id column in database
      const [orderIdCheck] = await sequelize.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'id';
      `);
      
      const orderIdType = orderIdCheck.length > 0 ? orderIdCheck[0].data_type : 'uuid';
      console.log(`   Orders.id column type in database: ${orderIdType}`);

      // Get all orders with UUID productIds
      const orders = await sequelize.query(`
        SELECT id, "productId"
        FROM orders
        WHERE "productId" IS NOT NULL;
      `, { type: QueryTypes.SELECT });

      // Add temporary INTEGER column (drop if exists from previous run)
      console.log('Step 4: Adding temporary INTEGER column...');
      try {
        await sequelize.query(`
          ALTER TABLE orders 
          DROP COLUMN IF EXISTS "productId_new";
        `);
        await sequelize.query(`
          ALTER TABLE orders 
          ADD COLUMN "productId_new" INTEGER;
        `);
        console.log('Temporary column added.');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('Temporary column already exists, dropping it first...');
          await sequelize.query(`
            ALTER TABLE orders 
            DROP COLUMN IF EXISTS "productId_new";
          `);
          await sequelize.query(`
            ALTER TABLE orders 
            ADD COLUMN "productId_new" INTEGER;
          `);
        } else {
          throw error;
        }
      }

      let mappedCount = 0;
      let unmappedCount = 0;

      // Update temporary column with integer productIds
      for (const order of orders) {
        const productUuid = order.productId;
        const integerId = uuidToIdMap.get(productUuid);
        
        // Handle both UUID and integer order.id types
        let whereClause;
        if (orderIdType === 'uuid') {
          whereClause = `WHERE id = CAST(:orderId AS UUID)`;
        } else {
          whereClause = `WHERE id = :orderId`;
        }
        
        if (integerId !== undefined) {
          await sequelize.query(`
            UPDATE orders 
            SET "productId_new" = :integerId
            ${whereClause};
          `, {
            replacements: { 
              integerId: integerId, 
              orderId: order.id 
            },
            type: QueryTypes.UPDATE
          });
          mappedCount++;
        } else {
          console.log(`   Warning: Order ${order.id} has productId ${productUuid} that doesn't exist in products table.`);
          unmappedCount++;
          // Set to NULL for unmapped orders
          await sequelize.query(`
            UPDATE orders 
            SET "productId_new" = NULL
            ${whereClause};
          `, {
            replacements: { orderId: order.id },
            type: QueryTypes.UPDATE
          });
        }
      }

      console.log(`✅ Mapped ${mappedCount} orders to integer productIds.`);
      if (unmappedCount > 0) {
        console.log(`⚠️  ${unmappedCount} orders could not be mapped and were set to NULL.`);
      }

      // Step 5: Drop old UUID column and rename new column
      console.log('Step 5: Replacing old column with new INTEGER column...');
      await sequelize.query(`
        ALTER TABLE orders 
        DROP COLUMN "productId";
      `);
      
      await sequelize.query(`
        ALTER TABLE orders 
        RENAME COLUMN "productId_new" TO "productId";
      `);
      
      console.log('Column replaced successfully.');
    } else {
      // No orders, just change the column type
      console.log('No orders with productId found. Changing column type directly...');
      await sequelize.query(`
        ALTER TABLE orders 
        DROP COLUMN "productId";
      `);
      
      await sequelize.query(`
        ALTER TABLE orders 
        ADD COLUMN "productId" INTEGER;
      `);
      
      console.log('Column type changed to INTEGER.');
    }

    // Step 6: Make productId NOT NULL (as per model definition)
    console.log('Step 6: Setting productId to NOT NULL...');
    try {
      await sequelize.query(`
        ALTER TABLE orders 
        ALTER COLUMN "productId" SET NOT NULL;
      `);
      console.log('productId set to NOT NULL.');
    } catch (error) {
      if (error.message.includes('contains null values')) {
        console.log('⚠️  Warning: Cannot set NOT NULL because there are NULL values.');
        console.log('   Please fix NULL productIds before setting NOT NULL constraint.');
      } else {
        throw error;
      }
    }

    // Step 7: Re-add foreign key constraint
    console.log('Step 7: Re-adding foreign key constraint...');
    try {
      await sequelize.query(`
        ALTER TABLE orders 
        ADD CONSTRAINT "orders_productId_fkey" 
        FOREIGN KEY ("productId") 
        REFERENCES products(id) 
        ON DELETE NO ACTION 
        ON UPDATE CASCADE;
      `);
      console.log('Foreign key constraint re-added successfully.');
    } catch (error) {
      if (error.message.includes('violates foreign key constraint')) {
        console.log('⚠️  Warning: Some orders have invalid productIds. Foreign key constraint not added.');
        console.log('   Please review and fix invalid productIds before adding the constraint manually.');
      } else {
        throw error;
      }
    }

    // Verify the change
    const [verifyResults] = await sequelize.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name = 'productId';
    `);

    const newType = verifyResults[0].data_type;
    console.log(`Verification: productId type is now ${newType}`);
    
    if (newType === 'integer') {
      console.log('✅ Fix completed successfully!');
    } else {
      console.log('⚠️  Warning: Column type verification failed.');
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
  fixOrdersProductIdType()
    .then(() => {
      console.log('Fix script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fix script failed:', error);
      process.exit(1);
    });
}

module.exports = fixOrdersProductIdType;

