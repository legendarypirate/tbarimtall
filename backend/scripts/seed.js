const { sequelize, User, Category, Subcategory, Product, Journalist, Order, Review } = require('../models');

async function seed() {
  try {
    console.log('Starting database seeding...');
    
    // Sync database (don't force, just alter)
    await sequelize.sync({ alter: true });
    console.log('Database synchronized.');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('Clearing existing data...');
    await Review.destroy({ where: {} });
    await Order.destroy({ where: {} });
    await Product.destroy({ where: {} });
    await Journalist.destroy({ where: {} });
    await Subcategory.destroy({ where: {} });
    await Category.destroy({ where: {} });
    await User.destroy({ where: {} });
    console.log('Existing data cleared.');

    // Create categories
    console.log('Creating categories...');
    const categories = [
      { id: 1, name: 'ХИЧЭЭЛ, СУРЛАГА', icon: '📚', description: 'Бүх төрлийн хичээл, сурлага, судалгааны материал' },
      { id: 2, name: 'ТӨСӨЛ, БЭЛЭН ЗАГВАР', icon: '📋', description: 'Төсөл, бэлэн загвар, жишээ файлууд' },
      { id: 3, name: 'ГРАФИК, ДИЗАЙН', icon: '🎨', description: 'График дизайн, зураг, бэлэн загвар' },
      { id: 4, name: 'ПРОГРАМ ХАНГАМЖ', icon: '💻', description: 'Програм хангамж, код, аппликейшн' },
      { id: 5, name: 'ТОГЛООМ', icon: '🎮', description: 'Тоглоом, уралдаан, хөгжилтэй материал' },
      { id: 6, name: 'ДУУ ХӨГЖИМ', icon: '🎵', description: 'Дуу, хөгжим, аудио материал' },
      { id: 7, name: 'БАРИМТ БИЧИГ', icon: '📄', description: 'Гэрээ, баримт бичиг, форматууд' },
      { id: 8, name: 'ГАР УТАС', icon: '📱', description: 'Гар утасны аппликейшн, тоглоом' }
    ];

    const createdCategories = [];
    for (const cat of categories) {
      const [category] = await Category.findOrCreate({ where: { id: cat.id }, defaults: cat });
      createdCategories.push(category);
    }
    console.log(`Created ${createdCategories.length} categories.`);

    // Create subcategories
    console.log('Creating subcategories...');
    const subcategories = [
      { id: 52, name: 'ТӨСӨЛ ТАТАХ (бүх төрлийн)', categoryId: 1, description: 'Бүх төрлийн төсөл' },
      { id: 53, name: 'ДАДЛАГЫН ТАЙЛАНГУУД', categoryId: 1, description: 'Дадлагын тайлангууд' },
      { id: 46, name: 'Курсын ажил', categoryId: 1, description: 'Курсын ажлууд' },
      { id: 47, name: 'Дипломын ажил', categoryId: 1, description: 'Дипломын ажлууд' },
      { id: 64, name: 'Хэрэгжиж буй сайн төслүүд', categoryId: 2, description: 'Хэрэгжиж буй төслүүд' },
      { id: 42, name: 'Photoshop -н бэлэн загвар', categoryId: 3, description: 'Photoshop загвар' },
      { id: 40, name: 'Зөөврийн програм', categoryId: 4, description: 'Зөөврийн программууд' },
      { id: 49, name: 'Уралдаан', categoryId: 5, description: 'Уралдааны тоглоомууд' },
      { id: 56, name: 'Дуу, Хөгжим', categoryId: 6, description: 'Дуу, хөгжим' },
      { id: 44, name: 'Гэрээ', categoryId: 7, description: 'Гэрээний загвар' },
      { id: 59, name: 'Тоглоом', categoryId: 8, description: 'Гар утасны тоглоом' }
    ];

    const createdSubcategories = [];
    for (const subcat of subcategories) {
      const [subcategory] = await Subcategory.findOrCreate({ where: { id: subcat.id }, defaults: subcat });
      createdSubcategories.push(subcategory);
    }
    console.log(`Created ${createdSubcategories.length} subcategories.`);

    // Create users (viewers, journalists, admin)
    console.log('Creating users...');
    const users = [
      // Admin
      {
        username: 'admin',
        email: 'admin@tbarimt.com',
        password: 'admin123',
        fullName: 'Админ',
        role: 'admin'
      },
      // Journalists
      {
        username: 'batbayar',
        email: 'batbayar@example.com',
        password: 'password123',
        fullName: 'Батбаяр',
        role: 'journalist'
      },
      {
        username: 'saraa',
        email: 'saraa@example.com',
        password: 'password123',
        fullName: 'Сараа',
        role: 'journalist'
      },
      {
        username: 'enkhat',
        email: 'enkhat@example.com',
        password: 'password123',
        fullName: 'Энхбат',
        role: 'journalist'
      },
      {
        username: 'tugsuu',
        email: 'tugsuu@example.com',
        password: 'password123',
        fullName: 'Түгсүү',
        role: 'journalist'
      },
      {
        username: 'oyunaa',
        email: 'oyunaa@example.com',
        password: 'password123',
        fullName: 'Оюунаа',
        role: 'journalist'
      },
      // Viewers
      {
        username: 'viewer1',
        email: 'viewer1@example.com',
        password: 'password123',
        fullName: 'Хэрэглэгч 1',
        role: 'viewer'
      },
      {
        username: 'viewer2',
        email: 'viewer2@example.com',
        password: 'password123',
        fullName: 'Хэрэглэгч 2',
        role: 'viewer'
      },
      {
        username: 'viewer3',
        email: 'viewer3@example.com',
        password: 'password123',
        fullName: 'Хэрэглэгч 3',
        role: 'viewer'
      },
      {
        username: 'viewer4',
        email: 'viewer4@example.com',
        password: 'password123',
        fullName: 'Хэрэглэгч 4',
        role: 'viewer'
      },
      {
        username: 'viewer5',
        email: 'viewer5@example.com',
        password: 'password123',
        fullName: 'Хэрэглэгч 5',
        role: 'viewer'
      }
    ];

    const createdUsers = [];
    for (const userData of users) {
      const [user] = await User.findOrCreate({
        where: { email: userData.email },
        defaults: userData
      });
      createdUsers.push(user);
    }
    console.log(`Created ${createdUsers.length} users.`);

    // Create journalist profiles
    console.log('Creating journalist profiles...');
    const journalistProfiles = [
      { userId: createdUsers.find(u => u.username === 'batbayar').id, specialty: 'Дипломын ажил', bio: '10+ жилийн туршлагатай дипломын ажил бичдэг мэргэжилтэн', rating: 4.8, followers: 8500, posts: 120 },
      { userId: createdUsers.find(u => u.username === 'saraa').id, specialty: 'Реферат, Курсын ажил', bio: 'Реферат, курсын ажлын мэргэжилтэн', rating: 4.6, followers: 6200, posts: 95 },
      { userId: createdUsers.find(u => u.username === 'enkhat').id, specialty: 'Программ хангамж', bio: 'Программ хангамжийн мэргэжилтэн', rating: 4.9, followers: 12000, posts: 150 },
      { userId: createdUsers.find(u => u.username === 'tugsuu').id, specialty: 'График дизайн', bio: 'График дизайны мэргэжилтэн', rating: 4.7, followers: 7800, posts: 110 },
      { userId: createdUsers.find(u => u.username === 'oyunaa').id, specialty: 'Төсөл, Бэлэн загвар', bio: 'Төсөл, бэлэн загварын мэргэжилтэн', rating: 4.5, followers: 5500, posts: 85 }
    ];

    const createdJournalists = [];
    for (const profile of journalistProfiles) {
      const [journalist] = await Journalist.findOrCreate({
        where: { userId: profile.userId },
        defaults: profile
      });
      createdJournalists.push(journalist);
    }
    console.log(`Created ${createdJournalists.length} journalist profiles.`);

    // Create products
    console.log('Creating products...');
    const products = [
      {
        title: 'Монгол улсын эдийн засгийн хөгжил',
        description: 'Монгол улсын эдийн засгийн хөгжлийн тухай бүрэн дүүрэн судалгаа. Эдийн засгийн хөгжлийн үе шатууд, онолын суурь, практик жишээнүүд.',
        categoryId: 1,
        subcategoryId: 46,
        authorId: createdUsers.find(u => u.username === 'batbayar').id,
        price: 15000,
        pages: 25,
        rating: 4.8,
        downloads: 234,
        views: 1250,
        image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop',
        tags: ['Эдийн засаг', 'Монгол улс', 'Хөгжил']
      },
      {
        title: 'Компьютерийн сүлжээний аюулгүй байдал',
        description: 'Компьютерийн сүлжээний аюулгүй байдлын тухай дипломын ажил. Сүлжээний аюулгүй байдлын арга хэмжээ, хамгаалалтын системүүд.',
        categoryId: 1,
        subcategoryId: 47,
        authorId: createdUsers.find(u => u.username === 'enkhat').id,
        price: 45000,
        pages: 80,
        rating: 4.9,
        downloads: 156,
        views: 890,
        image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop',
        tags: ['Сүлжээ', 'Аюулгүй байдал', 'Компьютер'],
        isDiploma: true
      },
      {
        title: 'React Native аппликейшн хөгжүүлэх',
        description: 'React Native ашиглан гар утасны аппликейшн хөгжүүлэх бүрэн заавар. Код, жишээ, практик даалгавар.',
        categoryId: 4,
        subcategoryId: 40,
        authorId: createdUsers.find(u => u.username === 'enkhat').id,
        price: 35000,
        pages: 120,
        rating: 4.7,
        downloads: 312,
        views: 2100,
        image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop',
        tags: ['React Native', 'Мобайл', 'Программ']
      },
      {
        title: 'Photoshop бэлэн загвар - Бизнес карт',
        description: 'Бизнес картын бэлэн Photoshop загвар. PSD файл, өнгөт хувилбарууд.',
        categoryId: 3,
        subcategoryId: 42,
        authorId: createdUsers.find(u => u.username === 'tugsuu').id,
        price: 8000,
        pages: null,
        rating: 4.5,
        downloads: 456,
        views: 1800,
        image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop',
        tags: ['Photoshop', 'Дизайн', 'Бизнес карт']
      },
      {
        title: 'Монгол хэлний утга зохиолын судалгаа',
        description: 'Монгол хэлний утга зохиолын судалгааны материал. Түүхэн хөгжил, онолын суурь.',
        categoryId: 1,
        subcategoryId: 46,
        authorId: createdUsers.find(u => u.username === 'saraa').id,
        price: 12000,
        pages: 30,
        rating: 4.6,
        downloads: 189,
        views: 950,
        image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=250&fit=crop',
        tags: ['Монгол хэл', 'Утга зохиол', 'Судалгаа']
      },
      {
        title: 'Төсөл хэрэгжүүлэх заавар',
        description: 'Төсөл хэрэгжүүлэх бүрэн заавар. Төлөвлөлт, удирдлага, хэрэгжүүлэлт.',
        categoryId: 2,
        subcategoryId: 64,
        authorId: createdUsers.find(u => u.username === 'oyunaa').id,
        price: 25000,
        pages: 50,
        rating: 4.4,
        downloads: 278,
        views: 1400,
        image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop',
        tags: ['Төсөл', 'Удирдлага', 'Хэрэгжүүлэлт']
      },
      {
        title: 'Гэрээний бэлэн загвар',
        description: 'Олон төрлийн гэрээний бэлэн загвар. Хөдөлмөрийн гэрээ, худалдааны гэрээ гэх мэт.',
        categoryId: 7,
        subcategoryId: 44,
        authorId: createdUsers.find(u => u.username === 'oyunaa').id,
        price: 10000,
        pages: 15,
        rating: 4.3,
        downloads: 523,
        views: 2200,
        image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=250&fit=crop',
        tags: ['Гэрээ', 'Баримт бичиг', 'Загвар']
      },
      {
        title: 'JavaScript дамжуулах заавар',
        description: 'JavaScript програмчлалын хэлний бүрэн заавар. ES6+, DOM, асинхрон код.',
        categoryId: 4,
        subcategoryId: 40,
        authorId: createdUsers.find(u => u.username === 'enkhat').id,
        price: 28000,
        pages: 95,
        rating: 4.8,
        downloads: 412,
        views: 1950,
        image: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400&h=250&fit=crop',
        tags: ['JavaScript', 'Программ', 'Заавар']
      },
      {
        title: 'Дадлагын тайлан - Банк',
        description: 'Банк дахь дадлагын тайлан. Бүрэн дүүрэн тайлбар, жишээ.',
        categoryId: 1,
        subcategoryId: 53,
        authorId: createdUsers.find(u => u.username === 'saraa').id,
        price: 18000,
        pages: 35,
        rating: 4.5,
        downloads: 267,
        views: 1100,
        image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop',
        tags: ['Дадлага', 'Тайлан', 'Банк']
      },
      {
        title: 'Мобайл тоглоом - Puzzle',
        description: 'Puzzle төрлийн мобайл тоглоом. Unity ашиглан хөгжүүлсэн.',
        categoryId: 8,
        subcategoryId: 59,
        authorId: createdUsers.find(u => u.username === 'enkhat').id,
        price: 50000,
        pages: null,
        rating: 4.6,
        downloads: 89,
        views: 650,
        image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=250&fit=crop',
        tags: ['Тоглоом', 'Мобайл', 'Unity']
      }
    ];

    const createdProducts = [];
    for (const productData of products) {
      const [product] = await Product.findOrCreate({
        where: { title: productData.title },
        defaults: productData
      });
      createdProducts.push(product);
    }
    console.log(`Created ${createdProducts.length} products.`);

    // Create orders
    console.log('Creating orders...');
    const viewerUsers = createdUsers.filter(u => u.role === 'viewer');
    const orders = [];
    
    // Create orders for different viewers
    for (let i = 0; i < 15; i++) {
      const randomViewer = viewerUsers[Math.floor(Math.random() * viewerUsers.length)];
      const randomProduct = createdProducts[Math.floor(Math.random() * createdProducts.length)];
      const paymentMethods = ['qpay', 'bank', 'other'];
      const statuses = ['pending', 'completed', 'failed', 'cancelled'];
      
      orders.push({
        userId: randomViewer.id,
        productId: randomProduct.id, // Use integer id
        amount: randomProduct.price,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        transactionId: `TXN${Date.now()}${i}`
      });
    }

    const createdOrders = [];
    for (const orderData of orders) {
      const order = await Order.create(orderData);
      createdOrders.push(order);
    }
    console.log(`Created ${createdOrders.length} orders.`);

    // Create reviews
    console.log('Creating reviews...');
    const reviews = [];
    const reviewComments = [
      'Маш сайн материал, их хэрэгтэй байна!',
      'Тайлбар нь тодорхой, ойлгомжтой.',
      'Заавар нь маш дэлгэрэнгүй, сайн.',
      'Хэрэгтэй материал байна.',
      'Маш сайн чанартай.',
      'Товчхон, ойлгомжтой.',
      'Их хэрэгтэй байна, баярлалаа!',
      'Маш сайн ажил, таалагдлаа.',
      'Дэлгэрэнгүй, ойлгомжтой материал.',
      'Маш хэрэгтэй байна.'
    ];

    // Create reviews for products
    for (const product of createdProducts) {
      // Each product gets 2-5 reviews
      const numReviews = Math.floor(Math.random() * 4) + 2;
      for (let i = 0; i < numReviews; i++) {
        const randomViewer = viewerUsers[Math.floor(Math.random() * viewerUsers.length)];
        const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5
        const comment = reviewComments[Math.floor(Math.random() * reviewComments.length)];
        
        reviews.push({
          productId: product.id, // Use integer id
          userId: randomViewer.id,
          rating: rating,
          comment: comment
        });
      }
    }

    const createdReviews = [];
    for (const reviewData of reviews) {
      const review = await Review.create(reviewData);
      createdReviews.push(review);
    }
    console.log(`Created ${createdReviews.length} reviews.`);

    // Update product ratings based on reviews
    console.log('Updating product ratings...');
    for (const product of createdProducts) {
      const productReviews = await Review.findAll({ where: { productId: product.id } });
      if (productReviews.length > 0) {
        const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
        await product.update({ rating: parseFloat(avgRating.toFixed(2)) });
      }
    }

    console.log('\n✅ Database seeded successfully!');
    console.log(`\nSummary:`);
    console.log(`- Categories: ${createdCategories.length}`);
    console.log(`- Subcategories: ${createdSubcategories.length}`);
    console.log(`- Users: ${createdUsers.length}`);
    console.log(`- Journalists: ${createdJournalists.length}`);
    console.log(`- Products: ${createdProducts.length}`);
    console.log(`- Orders: ${createdOrders.length}`);
    console.log(`- Reviews: ${createdReviews.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
