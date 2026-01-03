const sequelize = require('../config/database');
const { Product, Order } = require('../models');

async function addIncomeColumn() {
  try {
    console.log('Adding income column to products table...');
    
    // Check if column exists
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='products' AND column_name='income'
    `);
    
    if (results.length === 0) {
      // Add income column
      await sequelize.query(`
        ALTER TABLE products 
        ADD COLUMN income DECIMAL(10, 2) DEFAULT 0 COMMENT 'Total income from product sales'
      `);
      console.log('✅ Income column added successfully');
    } else {
      console.log('ℹ️  Income column already exists');
    }
    
    // Backfill income from existing completed orders
    console.log('Backfilling income from existing completed orders...');
    const products = await Product.findAll();
    
    for (const product of products) {
      const completedOrders = await Order.findAll({
        where: {
          productId: product.id,
          status: 'completed'
        }
      });
      
      const totalIncome = completedOrders.reduce((sum, order) => {
        return sum + parseFloat(order.amount || 0);
      }, 0);
      
      if (totalIncome > 0) {
        await product.update({ income: totalIncome });
        console.log(`  Product ${product.id} (${product.title}): ${totalIncome}₮`);
      }
    }
    
    console.log('✅ Income backfill completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addIncomeColumn();

