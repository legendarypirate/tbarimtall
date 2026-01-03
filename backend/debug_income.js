const { sequelize } = require('./config/database');
const { QueryTypes } = require('sequelize');

async function debugIncome() {
  const userId = 12; // User ID from the issue
  
  try {
    // Get all completed orders for this user's products
    const orders = await sequelize.query(
      `SELECT 
         o.id as order_id,
         o.amount,
         o.status,
         o."createdAt",
         o."updatedAt",
         p.id as product_id,
         p.title as product_title,
         p."authorId"
       FROM orders o
       INNER JOIN products p ON o."productId" = p.id
       WHERE o.status = 'completed'
       AND p."authorId" = :userId
       ORDER BY o."createdAt" DESC`,
      {
        replacements: { userId },
        type: QueryTypes.SELECT
      }
    );
    
    console.log(`\n📊 Income Debug for User ID ${userId}`);
    console.log(`Total completed orders: ${orders.length}`);
    console.log(`\nOrder Details:`);
    
    let total = 0;
    orders.forEach((order, index) => {
      total += parseFloat(order.amount);
      console.log(`${index + 1}. Order #${order.order_id}: ${order.amount}₮ (Product: ${order.product_title})`);
    });
    
    console.log(`\n💰 Calculated Total: ${total}₮`);
    
    // Get user's current income from database
    const user = await sequelize.query(
      `SELECT income FROM users WHERE id = :userId`,
      {
        replacements: { userId },
        type: QueryTypes.SELECT
      }
    );
    
    console.log(`💾 Database Income: ${user[0]?.income || 0}₮`);
    console.log(`📈 Difference: ${total - parseFloat(user[0]?.income || 0)}₮\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugIncome();
