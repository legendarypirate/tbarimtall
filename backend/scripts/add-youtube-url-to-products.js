const sequelize = require('../config/database');

async function addYoutubeUrlColumn() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    const [results] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'products' AND column_name = 'youtubeUrl';
    `);

    if (results.length > 0) {
      console.log('Column products.youtubeUrl already exists. Skipping.');
      return;
    }

    await sequelize.query(`
      ALTER TABLE products ADD COLUMN "youtubeUrl" VARCHAR(500) NULL;
    `);
    console.log('✅ Column products.youtubeUrl added successfully.');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

addYoutubeUrlColumn();
