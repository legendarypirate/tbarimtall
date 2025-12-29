const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function fixDownloadTokensOrderIdType() {
  try {
    console.log('Starting fix: Convert download_tokens.orderId from UUID to INTEGER...');
    
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Check if table exists
    const [tableCheck] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'download_tokens'
      );
    `);

    if (!tableCheck[0].exists) {
      console.log('download_tokens table does not exist. No fix needed.');
      return;
    }

    // Check current column type
    const [results] = await sequelize.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'download_tokens' 
      AND column_name = 'orderId';
    `);

    if (results.length === 0) {
      console.log('Column orderId not found in download_tokens table.');
      return;
    }

    const currentType = results[0].data_type;
    console.log(`Current orderId type: ${currentType}`);

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
        ALTER TABLE download_tokens 
        DROP CONSTRAINT IF EXISTS "download_tokens_orderId_fkey";
      `);
      await sequelize.query(`
        ALTER TABLE download_tokens 
        DROP CONSTRAINT IF EXISTS "download_tokens_orderId_fkey1";
      `);
      console.log('Foreign key constraints dropped (if they existed).');
    } catch (error) {
      console.log('No foreign key constraint to drop or already dropped.');
    }

    // Step 2: Check if there are any download tokens
    const [tokenCount] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM download_tokens 
      WHERE "orderId" IS NOT NULL;
    `, { type: QueryTypes.SELECT });

    const count = tokenCount?.count || 0;
    console.log(`Found ${count} download tokens with orderId.`);

    if (count > 0) {
      // Step 3: Get all orders with their id (which is INTEGER)
      console.log('Step 3: Mapping UUID orderIds to INTEGER orderIds...');
      
      // Get all unique UUID orderIds from download_tokens
      const tokens = await sequelize.query(`
        SELECT id, "orderId"
        FROM download_tokens
        WHERE "orderId" IS NOT NULL;
      `, { type: QueryTypes.SELECT });

      // Check if orders table has UUID or INTEGER id
      const [orderIdCheck] = await sequelize.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'id';
      `);
      
      const orderIdType = orderIdCheck.length > 0 ? orderIdCheck[0].data_type : 'integer';
      console.log(`   Orders.id column type in database: ${orderIdType}`);

      if (orderIdType === 'uuid') {
        console.log('   Orders table uses UUID id. This migration assumes INTEGER.');
        console.log('   Please verify your Order model definition.');
        return;
      }

      // Add temporary INTEGER column
      console.log('Step 4: Adding temporary INTEGER column...');
      try {
        await sequelize.query(`
          ALTER TABLE download_tokens 
          DROP COLUMN IF EXISTS "orderId_new";
        `);
        await sequelize.query(`
          ALTER TABLE download_tokens 
          ADD COLUMN "orderId_new" INTEGER;
        `);
        console.log('Temporary column added.');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('Temporary column already exists, dropping it first...');
          await sequelize.query(`
            ALTER TABLE download_tokens 
            DROP COLUMN IF EXISTS "orderId_new";
          `);
          await sequelize.query(`
            ALTER TABLE download_tokens 
            ADD COLUMN "orderId_new" INTEGER;
          `);
        } else {
          throw error;
        }
      }

      let mappedCount = 0;
      let unmappedCount = 0;

      // For UUID orderIds, we need to find the corresponding INTEGER order id
      // But wait - if orders.id is INTEGER, then the UUID in download_tokens.orderId is wrong
      // We need to check if there's a way to map them, or if we should just delete invalid tokens
      
      // Actually, if orders.id is INTEGER, then the UUID values in download_tokens.orderId are invalid
      // We should delete these invalid tokens or set them to NULL
      console.log('   Note: UUID orderIds cannot be mapped to INTEGER order ids.');
      console.log('   Invalid tokens will be removed.');

      // Delete all tokens with UUID orderIds (they're invalid)
      await sequelize.query(`
        DELETE FROM download_tokens 
        WHERE "orderId" IS NOT NULL;
      `);
      
      console.log(`   Deleted ${count} invalid tokens with UUID orderIds.`);

      // Step 5: Drop old UUID column and rename new column
      console.log('Step 5: Replacing old column with new INTEGER column...');
      await sequelize.query(`
        ALTER TABLE download_tokens 
        DROP COLUMN "orderId";
      `);
      
      await sequelize.query(`
        ALTER TABLE download_tokens 
        RENAME COLUMN "orderId_new" TO "orderId";
      `);
      
      console.log('Column replaced successfully.');
    } else {
      // No tokens, just change the column type
      console.log('No download tokens with orderId found. Changing column type directly...');
      await sequelize.query(`
        ALTER TABLE download_tokens 
        DROP COLUMN "orderId";
      `);
      
      await sequelize.query(`
        ALTER TABLE download_tokens 
        ADD COLUMN "orderId" INTEGER;
      `);
      
      console.log('Column type changed to INTEGER.');
    }

    // Step 6: Make orderId NOT NULL (as per model definition)
    console.log('Step 6: Setting orderId to NOT NULL...');
    try {
      await sequelize.query(`
        ALTER TABLE download_tokens 
        ALTER COLUMN "orderId" SET NOT NULL;
      `);
      console.log('orderId set to NOT NULL.');
    } catch (error) {
      if (error.message.includes('contains null values')) {
        console.log('⚠️  Warning: Cannot set NOT NULL because there are NULL values.');
        console.log('   Please fix NULL orderIds before setting NOT NULL constraint.');
      } else {
        throw error;
      }
    }

    // Step 7: Re-add foreign key constraint
    console.log('Step 7: Re-adding foreign key constraint...');
    try {
      await sequelize.query(`
        ALTER TABLE download_tokens 
        ADD CONSTRAINT "download_tokens_orderId_fkey" 
        FOREIGN KEY ("orderId") 
        REFERENCES orders(id) 
        ON DELETE NO ACTION 
        ON UPDATE CASCADE;
      `);
      console.log('Foreign key constraint re-added successfully.');
    } catch (error) {
      if (error.message.includes('violates foreign key constraint')) {
        console.log('⚠️  Warning: Some tokens have invalid orderIds. Foreign key constraint not added.');
        console.log('   Please review and fix invalid orderIds before adding the constraint manually.');
      } else {
        throw error;
      }
    }

    // Verify the change
    const [verifyResults] = await sequelize.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'download_tokens' 
      AND column_name = 'orderId';
    `);

    const newType = verifyResults[0].data_type;
    console.log(`Verification: orderId type is now ${newType}`);
    
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
  fixDownloadTokensOrderIdType()
    .then(() => {
      console.log('Fix script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fix script failed:', error);
      process.exit(1);
    });
}

module.exports = fixDownloadTokensOrderIdType;

