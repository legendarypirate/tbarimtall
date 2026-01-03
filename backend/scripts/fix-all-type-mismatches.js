const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function fixAllTypeMismatches() {
  try {
    console.log('Starting comprehensive fix for all type mismatches...');
    
    await sequelize.authenticate();
    console.log('Database connection established.\n');

    // ============================================
    // 1. Fix orders.productId: UUID -> INTEGER
    // ============================================
    console.log('=== Fixing orders.productId ===');
    const [orderProductIdCheck] = await sequelize.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name = 'productId';
    `);

    if (orderProductIdCheck.length > 0) {
      const orderProductIdType = orderProductIdCheck[0].data_type;
      console.log(`Current orders.productId type: ${orderProductIdType}`);

      if (orderProductIdType === 'uuid') {
        console.log('Converting orders.productId from UUID to INTEGER...');
        
        // Drop foreign key constraint
        await sequelize.query(`
          ALTER TABLE orders 
          DROP CONSTRAINT IF EXISTS "orders_productId_fkey";
        `);
        await sequelize.query(`
          ALTER TABLE orders 
          DROP CONSTRAINT IF EXISTS "orders_productId_fkey1";
        `);

        // Check if there are orders
        const [orderCount] = await sequelize.query(`
          SELECT COUNT(*) as count
          FROM orders 
          WHERE "productId" IS NOT NULL;
        `, { type: QueryTypes.SELECT });

        const count = orderCount?.count || 0;
        console.log(`Found ${count} orders with productId.`);

        if (count > 0) {
          // Get products mapping
          const products = await sequelize.query(`
            SELECT id, uuid
            FROM products;
          `, { type: QueryTypes.SELECT });

          const uuidToIdMap = new Map();
          products.forEach(product => {
            uuidToIdMap.set(product.uuid, product.id);
          });
          
          console.log(`Created mapping for ${uuidToIdMap.size} products.`);

          // Check orders.id type
          const [orderIdCheck] = await sequelize.query(`
            SELECT data_type 
            FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name = 'id';
          `);
          const orderIdType = orderIdCheck.length > 0 ? orderIdCheck[0].data_type : 'uuid';

          // Add temporary column
          await sequelize.query(`
            ALTER TABLE orders 
            DROP COLUMN IF EXISTS "productId_new";
          `);
          await sequelize.query(`
            ALTER TABLE orders 
            ADD COLUMN "productId_new" INTEGER;
          `);

          // Get all orders
          const orders = await sequelize.query(`
            SELECT id, "productId"
            FROM orders
            WHERE "productId" IS NOT NULL;
          `, { type: QueryTypes.SELECT });

          let mappedCount = 0;
          for (const order of orders) {
            const productUuid = order.productId;
            const integerId = uuidToIdMap.get(productUuid);
            
            let whereClause = orderIdType === 'uuid' 
              ? `WHERE id = CAST(:orderId AS UUID)` 
              : `WHERE id = :orderId`;
            
            if (integerId !== undefined) {
              await sequelize.query(`
                UPDATE orders 
                SET "productId_new" = :integerId
                ${whereClause};
              `, {
                replacements: { integerId: integerId, orderId: order.id },
                type: QueryTypes.UPDATE
              });
              mappedCount++;
            } else {
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

          console.log(`Mapped ${mappedCount} orders.`);

          // Replace column
          await sequelize.query(`ALTER TABLE orders DROP COLUMN "productId";`);
          await sequelize.query(`ALTER TABLE orders RENAME COLUMN "productId_new" TO "productId";`);
        } else {
          await sequelize.query(`ALTER TABLE orders DROP COLUMN "productId";`);
          await sequelize.query(`ALTER TABLE orders ADD COLUMN "productId" INTEGER;`);
        }

        // Set NOT NULL and re-add constraint
        try {
          await sequelize.query(`ALTER TABLE orders ALTER COLUMN "productId" SET NOT NULL;`);
        } catch (error) {
          console.log('  Warning: Cannot set NOT NULL (may have NULL values)');
        }

        await sequelize.query(`
          ALTER TABLE orders 
          ADD CONSTRAINT "orders_productId_fkey" 
          FOREIGN KEY ("productId") 
          REFERENCES products(id) 
          ON DELETE NO ACTION 
          ON UPDATE CASCADE;
        `);

        console.log('✅ orders.productId fixed!\n');
      } else {
        console.log('orders.productId is already INTEGER. Skipping.\n');
      }
    }

    // ============================================
    // 2. Fix reviews.productId: UUID -> INTEGER
    // ============================================
    console.log('=== Fixing reviews.productId ===');
    const [reviewProductIdCheck] = await sequelize.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'reviews' 
      AND column_name = 'productId';
    `);

    if (reviewProductIdCheck.length > 0) {
      const reviewProductIdType = reviewProductIdCheck[0].data_type;
      console.log(`Current reviews.productId type: ${reviewProductIdType}`);

      if (reviewProductIdType === 'uuid') {
        console.log('Converting reviews.productId from UUID to INTEGER...');
        
        // Drop foreign key constraint
        await sequelize.query(`
          ALTER TABLE reviews 
          DROP CONSTRAINT IF EXISTS "reviews_productId_fkey";
        `);
        await sequelize.query(`
          ALTER TABLE reviews 
          DROP CONSTRAINT IF EXISTS "reviews_productId_fkey1";
        `);

        // Check if there are reviews
        const [reviewCount] = await sequelize.query(`
          SELECT COUNT(*) as count
          FROM reviews 
          WHERE "productId" IS NOT NULL;
        `, { type: QueryTypes.SELECT });

        const count = reviewCount?.count || 0;
        console.log(`Found ${count} reviews with productId.`);

        if (count > 0) {
          // Get products mapping
          const products = await sequelize.query(`
            SELECT id, uuid
            FROM products;
          `, { type: QueryTypes.SELECT });

          const uuidToIdMap = new Map();
          products.forEach(product => {
            uuidToIdMap.set(product.uuid, product.id);
          });

          // Add temporary column
          await sequelize.query(`
            ALTER TABLE reviews 
            DROP COLUMN IF EXISTS "productId_new";
          `);
          await sequelize.query(`
            ALTER TABLE reviews 
            ADD COLUMN "productId_new" INTEGER;
          `);

          // Get all reviews
          const reviews = await sequelize.query(`
            SELECT id, "productId"
            FROM reviews
            WHERE "productId" IS NOT NULL;
          `, { type: QueryTypes.SELECT });

          let mappedCount = 0;
          for (const review of reviews) {
            const productUuid = review.productId;
            const integerId = uuidToIdMap.get(productUuid);
            
            if (integerId !== undefined) {
              await sequelize.query(`
                UPDATE reviews 
                SET "productId_new" = :integerId
                WHERE id = :reviewId;
              `, {
                replacements: { integerId: integerId, reviewId: review.id },
                type: QueryTypes.UPDATE
              });
              mappedCount++;
            } else {
              await sequelize.query(`
                UPDATE reviews 
                SET "productId_new" = NULL
                WHERE id = :reviewId;
              `, {
                replacements: { reviewId: review.id },
                type: QueryTypes.UPDATE
              });
            }
          }

          console.log(`Mapped ${mappedCount} reviews.`);

          // Replace column
          await sequelize.query(`ALTER TABLE reviews DROP COLUMN "productId";`);
          await sequelize.query(`ALTER TABLE reviews RENAME COLUMN "productId_new" TO "productId";`);
        } else {
          await sequelize.query(`ALTER TABLE reviews DROP COLUMN "productId";`);
          await sequelize.query(`ALTER TABLE reviews ADD COLUMN "productId" INTEGER;`);
        }

        // Set NOT NULL and re-add constraint
        try {
          await sequelize.query(`ALTER TABLE reviews ALTER COLUMN "productId" SET NOT NULL;`);
        } catch (error) {
          console.log('  Warning: Cannot set NOT NULL (may have NULL values)');
        }

        await sequelize.query(`
          ALTER TABLE reviews 
          ADD CONSTRAINT "reviews_productId_fkey" 
          FOREIGN KEY ("productId") 
          REFERENCES products(id) 
          ON DELETE CASCADE 
          ON UPDATE CASCADE;
        `);

        console.log('✅ reviews.productId fixed!\n');
      } else {
        console.log('reviews.productId is already INTEGER. Skipping.\n');
      }
    }

    // ============================================
    // 3. Fix products.size: VARCHAR(50) -> VARCHAR(255)
    // ============================================
    console.log('=== Fixing products.size ===');
    const [sizeCheck] = await sequelize.query(`
      SELECT data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'size';
    `);

    if (sizeCheck.length > 0) {
      const maxLength = sizeCheck[0].character_maximum_length;
      console.log(`Current products.size max length: ${maxLength}`);

      if (maxLength && maxLength < 255) {
        console.log('Expanding products.size to VARCHAR(255)...');
        await sequelize.query(`
          ALTER TABLE products 
          ALTER COLUMN "size" TYPE VARCHAR(255);
        `);
        console.log('✅ products.size fixed!\n');
      } else {
        console.log('products.size is already VARCHAR(255) or larger. Skipping.\n');
      }
    }

    // ============================================
    // 4. Fix download_tokens.id: INTEGER -> UUID (if needed)
    // ============================================
    console.log('=== Fixing download_tokens.id ===');
    const [downloadTokenIdCheck] = await sequelize.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'download_tokens' 
      AND column_name = 'id';
    `);

    if (downloadTokenIdCheck.length > 0) {
      const downloadTokenIdType = downloadTokenIdCheck[0].data_type;
      console.log(`Current download_tokens.id type: ${downloadTokenIdType}`);

      if (downloadTokenIdType === 'integer') {
        console.log('Converting download_tokens.id from INTEGER to UUID...');
        
        // Drop primary key constraint
        await sequelize.query(`
          ALTER TABLE download_tokens 
          DROP CONSTRAINT IF EXISTS "download_tokens_pkey";
        `);

        // Check if there are tokens
        const [tokenCount] = await sequelize.query(`
          SELECT COUNT(*) as count
          FROM download_tokens;
        `, { type: QueryTypes.SELECT });

        const count = tokenCount?.count || 0;
        console.log(`Found ${count} download tokens.`);

        if (count > 0) {
          // Add temporary UUID column
          await sequelize.query(`
            ALTER TABLE download_tokens 
            DROP COLUMN IF EXISTS "id_new";
          `);
          await sequelize.query(`
            ALTER TABLE download_tokens 
            ADD COLUMN "id_new" UUID DEFAULT gen_random_uuid();
          `);

          // Replace column
          await sequelize.query(`ALTER TABLE download_tokens DROP COLUMN "id";`);
          await sequelize.query(`ALTER TABLE download_tokens RENAME COLUMN "id_new" TO "id";`);
        } else {
          await sequelize.query(`ALTER TABLE download_tokens DROP COLUMN "id";`);
          await sequelize.query(`
            ALTER TABLE download_tokens 
            ADD COLUMN "id" UUID DEFAULT gen_random_uuid();
          `);
        }

        // Re-add primary key
        await sequelize.query(`
          ALTER TABLE download_tokens 
          ADD PRIMARY KEY ("id");
        `);

        console.log('✅ download_tokens.id fixed!\n');
      } else {
        console.log('download_tokens.id is already UUID. Skipping.\n');
      }
    }

    console.log('✅ All type mismatches fixed successfully!');

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
  fixAllTypeMismatches()
    .then(() => {
      console.log('Fix script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fix script failed:', error);
      process.exit(1);
    });
}

module.exports = fixAllTypeMismatches;

