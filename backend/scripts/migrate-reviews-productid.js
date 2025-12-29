const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function migrateReviewsProductId() {
  try {
    console.log('Starting migration: Alter reviews.productId from INTEGER to UUID...');
    
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Check current column type
    const [results] = await sequelize.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'reviews' 
      AND column_name = 'productId';
    `);

    if (results.length === 0) {
      console.log('Column productId not found in reviews table. Skipping migration.');
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
        ALTER TABLE reviews 
        DROP CONSTRAINT IF EXISTS "reviews_productId_fkey";
      `);
      await sequelize.query(`
        ALTER TABLE reviews 
        DROP CONSTRAINT IF EXISTS "reviews_productId_fkey1";
      `);
      console.log('Foreign key constraint dropped (if it existed).');
    } catch (error) {
      console.log('No foreign key constraint to drop or already dropped.');
    }

    // Step 2: Verify products table has both id and uuid columns
    console.log('Step 2: Verifying products table structure...');
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

    // Step 3: Add temporary UUID column
    console.log('Step 3: Adding temporary UUID column...');
    try {
      await sequelize.query(`
        ALTER TABLE reviews 
        ADD COLUMN "productId_new" UUID;
      `);
      console.log('Temporary column added.');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('Temporary column already exists, dropping it first...');
        await sequelize.query(`
          ALTER TABLE reviews 
          DROP COLUMN IF EXISTS "productId_new";
        `);
        await sequelize.query(`
          ALTER TABLE reviews 
          ADD COLUMN "productId_new" UUID;
        `);
      } else {
        throw error;
      }
    }

    // Step 4: Get all products with their integer id and uuid
    console.log('Step 4: Fetching all products with id and uuid...');
    const products = await sequelize.query(`
      SELECT id, uuid, "createdAt"
      FROM products
      ORDER BY id ASC;
    `, { type: QueryTypes.SELECT });

    console.log(`Found ${products.length} products in database.`);

    // Create a map of integer id -> uuid for quick lookup
    const productIdMap = new Map();
    products.forEach(product => {
      productIdMap.set(product.id, product.uuid);
    });
    
    console.log(`   Created mapping for ${productIdMap.size} products.`);

    // Step 5: Get all reviews with their productIds
    console.log('Step 5: Fetching all reviews...');
    const allReviews = await sequelize.query(`
      SELECT id, "productId"
      FROM reviews
      WHERE "productId" IS NOT NULL;
    `, { type: QueryTypes.SELECT });

    console.log(`   Processing ${allReviews.length} reviews...`);

    let mappedCount = 0;
    let unmappedCount = 0;
    const unmappedReviews = [];

    for (const review of allReviews) {
      const integerProductId = parseInt(review.productId);
      
      // Look up the UUID using the integer id
      if (!isNaN(integerProductId) && productIdMap.has(integerProductId)) {
        const mappedProductUuid = productIdMap.get(integerProductId);
        
        // Update the temporary column with the UUID
        await sequelize.query(`
          UPDATE reviews 
          SET "productId_new" = CAST(:productUuid AS UUID)
          WHERE id = :reviewId;
        `, {
          replacements: { 
            productUuid: mappedProductUuid, 
            reviewId: review.id 
          },
          type: QueryTypes.UPDATE
        });
        
        mappedCount++;
      } else {
        // Can't map this review - productId doesn't exist in products table
        unmappedCount++;
        unmappedReviews.push({
          reviewId: review.id,
          productId: review.productId
        });
        
        // Set to NULL for unmapped reviews (or delete them)
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

    console.log(`✅ Mapped ${mappedCount} reviews to product UUIDs.`);
    if (unmappedCount > 0) {
      console.log(`⚠️  ${unmappedCount} reviews could not be mapped and were set to NULL.`);
      console.log('   Unmapped reviews:', unmappedReviews.slice(0, 10)); // Show first 10
      if (unmappedReviews.length > 10) {
        console.log(`   ... and ${unmappedReviews.length - 10} more.`);
      }
    }

    // Step 6: Drop old column and rename new column
    console.log('Step 6: Replacing old column with new UUID column...');
    await sequelize.query(`
      ALTER TABLE reviews 
      DROP COLUMN "productId";
    `);
    
    await sequelize.query(`
      ALTER TABLE reviews 
      RENAME COLUMN "productId_new" TO "productId";
    `);
    
    // Make productId NOT NULL
    await sequelize.query(`
      ALTER TABLE reviews 
      ALTER COLUMN "productId" SET NOT NULL;
    `);
    
    console.log('Column replaced successfully.');

    // Step 7: Re-add foreign key constraint
    console.log('Step 7: Re-adding foreign key constraint...');
    try {
      await sequelize.query(`
        ALTER TABLE reviews 
        ADD CONSTRAINT "reviews_productId_fkey" 
        FOREIGN KEY ("productId") 
        REFERENCES products(uuid) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
      `);
      console.log('Foreign key constraint re-added successfully.');
    } catch (error) {
      if (error.message.includes('violates foreign key constraint')) {
        console.log('⚠️  Warning: Some reviews have invalid productIds. Foreign key constraint not added.');
        console.log('   Please review and fix unmapped reviews before adding the constraint manually.');
      } else {
        throw error;
      }
    }

    // Verify the change
    const [verifyResults] = await sequelize.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'reviews' 
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
  migrateReviewsProductId()
    .then(() => {
      console.log('Migration script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrateReviewsProductId;

