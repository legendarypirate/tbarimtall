const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function fixMembershipTypeFK() {
  try {
    console.log('Starting migration: Fix membership_type foreign key constraint...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Check if constraint already exists and is correct
    const constraintCheck = await sequelize.query(`
      SELECT 
        conname as constraint_name,
        contype as constraint_type
      FROM pg_constraint 
      WHERE conname = 'users_membership_type_fkey'
      AND conrelid = 'users'::regclass;
    `, { type: QueryTypes.SELECT });

    if (constraintCheck && constraintCheck.length > 0) {
      console.log('✅ Foreign key constraint already exists. Verifying it is correct...');
      
      // Verify the constraint is correct by checking its details
      const constraintDetails = await sequelize.query(`
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.delete_rule,
          rc.update_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints AS rc
          ON rc.constraint_name = tc.constraint_name
        WHERE tc.constraint_name = 'users_membership_type_fkey'
        AND tc.table_name = 'users';
      `, { type: QueryTypes.SELECT });

      if (constraintDetails && constraintDetails.length > 0) {
        const details = constraintDetails[0];
        if (details.foreign_table_name === 'memberships' && 
            details.foreign_column_name === 'id' &&
            details.delete_rule === 'SET NULL' &&
            details.update_rule === 'CASCADE') {
          console.log('✅ Constraint is correctly configured. No migration needed.');
          return;
        }
      }
    }

    // Step 1: Drop existing constraint if it exists
    console.log('Step 1: Dropping existing constraint if it exists...');
    await sequelize.query(`
      ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_membership_type_fkey";
    `);
    console.log('✅ Step 1: Cleaned up any existing constraint.');

    // Step 2: Ensure column type is INTEGER (convert if needed)
    console.log('Step 2: Ensuring column type is INTEGER...');
    try {
      await sequelize.query(`
        ALTER TABLE "users" 
        ALTER COLUMN "membership_type" TYPE INTEGER 
        USING membership_type::INTEGER;
      `);
      console.log('✅ Step 2: Column type set to INTEGER.');
    } catch (error) {
      // If column is already INTEGER or conversion fails, check current type
      const [columnInfo] = await sequelize.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'membership_type';
      `, { type: QueryTypes.SELECT });
      
      if (columnInfo && columnInfo.data_type === 'integer') {
        console.log('✅ Step 2: Column is already INTEGER.');
      } else {
        console.log('⚠️  Step 2: Could not convert column type. Current type:', columnInfo?.data_type);
        throw error;
      }
    }

    // Step 3: Clean up invalid membership_type values (set to NULL if they don't exist in memberships)
    console.log('Step 3: Cleaning up invalid membership_type values...');
    await sequelize.query(`
      UPDATE "users" 
      SET "membership_type" = NULL 
      WHERE "membership_type" IS NOT NULL 
      AND "membership_type" NOT IN (SELECT id FROM "memberships");
    `);
    console.log(`✅ Step 3: Cleaned up invalid membership_type values.`);

    // Step 4: Set default to NULL
    console.log('Step 4: Setting default to NULL...');
    await sequelize.query(`
      ALTER TABLE "users" 
      ALTER COLUMN "membership_type" SET DEFAULT NULL;
    `);
    console.log('✅ Step 4: Default set to NULL.');

    // Step 5: Add the foreign key constraint
    console.log('Step 5: Adding foreign key constraint...');
    try {
      await sequelize.query(`
        ALTER TABLE "users" 
        ADD CONSTRAINT "users_membership_type_fkey" 
        FOREIGN KEY ("membership_type") 
        REFERENCES "memberships" ("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
      `);
      console.log('✅ Step 5: Foreign key constraint added successfully.');
    } catch (error) {
      if (error.message && (error.message.includes('already exists') || error.message.includes('duplicate'))) {
        console.log('✅ Step 5: Constraint already exists. Skipping...');
      } else {
        throw error;
      }
    }

    // Step 6: Add comment
    console.log('Step 6: Adding column comment...');
    await sequelize.query(`
      COMMENT ON COLUMN "users"."membership_type" IS 'Reference to membership id (bronze, free)';
    `);
    console.log('✅ Step 6: Comment added.');

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  fixMembershipTypeFK()
    .then(() => {
      console.log('Migration script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixMembershipTypeFK };

