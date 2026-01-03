const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function addPhoneToUsers() {
  try {
    console.log('Starting migration: Add phone column to users table...');
    
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Check if phone column exists
    const [phoneCheck] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'phone';
    `, { type: QueryTypes.SELECT });

    if (phoneCheck.length === 0) {
      console.log('Phone column does not exist. Adding phone column...');
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN phone VARCHAR(50) NULL;
      `);
      console.log('✅ Phone column added successfully.');
    } else {
      console.log('✅ Phone column already exists.');
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addPhoneToUsers();

