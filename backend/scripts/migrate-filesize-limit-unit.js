const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function migrateFileSizeLimitUnit() {
  try {
    console.log('Starting migration: Convert fileSizeLimitUnit to enum type...');
    
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Check if column exists
    const columnInfo = await sequelize.query(`
      SELECT 
        column_name,
        data_type,
        udt_name,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'memberships' 
      AND column_name = 'fileSizeLimitUnit';
    `, { type: QueryTypes.SELECT });

    if (columnInfo.length === 0) {
      console.log('Column fileSizeLimitUnit does not exist. Creating it...');
      
      // Create enum type if it doesn't exist
      await sequelize.query(`
        DO $$ BEGIN
            CREATE TYPE "public"."enum_memberships_fileSizeLimitUnit" AS ENUM ('MB', 'GB', 'TB');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
      `);
      
      // Add column with enum type
      await sequelize.query(`
        ALTER TABLE "public"."memberships" 
        ADD COLUMN "fileSizeLimitUnit" "public"."enum_memberships_fileSizeLimitUnit" NULL DEFAULT 'MB'::"public"."enum_memberships_fileSizeLimitUnit";
      `);
      
      console.log('Column fileSizeLimitUnit created successfully with enum type.');
      return;
    }

    const column = columnInfo[0];
    console.log(`Current column type: ${column.data_type}, UDT: ${column.udt_name}`);

    // Check if it's already an enum type
    if (column.udt_name === 'enum_memberships_fileSizeLimitUnit') {
      console.log('Column is already an enum type. No migration needed.');
      return;
    }

    console.log('Converting column to enum type...');

    // Step 1: Create enum type if it doesn't exist
    await sequelize.query(`
      DO $$ BEGIN
          CREATE TYPE "public"."enum_memberships_fileSizeLimitUnit" AS ENUM ('MB', 'GB', 'TB');
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('Step 1: Enum type created/verified.');

    // Step 2: Drop the default value
    await sequelize.query(`
      ALTER TABLE "public"."memberships" 
      ALTER COLUMN "fileSizeLimitUnit" DROP DEFAULT;
    `);
    console.log('Step 2: Default value dropped.');

    // Step 3: Convert existing values to valid enum values (if any)
    // Update any invalid values to 'MB' as default
    await sequelize.query(`
      UPDATE "public"."memberships" 
      SET "fileSizeLimitUnit" = 'MB' 
      WHERE "fileSizeLimitUnit" IS NOT NULL 
      AND "fileSizeLimitUnit" NOT IN ('MB', 'GB', 'TB');
    `);
    console.log('Step 3: Invalid values updated to MB.');

    // Step 4: Change column type to enum
    await sequelize.query(`
      ALTER TABLE "public"."memberships" 
      ALTER COLUMN "fileSizeLimitUnit" 
      TYPE "public"."enum_memberships_fileSizeLimitUnit" 
      USING "fileSizeLimitUnit"::"public"."enum_memberships_fileSizeLimitUnit";
    `);
    console.log('Step 4: Column type changed to enum.');

    // Step 5: Set default value with proper enum casting
    await sequelize.query(`
      ALTER TABLE "public"."memberships" 
      ALTER COLUMN "fileSizeLimitUnit" 
      SET DEFAULT 'MB'::"public"."enum_memberships_fileSizeLimitUnit";
    `);
    console.log('Step 5: Default value set to MB with enum type.');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateFileSizeLimitUnit()
    .then(() => {
      console.log('Migration script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateFileSizeLimitUnit };

