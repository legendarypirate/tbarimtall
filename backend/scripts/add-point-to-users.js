const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function addPointToUsers() {
  try {
    console.log('Starting migration: Adding point column to users table...');

    // Check if column already exists
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'point'
    `);

    if (results.length === 0) {
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN point DECIMAL(10, 2) DEFAULT 0 
        COMMENT 'Points earned from product sales commissions (membership-based)'
      `);
      console.log('✅ Added point column');
    } else {
      console.log('⏭️  point column already exists');
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
addPointToUsers();

