const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function addIntegerIdToProducts() {
  try {
    console.log('Starting migration: Add integer id column to products table...');
    
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Check if integer id column already exists
    const [columnCheck] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'id';
    `);

    if (columnCheck.length > 0) {
      const existingType = columnCheck[0].data_type;
      if (existingType === 'integer') {
        // Check if uuid column exists
        const [uuidCheck] = await sequelize.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'products' 
          AND column_name = 'uuid';
        `);
        
        if (uuidCheck.length > 0) {
          console.log('Integer id and uuid columns already exist. Skipping migration.');
          return;
        } else {
          console.log('Integer id exists but uuid is missing. Adding uuid column...');
          await sequelize.query(`
            ALTER TABLE products 
            ADD COLUMN uuid UUID NOT NULL DEFAULT gen_random_uuid();
          `);
          await sequelize.query(`
            ALTER TABLE products 
            ADD CONSTRAINT products_uuid_unique UNIQUE (uuid);
          `);
          console.log('✅ UUID column added successfully!');
          return;
        }
      } else if (existingType === 'uuid') {
        console.log('UUID id column exists. Migrating to integer id + uuid structure...');
        
        // Step 1: Drop primary key constraint if it exists
        console.log('Step 1: Dropping primary key constraint...');
        try {
          // Get the constraint name
          const [pkConstraint] = await sequelize.query(`
            SELECT constraint_name
            FROM information_schema.table_constraints
            WHERE table_name = 'products'
            AND constraint_type = 'PRIMARY KEY';
          `);
          
          if (pkConstraint.length > 0) {
            const constraintName = pkConstraint[0].constraint_name;
            await sequelize.query(`
              ALTER TABLE products 
              DROP CONSTRAINT ${constraintName};
            `);
            console.log(`Primary key constraint ${constraintName} dropped.`);
          }
        } catch (error) {
          console.log('No primary key constraint to drop or already dropped.');
        }

        // Step 2: Rename UUID id to uuid
        console.log('Step 2: Renaming UUID id column to uuid...');
        try {
          await sequelize.query(`
            ALTER TABLE products 
            RENAME COLUMN id TO uuid;
          `);
          console.log('UUID column renamed to uuid.');
        } catch (error) {
          if (error.message.includes('does not exist') || error.message.includes('already exists')) {
            console.log('UUID column already renamed or does not exist.');
          } else {
            throw error;
          }
        }

        // Step 3: Add integer id column as primary key
        console.log('Step 3: Adding integer id column as primary key...');
        try {
          await sequelize.query(`
            ALTER TABLE products 
            ADD COLUMN id SERIAL PRIMARY KEY;
          `);
          console.log('Integer id column added as primary key.');
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log('Integer id column already exists.');
          } else {
            throw error;
          }
        }

        // Step 4: Ensure uuid column has unique constraint
        console.log('Step 4: Ensuring uuid column has unique constraint...');
        try {
          await sequelize.query(`
            ALTER TABLE products 
            ADD CONSTRAINT products_uuid_unique UNIQUE (uuid);
          `);
          console.log('Unique constraint on uuid column added.');
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log('Unique constraint on uuid already exists.');
          } else {
            throw error;
          }
        }

        console.log('✅ Migration completed successfully!');
        return;
      }
    }

    // If no id column exists, add both
    console.log('No id column found. Adding integer id and uuid columns...');
    
    // Add integer id as primary key
    await sequelize.query(`
      ALTER TABLE products 
      ADD COLUMN id SERIAL PRIMARY KEY;
    `);
    console.log('Integer id column added.');

    // Add uuid column if it doesn't exist
    const [uuidCheck] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'uuid';
    `);

    if (uuidCheck.length === 0) {
      await sequelize.query(`
        ALTER TABLE products 
        ADD COLUMN uuid UUID NOT NULL DEFAULT gen_random_uuid();
      `);
      await sequelize.query(`
        ALTER TABLE products 
        ADD CONSTRAINT products_uuid_unique UNIQUE (uuid);
      `);
      console.log('UUID column added.');
    } else {
      console.log('UUID column already exists.');
    }

    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    throw error;
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

// Run migration
if (require.main === module) {
  addIntegerIdToProducts()
    .then(() => {
      console.log('Migration script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = addIntegerIdToProducts;

