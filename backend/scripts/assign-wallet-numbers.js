const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const User = require('../models/User');

async function assignWalletNumbers() {
  try {
    console.log('🚀 Starting wallet number assignment...');
    
    // Authenticate database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Get all users ordered by ID
    const users = await User.findAll({
      order: [['id', 'ASC']],
      attributes: ['id', 'username', 'email', 'wallet']
    });

    console.log(`📊 Found ${users.length} users to process.`);

    if (users.length === 0) {
      console.log('⚠️  No users found in the database.');
      process.exit(0);
    }

    // Starting wallet number
    let walletNumber = 500001;
    let updatedCount = 0;
    let skippedCount = 0;

    // Update each user with sequential wallet number
    for (const user of users) {
      try {
        await user.update({ wallet: walletNumber.toString() });
        console.log(`✅ User ID ${user.id} (${user.username || user.email}) → Wallet: ${walletNumber}`);
        updatedCount++;
        walletNumber++;
      } catch (error) {
        console.error(`❌ Error updating user ID ${user.id}:`, error.message);
        skippedCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Successfully updated: ${updatedCount} users`);
    console.log(`   ⚠️  Skipped/Failed: ${skippedCount} users`);
    console.log(`   📈 Wallet numbers assigned: ${walletNumber - 500001} numbers`);
    console.log(`   🔢 Range: 500001 to ${walletNumber - 1}`);
    
    console.log('\n✨ Wallet number assignment completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
assignWalletNumbers();

