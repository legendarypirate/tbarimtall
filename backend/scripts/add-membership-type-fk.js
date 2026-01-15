/**
 * Migration script to add foreign key constraint for membership_type in users table
 * This fixes the Sequelize sync error by properly creating the FK constraint
 */

const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function addMembershipTypeFK() {
  try {
    console.log('🔄 Starting migration: Add foreign key constraint for membership_type...\n');

    await sequelize.authenticate();
    console.log('✅ Database connection established.\n');

    // Step 1: Drop existing constraint if it exists
    console.log('📝 Step 1: Dropping existing constraint if it exists...');
    try {
      await sequelize.query(`
        ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_membership_type_fkey";
      `);
      console.log('✅ Constraint check completed (will skip if doesn\'t exist)\n');
    } catch (error) {
      console.log('ℹ️  Constraint doesn\'t exist, continuing...\n');
    }

    // Step 2: Ensure column type is INTEGER
    console.log('📝 Step 2: Ensuring column type is INTEGER...');
    await sequelize.query(`
      ALTER TABLE "users" ALTER COLUMN "membership_type" TYPE INTEGER USING membership_type::INTEGER;
    `);
    console.log('✅ Column type set to INTEGER\n');

    // Step 3: Set default to NULL
    console.log('📝 Step 3: Setting default value to NULL...');
    await sequelize.query(`
      ALTER TABLE "users" ALTER COLUMN "membership_type" SET DEFAULT NULL;
    `);
    console.log('✅ Default value set to NULL\n');

    // Step 4: Add the foreign key constraint
    console.log('📝 Step 4: Adding foreign key constraint...');
    
    // Check if constraint already exists
    const [constraintCheck] = await sequelize.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'users' 
      AND constraint_name = 'users_membership_type_fkey';
    `, { type: QueryTypes.SELECT });

    if (constraintCheck && constraintCheck.length > 0) {
      console.log('ℹ️  Foreign key constraint already exists, skipping...\n');
    } else {
      await sequelize.query(`
        ALTER TABLE "users" 
        ADD CONSTRAINT "users_membership_type_fkey" 
        FOREIGN KEY ("membership_type") 
        REFERENCES "memberships" ("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
      `);
      console.log('✅ Foreign key constraint added\n');
    }

    // Step 5: Add comment
    console.log('📝 Step 5: Adding column comment...');
    await sequelize.query(`
      COMMENT ON COLUMN "users"."membership_type" IS 'Reference to membership id (bronze, free)';
    `);
    console.log('✅ Column comment added\n');

    console.log('✅ Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log('  - Column type set to INTEGER');
    console.log('  - Default value set to NULL');
    console.log('  - Foreign key constraint added (users.membership_type -> memberships.id)');
    console.log('  - Column comment added');
    console.log('\n🎉 Your server should now start without Sequelize sync errors!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run migration
if (require.main === module) {
  addMembershipTypeFK()
    .then(() => {
      console.log('\n✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = addMembershipTypeFK;

