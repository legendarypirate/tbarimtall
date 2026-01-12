const sequelize = require('../config/database');
const fs = require('fs');
const path = require('path');

async function removeUniqueConstraint() {
  try {
    console.log('Removing unique constraint from journalist_reviews table...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'remove-unique-constraint-journalist-reviews.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    await sequelize.query(sql);
    
    console.log('✓ Successfully removed unique constraint "unique_journalist_user_review"');
    console.log('✓ Users can now submit multiple reviews for the same journalist');
    
    process.exit(0);
  } catch (error) {
    console.error('Error removing unique constraint:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  removeUniqueConstraint();
}

module.exports = { removeUniqueConstraint };
