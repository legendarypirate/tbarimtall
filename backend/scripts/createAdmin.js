const { sequelize, User } = require('../models');

async function createAdmin() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Sync database to ensure tables exist
    await sequelize.sync({ alter: true });
    console.log('Database synchronized.');

    // Admin credentials
    const adminData = {
      username: 'admin',
      email: 'admin@tbarimt.com',
      password: 'Admin123!',
      fullName: 'Super Admin',
      role: 'admin',
      isActive: true,
      isSuperAdmin: true
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: {
        email: adminData.email
      }
    });

    if (existingAdmin) {
      console.log('\n⚠️  Admin user already exists!');
      console.log('\n📋 Existing Admin Credentials:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Email:    ${existingAdmin.email}`);
      console.log(`   Password: (already set - use existing password)`);
      console.log(`   Role:     ${existingAdmin.role}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      // Update password and super admin status if needed
      existingAdmin.password = adminData.password;
      existingAdmin.isSuperAdmin = true;
      await existingAdmin.save();
      console.log('✅ Password updated to: Admin123!');
      console.log('✅ Super Admin status set to true');
    } else {
      // Create new admin user
      const admin = await User.create(adminData);
      console.log('\n✅ Admin user created successfully!');
      console.log('\n📋 Admin Credentials:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`   Username: ${admin.username}`);
      console.log(`   Email:    ${admin.email}`);
      console.log(`   Password: ${adminData.password}`);
      console.log(`   Role:     ${admin.role}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();

