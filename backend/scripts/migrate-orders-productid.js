const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function migrateOrdersProductId() {
  try {
    console.log('Starting migration: Alter orders.productId from INTEGER to UUID...');
    
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
      console.log('Column productId not found in orders table. Skipping migration.');
      return;
    }

    const currentType = results[0].data_type;
    console.log(`Current productId type: ${currentType}`);

    if (currentType === 'uuid') {
      console.log('Column is already UUID. No migration needed.');
      return;
    }

    // Step 1: Drop foreign key constraint if it exists
    console.log('Step 1: Dropping foreign key constraint...');
    try {
      await sequelize.query(`
        ALTER TABLE orders 
        DROP CONSTRAINT IF EXISTS "orders_productId_fkey";
      `);
      console.log('Foreign key constraint dropped (if it existed).');
    } catch (error) {
      console.log('No foreign key constraint to drop or already dropped.');
    }

    // Step 2: Add temporary UUID column
    console.log('Step 2: Adding temporary UUID column...');
    try {
      await sequelize.query(`
        ALTER TABLE orders 
        ADD COLUMN "productId_new" UUID;
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
          ADD COLUMN "productId_new" UUID;
        `);
      } else {
        throw error;
      }
    }

    // Step 3: Get all unique integer productIds from orders
    console.log('Step 3: Analyzing orders data...');
    const orderProductIds = await sequelize.query(`
      SELECT DISTINCT "productId" 
      FROM orders 
      WHERE "productId" IS NOT NULL;
    `, { type: QueryTypes.SELECT });

    // Ensure orderProductIds is an array
    const productIdsArray = Array.isArray(orderProductIds) ? orderProductIds : [];
    console.log(`Found ${productIdsArray.length} unique productId values in orders.`);
    
    if (productIdsArray.length === 0) {
      console.log('No orders with productId found. Proceeding with column type change only...');
      // If no orders, we can use the same temp column approach but skip the mapping
      // The temp column will be NULL for all rows (since there are no orders with productId)
      // Then we just replace the old column
      await sequelize.query(`
        ALTER TABLE orders 
        DROP COLUMN "productId";
      `);
      await sequelize.query(`
        ALTER TABLE orders 
        ADD COLUMN "productId" UUID;
      `);
      console.log('Column type changed to UUID (no data to migrate).');
      
      // Re-add foreign key constraint
      console.log('Re-adding foreign key constraint...');
      await sequelize.query(`
        ALTER TABLE orders 
        ADD CONSTRAINT "orders_productId_fkey" 
        FOREIGN KEY ("productId") 
        REFERENCES products(uuid) 
        ON DELETE NO ACTION 
        ON UPDATE CASCADE;
      `);
      console.log('✅ Migration completed successfully!');
      return;
    }

    // Step 4: Verify products table has both id and uuid columns
    console.log('Step 4: Verifying products table structure...');
    const [productColumns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name IN ('id', 'uuid');
    `);

    const hasId = productColumns.some(col => col.column_name === 'id' && col.data_type === 'integer');
    const hasUuid = productColumns.some(col => col.column_name === 'uuid' && col.data_type === 'uuid');

    if (!hasId || !hasUuid) {
      console.error('❌ Products table is missing required columns!');
      console.error('   Expected: id (integer) and uuid (UUID)');
      console.error('   Please run the products migration first:');
      console.error('   npm run migrate:products-id');
      throw new Error('Products table must have both integer id and uuid columns. Run migrate:products-id first.');
    }

    console.log('   Products table structure verified (has integer id and uuid columns).');

    // Step 5: Get all products with their integer id and uuid
    console.log('Step 5: Fetching all products with id and uuid...');
    const products = await sequelize.query(`
      SELECT id, uuid, "createdAt"
      FROM products
      ORDER BY id ASC;
    `, { type: QueryTypes.SELECT });

    console.log(`Found ${products.length} products in database.`);

    // Step 6: Map integer productIds to UUIDs using the integer id column
    console.log('Step 6: Mapping integer productIds to UUIDs using products.id...');
    
    // Create a map of integer id -> uuid for quick lookup
    const productIdMap = new Map();
    products.forEach(product => {
      productIdMap.set(product.id, product.uuid);
    });
    
    console.log(`   Created mapping for ${productIdMap.size} products.`);
    
    // First, let's see what integer productIds we have
    const integerIds = productIdsArray.map(r => parseInt(r.productId)).filter(id => !isNaN(id));
    if (integerIds.length > 0) {
      const minId = Math.min(...integerIds);
      const maxId = Math.max(...integerIds);
      console.log(`   Integer productId range: ${minId} to ${maxId}`);
    } else {
      console.log('   No valid integer productIds found.');
    }
    
    let mappedCount = 0;
    let unmappedCount = 0;
    const unmappedOrders = [];

    // Get all orders with their productIds
    const allOrders = await sequelize.query(`
      SELECT id, "productId"
      FROM orders
      WHERE "productId" IS NOT NULL;
    `, { type: QueryTypes.SELECT });

    // Check the actual type of orders.id column in database
    const [orderIdCheck] = await sequelize.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name = 'id';
    `);
    
    const orderIdType = orderIdCheck.length > 0 ? orderIdCheck[0].data_type : 'uuid';
    console.log(`   Orders.id column type in database: ${orderIdType}`);

    console.log(`   Processing ${allOrders.length} orders...`);

    for (const order of allOrders) {
      const integerProductId = parseInt(order.productId);
      
      // Look up the UUID using the integer id
      if (!isNaN(integerProductId) && productIdMap.has(integerProductId)) {
        const mappedProductUuid = productIdMap.get(integerProductId);
        
        // Update the temporary column with the UUID
        // Handle both UUID and integer order.id types
        let whereClause;
        if (orderIdType === 'uuid') {
          whereClause = `WHERE id = CAST(:orderId AS UUID)`;
        } else {
          whereClause = `WHERE id = :orderId`;
        }
        
        await sequelize.query(`
          UPDATE orders 
          SET "productId_new" = CAST(:productUuid AS UUID)
          ${whereClause};
        `, {
          replacements: { 
            productUuid: mappedProductUuid, 
            orderId: order.id 
          },
          type: QueryTypes.UPDATE
        });
        
        mappedCount++;
      } else {
        // Can't map this order - productId doesn't exist in products table
        unmappedCount++;
        unmappedOrders.push({
          orderId: order.id,
          productId: order.productId
        });
        
        // Set to NULL for unmapped orders
        let whereClause;
        if (orderIdType === 'uuid') {
          whereClause = `WHERE id = CAST(:orderId AS UUID)`;
        } else {
          whereClause = `WHERE id = :orderId`;
        }
        
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

    console.log(`✅ Mapped ${mappedCount} orders to product UUIDs.`);
    if (unmappedCount > 0) {
      console.log(`⚠️  ${unmappedCount} orders could not be mapped and were set to NULL.`);
      console.log('   Unmapped orders:', unmappedOrders.slice(0, 10)); // Show first 10
      if (unmappedOrders.length > 10) {
        console.log(`   ... and ${unmappedOrders.length - 10} more.`);
      }
    }

    // Step 7: Drop old column and rename new column
    console.log('Step 7: Replacing old column with new UUID column...');
    await sequelize.query(`
      ALTER TABLE orders 
      DROP COLUMN "productId";
    `);
    
    await sequelize.query(`
      ALTER TABLE orders 
      RENAME COLUMN "productId_new" TO "productId";
    `);
    
    // Make productId NOT NULL if it was before (but we set some to NULL, so we'll allow NULL for now)
    // You can change this if needed
    console.log('Column replaced successfully.');

    // Step 8: Re-add foreign key constraint (only for non-NULL values)
    console.log('Step 8: Re-adding foreign key constraint...');
    try {
      await sequelize.query(`
        ALTER TABLE orders 
        ADD CONSTRAINT "orders_productId_fkey" 
        FOREIGN KEY ("productId") 
        REFERENCES products(uuid) 
        ON DELETE NO ACTION 
        ON UPDATE CASCADE;
      `);
      console.log('Foreign key constraint re-added successfully.');
    } catch (error) {
      if (error.message.includes('violates foreign key constraint')) {
        console.log('⚠️  Warning: Some orders have invalid productIds. Foreign key constraint not added.');
        console.log('   Please review and fix unmapped orders before adding the constraint manually.');
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
    
    if (newType === 'uuid') {
      console.log('✅ Migration completed successfully!');
    } else {
      console.log('⚠️  Warning: Column type verification failed.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    throw error;
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

// Run migration
if (require.main === module) {
  migrateOrdersProductId()
    .then(() => {
      console.log('Migration script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrateOrdersProductId;

