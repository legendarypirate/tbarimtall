const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function fixDownloadTokensIdType() {
  try {
    console.log('Starting fix: Convert download_tokens.id from INTEGER to UUID...');
    
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Check current column type
    const [results] = await sequelize.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'download_tokens' 
      AND column_name = 'id';
    `);

    if (results.length === 0) {
      console.log('Column id not found in download_tokens table.');
      return;
    }

    const currentType = results[0].data_type;
    console.log(`Current id type: ${currentType}`);

    if (currentType === 'uuid') {
      console.log('Column is already UUID. No fix needed.');
      return;
    }

    if (currentType !== 'integer') {
      console.log(`Unexpected column type: ${currentType}. Expected integer.`);
      return;
    }

    // Step 1: Drop primary key constraint
    console.log('Step 1: Dropping primary key constraint...');
    try {
      await sequelize.query(`
        ALTER TABLE download_tokens 
        DROP CONSTRAINT IF EXISTS "download_tokens_pkey";
      `);
      console.log('Primary key constraint dropped.');
    } catch (error) {
      console.log('No primary key constraint to drop or already dropped.');
    }

    // Step 2: Check if there are any download_tokens
    const [tokenCount] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM download_tokens;
    `, { type: QueryTypes.SELECT });

    const count = tokenCount?.count || 0;
    console.log(`Found ${count} download tokens.`);

    if (count > 0) {
      // Step 3: Add temporary UUID column
      console.log('Step 3: Adding temporary UUID column...');
      try {
        await sequelize.query(`
          ALTER TABLE download_tokens 
          DROP COLUMN IF EXISTS "id_new";
        `);
        await sequelize.query(`
          ALTER TABLE download_tokens 
          ADD COLUMN "id_new" UUID DEFAULT gen_random_uuid();
        `);
        console.log('Temporary column added.');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('Temporary column already exists, dropping it first...');
          await sequelize.query(`
            ALTER TABLE download_tokens 
            DROP COLUMN IF EXISTS "id_new";
          `);
          await sequelize.query(`
            ALTER TABLE download_tokens 
            ADD COLUMN "id_new" UUID DEFAULT gen_random_uuid();
          `);
        } else {
          throw error;
        }
      }

      // Step 4: Drop old INTEGER column and rename new column
      console.log('Step 4: Replacing old column with new UUID column...');
      await sequelize.query(`
        ALTER TABLE download_tokens 
        DROP COLUMN "id";
      `);
      
      await sequelize.query(`
        ALTER TABLE download_tokens 
        RENAME COLUMN "id_new" TO "id";
      `);
      
      console.log('Column replaced successfully.');
    } else {
      // No tokens, just change the column type
      console.log('No download tokens found. Changing column type directly...');
      await sequelize.query(`
        ALTER TABLE download_tokens 
        DROP COLUMN "id";
      `);
      
      await sequelize.query(`
        ALTER TABLE download_tokens 
        ADD COLUMN "id" UUID DEFAULT gen_random_uuid();
      `);
      
      console.log('Column type changed to UUID.');
    }

    // Step 5: Re-add primary key constraint
    console.log('Step 5: Re-adding primary key constraint...');
    try {
      await sequelize.query(`
        ALTER TABLE download_tokens 
        ADD PRIMARY KEY ("id");
      `);
      console.log('Primary key constraint re-added successfully.');
    } catch (error) {
      console.log('⚠️  Warning: Could not add primary key constraint:', error.message);
    }

    // Verify the change
    const [verifyResults] = await sequelize.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'download_tokens' 
      AND column_name = 'id';
    `);

    const newType = verifyResults[0].data_type;
    console.log(`Verification: id type is now ${newType}`);
    
    if (newType === 'uuid') {
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
  fixDownloadTokensIdType()
    .then(() => {
      console.log('Fix script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fix script failed:', error);
      process.exit(1);
    });
}

module.exports = fixDownloadTokensIdType;

