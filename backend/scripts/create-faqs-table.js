const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function createFAQsTable() {
  try {
    console.log('Creating FAQs table...');
    
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Check if table already exists
    const [tableCheck] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'faqs'
      );
    `);

    if (tableCheck[0].exists) {
      console.log('✅ FAQs table already exists. Skipping creation.');
      return;
    }

    // Create FAQs table
    await sequelize.query(`
      CREATE TABLE faqs (
        id SERIAL PRIMARY KEY,
        question JSON NOT NULL,
        answer JSON NOT NULL,
        "order" INTEGER NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await sequelize.query(`
      CREATE INDEX idx_faqs_order ON faqs("order");
    `);

    await sequelize.query(`
      CREATE INDEX idx_faqs_isactive ON faqs("isActive");
    `);

    console.log('✅ FAQs table created successfully!');
    console.log('✅ Indexes created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating FAQs table:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the migration
if (require.main === module) {
  createFAQsTable()
    .then(() => {
      console.log('Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = createFAQsTable;

