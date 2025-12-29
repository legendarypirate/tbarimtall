const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function fixReviewsProductIdType() {
  try {
    console.log('Starting fix: Convert reviews.productId from UUID to INTEGER...');
    
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
      console.log('Column productId not found in reviews table.');
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
        ALTER TABLE reviews 
        DROP CONSTRAINT IF EXISTS "reviews_productId_fkey";
      `);
      await sequelize.query(`
        ALTER TABLE reviews 
        DROP CONSTRAINT IF EXISTS "reviews_productId_fkey1";
      `);
      console.log('Foreign key constraints dropped (if they existed).');
    } catch (error) {
      console.log('No foreign key constraint to drop or already dropped.');
    }

    // Step 2: Check if there are any reviews with productId
    const [reviewCount] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM reviews 
      WHERE "productId" IS NOT NULL;
    `, { type: QueryTypes.SELECT });

    const count = reviewCount?.count || 0;
    console.log(`Found ${count} reviews with productId.`);

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

      // Get all reviews with UUID productIds
      const reviews = await sequelize.query(`
        SELECT id, "productId"
        FROM reviews
        WHERE "productId" IS NOT NULL;
      `, { type: QueryTypes.SELECT });

      // Add temporary INTEGER column
      console.log('Step 4: Adding temporary INTEGER column...');
      try {
        await sequelize.query(`
          ALTER TABLE reviews 
          DROP COLUMN IF EXISTS "productId_new";
        `);
        await sequelize.query(`
          ALTER TABLE reviews 
          ADD COLUMN "productId_new" INTEGER;
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
            ADD COLUMN "productId_new" INTEGER;
          `);
        } else {
          throw error;
        }
      }

      let mappedCount = 0;
      let unmappedCount = 0;

      // Update temporary column with integer productIds
      for (const review of reviews) {
        const productUuid = review.productId;
        const integerId = uuidToIdMap.get(productUuid);
        
        if (integerId !== undefined) {
          await sequelize.query(`
            UPDATE reviews 
            SET "productId_new" = :integerId
            WHERE id = :reviewId;
          `, {
            replacements: { 
              integerId: integerId, 
              reviewId: review.id 
            },
            type: QueryTypes.UPDATE
          });
          mappedCount++;
        } else {
          console.log(`   Warning: Review ${review.id} has productId ${productUuid} that doesn't exist in products table.`);
          unmappedCount++;
          // Set to NULL for unmapped reviews
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

      console.log(`✅ Mapped ${mappedCount} reviews to integer productIds.`);
      if (unmappedCount > 0) {
        console.log(`⚠️  ${unmappedCount} reviews could not be mapped and were set to NULL.`);
      }

      // Step 5: Drop old UUID column and rename new column
      console.log('Step 5: Replacing old column with new INTEGER column...');
      await sequelize.query(`
        ALTER TABLE reviews 
        DROP COLUMN "productId";
      `);
      
      await sequelize.query(`
        ALTER TABLE reviews 
        RENAME COLUMN "productId_new" TO "productId";
      `);
      
      console.log('Column replaced successfully.');
    } else {
      // No reviews, just change the column type
      console.log('No reviews with productId found. Changing column type directly...');
      await sequelize.query(`
        ALTER TABLE reviews 
        DROP COLUMN "productId";
      `);
      
      await sequelize.query(`
        ALTER TABLE reviews 
        ADD COLUMN "productId" INTEGER;
      `);
      
      console.log('Column type changed to INTEGER.');
    }

    // Step 6: Make productId NOT NULL (as per model definition)
    console.log('Step 6: Setting productId to NOT NULL...');
    try {
      await sequelize.query(`
        ALTER TABLE reviews 
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
        ALTER TABLE reviews 
        ADD CONSTRAINT "reviews_productId_fkey" 
        FOREIGN KEY ("productId") 
        REFERENCES products(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
      `);
      console.log('Foreign key constraint re-added successfully.');
    } catch (error) {
      if (error.message.includes('violates foreign key constraint')) {
        console.log('⚠️  Warning: Some reviews have invalid productIds. Foreign key constraint not added.');
        console.log('   Please review and fix invalid productIds before adding the constraint manually.');
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
  fixReviewsProductIdType()
    .then(() => {
      console.log('Fix script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fix script failed:', error);
      process.exit(1);
    });
}

module.exports = fixReviewsProductIdType;
