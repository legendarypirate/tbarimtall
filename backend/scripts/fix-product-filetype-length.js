const sequelize = require('../config/database');

async function fixProductFileTypeLength() {
  try {
    console.log('Starting fix: Increase products.fileType column length from 50 to 255...');
    
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Check current column type
    const [results] = await sequelize.query(`
      SELECT data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'fileType';
    `);

    if (results.length === 0) {
      console.log('Column fileType not found in products table.');
      return;
    }

    const currentLength = results[0].character_maximum_length;
    console.log(`Current fileType length: ${currentLength}`);

    if (currentLength >= 255) {
      console.log('Column length is already 255 or greater. No fix needed.');
      return;
    }

    // Alter the column to increase its length
    console.log('Altering fileType column to VARCHAR(255)...');
    await sequelize.query(`
      ALTER TABLE products 
      ALTER COLUMN "fileType" TYPE VARCHAR(255);
    `);
    
    console.log('✅ Column length updated successfully!');

    // Verify the change
    const [verifyResults] = await sequelize.query(`
      SELECT character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'fileType';
    `);

    const newLength = verifyResults[0].character_maximum_length;
    console.log(`Verification: fileType length is now ${newLength}`);
    
    if (newLength >= 255) {
      console.log('✅ Fix completed successfully!');
    } else {
      console.log('⚠️  Warning: Column length verification failed.');
    }

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.error('Full error:', error);
    throw error;
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

// Run fix
if (require.main === module) {
  fixProductFileTypeLength()
    .then(() => {
      console.log('Fix script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fix script failed:', error);
      process.exit(1);
    });
}

module.exports = fixProductFileTypeLength;

