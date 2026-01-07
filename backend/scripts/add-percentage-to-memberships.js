/**
 * Migration script to add percentage column to memberships table
 * Sets default percentage values based on membership type
 */

const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function addPercentageToMemberships() {
  try {
    console.log('🔄 Starting migration: Add percentage column to memberships table...\n');

    await sequelize.authenticate();
    console.log('✅ Database connection established.\n');

    // Check if percentage column already exists
    const [columnCheck] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'memberships' 
      AND column_name = 'percentage';
    `, { type: QueryTypes.SELECT });

    if (columnCheck && columnCheck.length > 0) {
      console.log('✅ Percentage column already exists. Checking values...\n');
    } else {
      // Add percentage column
      console.log('📝 Step 1: Adding percentage column...');
      await sequelize.query(`
        ALTER TABLE memberships 
        ADD COLUMN percentage DECIMAL(5, 2) NOT NULL DEFAULT 20.00;
      `);
      console.log('✅ Percentage column added with default value 20.00\n');
    }

    // Update existing memberships with appropriate percentages
    console.log('📝 Step 2: Updating existing memberships with percentage values...');
    
    // Get all memberships
    const [memberships] = await sequelize.query(`
      SELECT id, name, price 
      FROM memberships 
      ORDER BY id;
    `, { type: QueryTypes.SELECT });

    console.log(`Found ${memberships.length} memberships to update\n`);

    // Update percentages based on membership type
    for (const membership of memberships) {
      let percentage = 20.00; // Default
      
      // Set percentage based on membership name or price
      const name = membership.name.toLowerCase();
      const price = parseFloat(membership.price || 0);
      
      if (name.includes('free') || price === 0) {
        percentage = 20.00;
      } else if (name.includes('silver') || (price > 0 && price < 20000)) {
        percentage = 25.00;
      } else if (name.includes('gold') || (price >= 20000 && price < 80000)) {
        percentage = 35.00;
      } else if (name.includes('platinum') || price >= 80000) {
        percentage = 45.00;
      }

      await sequelize.query(`
        UPDATE memberships 
        SET percentage = :percentage 
        WHERE id = :id;
      `, {
        replacements: { percentage, id: membership.id },
        type: QueryTypes.UPDATE
      });

      console.log(`  ✅ Updated ${membership.name} (ID: ${membership.id}) with percentage: ${percentage}%`);
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log('  - Percentage column added to memberships table');
    console.log('  - Default value: 20.00%');
    console.log('  - Existing memberships updated with appropriate percentages');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run migration
if (require.main === module) {
  addPercentageToMemberships()
    .then(() => {
      console.log('\n✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = addPercentageToMemberships;

