const { sequelize, User } = require('../models');

async function makeSuperAdmin() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Find the admin user
    const admin = await User.findOne({
      where: {
        email: 'admin@tbarimt.com'
      }
    });

    if (!admin) {
      console.log('❌ Admin user with email admin@tbarimt.com not found!');
      process.exit(1);
    }

    // Update to super admin
    admin.isSuperAdmin = true;
    admin.role = 'admin'; // Ensure role is admin
    await admin.save();

    console.log('\n✅ Successfully updated admin@tbarimt.com to Super Admin!');
    console.log('\n📋 Updated Admin Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Username:    ${admin.username}`);
    console.log(`   Email:       ${admin.email}`);
    console.log(`   Role:        ${admin.role}`);
    console.log(`   Super Admin: ${admin.isSuperAdmin}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating admin user:', error);
    process.exit(1);
  }
}

makeSuperAdmin();

