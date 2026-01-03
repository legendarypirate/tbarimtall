const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function addUserColumns() {
  try {
    console.log('Starting migration: Adding wallet, income, and publishedFileCount columns to users table...');

    // Check if columns already exist
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('wallet', 'income', 'publishedFileCount')
    `);

    const existingColumns = results.map(r => r.column_name);
    
    // Add wallet column if it doesn't exist
    if (!existingColumns.includes('wallet')) {
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN wallet VARCHAR(255) NULL 
        COMMENT 'Wallet account number (e.g., QPay wallet number, bank account)'
      `);
      console.log('✅ Added wallet column');
    } else {
      console.log('⏭️  wallet column already exists');
    }

    // Add income column if it doesn't exist
    if (!existingColumns.includes('income')) {
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN income DECIMAL(10, 2) DEFAULT 0 
        COMMENT 'Total wallet balance - sum of all completed orders for user\'s products'
      `);
      console.log('✅ Added income column');
    } else {
      console.log('⏭️  income column already exists');
    }

    // Add publishedFileCount column if it doesn't exist
    if (!existingColumns.includes('publishedFileCount')) {
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN publishedFileCount INT DEFAULT 0 
        COMMENT 'Count of published products (status=published and isActive=true)'
      `);
      console.log('✅ Added publishedFileCount column');
    } else {
      console.log('⏭️  publishedFileCount column already exists');
    }

    // Calculate and update income for all users
    console.log('\nCalculating income for all users...');
    await sequelize.query(`
      UPDATE users u
      SET income = COALESCE((
        SELECT SUM(o.amount)
        FROM orders o
        INNER JOIN products p ON o.productId = p.id
        WHERE p.authorId = u.id
        AND o.status = 'completed'
      ), 0)
    `, { type: QueryTypes.UPDATE });
    console.log('✅ Updated income for all users');

    // Calculate and update publishedFileCount for all users
    console.log('\nCalculating published file count for all users...');
    await sequelize.query(`
      UPDATE users u
      SET publishedFileCount = COALESCE((
        SELECT COUNT(*)
        FROM products p
        WHERE p.authorId = u.id
        AND p.status = 'published'
        AND p.isActive = true
      ), 0)
    `, { type: QueryTypes.UPDATE });
    console.log('✅ Updated publishedFileCount for all users');

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
addUserColumns();

