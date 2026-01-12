const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const { User, Journalist, Product, JournalistReview, Follow } = require('../models');

async function verifyJournalists() {
  try {
    console.log('🔍 Verifying journalists data in database...\n');
    
    await sequelize.authenticate();
    console.log('✅ Database connection established.\n');

    // Get all journalist users
    const journalistUsers = await User.findAll({
      where: {
        role: 'journalist',
        isActive: true
      },
      attributes: ['id', 'username', 'fullName', 'avatar', 'email'],
      order: [['id', 'ASC']]
    });

    console.log(`📊 Found ${journalistUsers.length} journalist users:\n`);

    for (const user of journalistUsers) {
      console.log(`\n👤 User ID: ${user.id}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Full Name: ${user.fullName || 'N/A'}`);
      console.log(`   Avatar: ${user.avatar || 'null'}`);

      // Get journalist record
      let journalist = await Journalist.findOne({ where: { userId: user.id } });
      
      if (!journalist) {
        console.log(`   ⚠️  No journalist record found - creating one...`);
        journalist = await Journalist.create({
          userId: user.id,
          specialty: null,
          bio: null,
          rating: 0,
          followers: 0,
          posts: 0
        });
        console.log(`   ✅ Created journalist record with ID: ${journalist.id}`);
      } else {
        console.log(`   📝 Journalist ID: ${journalist.id}`);
        console.log(`   Specialty: ${journalist.specialty || 'null'}`);
      }

      // Get product count
      const productCount = await Product.count({
        where: { authorId: user.id, isActive: true }
      });
      console.log(`   📦 Products: ${productCount}`);

      // Get follower count
      const followerCount = await Follow.count({
        where: { journalistId: journalist.id }
      });
      console.log(`   👥 Followers: ${followerCount}`);

      // Get journalist reviews
      const journalistReviews = await JournalistReview.findAll({
        where: { journalistId: journalist.id }
      });
      
      // Get product reviews using raw query
      const productReviews = await sequelize.query(
        `SELECT r.rating
         FROM products p
         LEFT JOIN reviews r ON p.id = r."productId"
         WHERE p."authorId" = :userId AND p."isActive" = true AND r.id IS NOT NULL`,
        {
          replacements: { userId: user.id },
          type: QueryTypes.SELECT
        }
      );

      let productReviewCount = productReviews.length;
      let productRatingSum = productReviews.reduce((sum, r) => sum + parseInt(r.rating), 0);

      // Calculate rating from journalist reviews
      let journalistRating = 0;
      if (journalistReviews.length > 0) {
        const sum = journalistReviews.reduce((acc, review) => acc + review.rating, 0);
        journalistRating = parseFloat((sum / journalistReviews.length).toFixed(2));
        console.log(`   ⭐ Journalist Reviews: ${journalistReviews.length} (avg: ${journalistRating})`);
      }

      // Calculate rating from product reviews (fallback)
      let productRating = 0;
      if (productReviewCount > 0) {
        productRating = parseFloat((productRatingSum / productReviewCount).toFixed(2));
        console.log(`   ⭐ Product Reviews: ${productReviewCount} (avg: ${productRating})`);
      }

      const finalRating = journalistRating || productRating || 0;
      console.log(`   ⭐ Final Rating: ${finalRating}`);

      // Update journalist record if needed
      if (journalist.specialty === null && user.username) {
        // Set some default specialties based on username for testing
        const specialties = {
          'tugsuu': 'График дизайн',
          'oyunaa': 'Төсөл, Бэлэн загвар',
          'batbayar': 'Дипломын ажил',
          'enkhat': 'Программ хангамж'
        };
        
        if (specialties[user.username]) {
          await journalist.update({ specialty: specialties[user.username] });
          console.log(`   ✅ Updated specialty to: ${specialties[user.username]}`);
        }
      }
    }

    console.log('\n\n📋 Summary of API Response Data:');
    console.log('Expected from API:');
    console.log(JSON.stringify({
      journalists: [
        { id: 4, userId: 5, name: "Түгсүү", username: "tugsuu", specialty: "График дизайн", rating: 4.67, followers: 0, posts: 1 },
        { id: 5, userId: 6, name: "Оюунаа", username: "oyunaa", specialty: "Төсөл, Бэлэн загвар", rating: 4.6, followers: 0, posts: 2 },
        { id: 1, userId: 2, name: "Батбаяр", username: "batbayar", specialty: "Дипломын ажил", rating: 4.4, followers: 0, posts: 1 },
        { id: 3, userId: 4, name: "Энхбат", username: "enkhat", specialty: "Программ хангамж", rating: 4.38, followers: 0, posts: 4 }
      ]
    }, null, 2));

    console.log('\n✅ Verification complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyJournalists();

