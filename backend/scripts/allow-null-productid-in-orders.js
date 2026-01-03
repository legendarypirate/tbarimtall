/**
 * Migration script to allow NULL productId in orders table
 * This is needed for wallet recharge orders which don't have an associated product
 */

const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function allowNullProductId() {
  try {
    console.log('🔄 Starting migration: Allow NULL productId in orders table...\n');

    // Check current state
    const currentState = await sequelize.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name = 'productId';
    `, { type: QueryTypes.SELECT });

    if (currentState.length === 0) {
      console.log('❌ productId column not found in orders table');
      return;
    }

    const currentNullable = currentState[0].is_nullable;
    console.log(`📊 Current state: is_nullable = ${currentNullable}`);

    if (currentNullable === 'YES') {
      console.log('✅ productId already allows NULL. No migration needed.');
      return;
    }

    // Check for existing NULL values
    const nullCount = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM orders
      WHERE "productId" IS NULL;
    `, { type: QueryTypes.SELECT });

    console.log(`📊 Orders with NULL productId: ${nullCount[0].count}`);

    // Drop foreign key constraint temporarily
    console.log('\n🔧 Step 1: Dropping foreign key constraints...');
    try {
      await sequelize.query(`
        ALTER TABLE orders 
        DROP CONSTRAINT IF EXISTS "orders_productId_fkey";
      `);
      await sequelize.query(`
        ALTER TABLE orders 
        DROP CONSTRAINT IF EXISTS "orders_productId_fkey1";
      `);
      console.log('✅ Foreign key constraints dropped');
    } catch (error) {
      console.log('⚠️  Warning: Could not drop foreign key constraints:', error.message);
    }

    // Allow NULL
    console.log('\n🔧 Step 2: Allowing NULL in productId column...');
    await sequelize.query(`
      ALTER TABLE orders 
      ALTER COLUMN "productId" DROP NOT NULL;
    `);
    console.log('✅ productId column now allows NULL');

    // Re-add foreign key constraint (allowing NULL)
    console.log('\n🔧 Step 3: Re-adding foreign key constraint (allowing NULL)...');
    try {
      await sequelize.query(`
        ALTER TABLE orders 
        ADD CONSTRAINT "orders_productId_fkey" 
        FOREIGN KEY ("productId") 
        REFERENCES products(id) 
        ON DELETE NO ACTION 
        ON UPDATE CASCADE;
      `);
      console.log('✅ Foreign key constraint re-added');
    } catch (error) {
      console.log('⚠️  Warning: Could not re-add foreign key constraint:', error.message);
      console.log('   This is okay if the constraint already exists or if you prefer to manage it manually');
    }

    // Verify the change
    console.log('\n🔍 Step 4: Verifying changes...');
    const newState = await sequelize.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name = 'productId';
    `, { type: QueryTypes.SELECT });

    console.log(`✅ New state: is_nullable = ${newState[0].is_nullable}`);
    
    if (newState[0].is_nullable === 'YES') {
      console.log('\n✨ Migration completed successfully!');
      console.log('   productId can now be NULL for wallet recharge orders');
    } else {
      console.log('\n❌ Migration may have failed. Please check manually.');
    }

  } catch (error) {
    console.error('\n❌ Migration error:', error);
    throw error;
  }
}

// Run migration
if (require.main === module) {
  allowNullProductId()
    .then(() => {
      console.log('\n✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = allowNullProductId;

