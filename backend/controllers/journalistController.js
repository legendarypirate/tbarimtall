const { Journalist, User, Product, Review, JournalistReview, Follow } = require('../models');
const { Op } = require('sequelize');

exports.getTopJournalists = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Fetch users directly from users table where role = 'journalist'
    const { Membership } = require('../models');
    const journalistUsers = await User.findAll({
      where: {
        role: 'journalist',
        isActive: true
      },
      attributes: ['id', 'username', 'fullName', 'avatar', 'email', 'membership_type'],
      include: [{
        model: Membership,
        as: 'membership',
        required: false,
        attributes: ['id', 'name']
      }],
      limit: limit * 2 // Get more users initially, we'll filter and sort later
    });

    if (journalistUsers.length === 0) {
      return res.json({ journalists: [] });
    }

    const userIds = journalistUsers.map(u => u.id);
    
    // Get or create journalist records for all users first (needed for follower counts)
    const journalistRecords = await Promise.all(
      journalistUsers.map(async (user) => {
        let journalistRecord = await Journalist.findOne({ where: { userId: user.id } });
        if (!journalistRecord) {
          // Create journalist record if it doesn't exist
          journalistRecord = await Journalist.create({
            userId: user.id,
            specialty: null,
            bio: null,
            rating: 0,
            followers: 0,
            posts: 0
          });
        }
        return { user, journalistRecord };
      })
    );

    const journalistIds = journalistRecords.map(jr => jr.journalistRecord.id);
    
    // Use raw query for better performance with GROUP BY
    const { sequelize } = require('../models');
    const { QueryTypes } = require('sequelize');
    
    // Get product counts
    const productCounts = await sequelize.query(
      `SELECT "authorId", COUNT(*) as count 
       FROM products 
       WHERE "authorId" IN (:userIds) AND "isActive" = true 
       GROUP BY "authorId"`,
      {
        replacements: { userIds },
        type: QueryTypes.SELECT
      }
    );

    // Get average ratings from product reviews
    const averageRatings = await sequelize.query(
      `SELECT p."authorId", AVG(r.rating)::numeric(3,2) as avg_rating, COUNT(r.id) as review_count
       FROM products p
       LEFT JOIN reviews r ON p.id = r."productId"
       WHERE p."authorId" IN (:userIds) AND p."isActive" = true
       GROUP BY p."authorId"`,
      {
        replacements: { userIds },
        type: QueryTypes.SELECT
      }
    );

    // Get journalist reviews average ratings
    const journalistRatings = await sequelize.query(
      `SELECT j."userId", AVG(jr.rating)::numeric(3,2) as avg_rating, COUNT(jr.id) as review_count
       FROM journalists j
       LEFT JOIN journalist_reviews jr ON j.id = jr."journalistId"
       WHERE j."userId" IN (:userIds)
       GROUP BY j."userId"`,
      {
        replacements: { userIds },
        type: QueryTypes.SELECT
      }
    );

    // Get real follower counts from follows table using journalist IDs
    const followerCounts = await sequelize.query(
      `SELECT "journalistId", COUNT(*) as follower_count
       FROM follows
       WHERE "journalistId" IN (:journalistIds)
       GROUP BY "journalistId"`,
      {
        replacements: { journalistIds },
        type: QueryTypes.SELECT
      }
    );

    // Create maps for quick lookup
    const countMap = {};
    productCounts.forEach(item => {
      countMap[item.authorId] = parseInt(item.count) || 0;
    });

    const ratingMap = {};
    // First, use journalist reviews if available
    journalistRatings.forEach(item => {
      if (item.review_count > 0 && item.avg_rating) {
        ratingMap[item.userId] = parseFloat(item.avg_rating) || 0;
      }
    });
    // Then, use product reviews as fallback if no journalist reviews
    averageRatings.forEach(item => {
      if (!ratingMap[item.authorId] && item.review_count > 0 && item.avg_rating) {
        ratingMap[item.authorId] = parseFloat(item.avg_rating) || 0;
      } else if (!ratingMap[item.authorId]) {
        ratingMap[item.authorId] = 0;
      }
    });

    // Create map: journalistId -> userId for follower lookup
    const journalistToUserMap = {};
    journalistRecords.forEach(({ user, journalistRecord }) => {
      journalistToUserMap[journalistRecord.id] = user.id;
    });

    const followerMap = {};
    followerCounts.forEach(item => {
      const userId = journalistToUserMap[item.journalistId];
      if (userId) {
        followerMap[userId] = parseInt(item.follower_count) || 0;
      }
    });

    // Map users with calculated data
    const journalistsWithData = journalistRecords.map(({ user, journalistRecord }) => {
      const userId = user.id;
      
      return {
        id: journalistRecord.id,
        userId: userId,
        name: user.fullName || user.username,
        username: user.username, // Don't add @ prefix here, let frontend handle it
        avatar: user.avatar,
        specialty: journalistRecord.specialty || null,
        rating: ratingMap[userId] || 0,
        followers: followerMap[userId] || 0,
        posts: countMap[userId] || 0,
        membership_type: user.membership_type || null,
        membership: user.membership ? {
          id: user.membership.id,
          name: user.membership.name
        } : null
      };
    });

    // Sort by rating first, then by followers, then by posts
    journalistsWithData.sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      if (b.followers !== a.followers) {
        return b.followers - a.followers;
      }
      return b.posts - a.posts;
    });

    // Limit to requested number
    const topJournalists = journalistsWithData.slice(0, limit);

    res.json({ journalists: topJournalists });
  } catch (error) {
    console.error('Error in getTopJournalists:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getJournalistById = async (req, res) => {
  try {
    const { id } = req.params;

    // First check if user exists
    const { Membership } = require('../models');
    const user = await User.findByPk(id, {
      attributes: ['id', 'username', 'fullName', 'avatar', 'email', 'role', 'membership_type'],
      include: [{
        model: Membership,
        as: 'membership',
        required: false,
        attributes: ['id', 'name']
      }]
    });

    if (!user) {
      return res.status(404).json({ error: 'Journalist not found' });
    }

    // Check if journalist record exists, if not create one
    let journalist = await Journalist.findOne({
      where: { userId: id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'fullName', 'avatar', 'email']
      }]
    });

    // If no journalist record exists, create one with default values
    if (!journalist) {
      journalist = await Journalist.create({
        userId: id,
        specialty: null,
        bio: null,
        rating: 0,
        followers: 0,
        posts: 0
      });
      
      // Manually attach user data since we already have it
      journalist = journalist.toJSON();
      journalist.user = {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        email: user.email,
        membership_type: user.membership_type || null,
        membership: user.membership ? {
          id: user.membership.id,
          name: user.membership.name
        } : null
      };
    } else {
      journalist = journalist.toJSON();
      // Always ensure user data includes membership (from the separately fetched user)
      journalist.user = {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        email: user.email,
        membership_type: user.membership_type || null,
        membership: user.membership ? {
          id: user.membership.id,
          name: user.membership.name
        } : null
      };
    }

    // Get products - only show published products (not 'new' status)
    const products = await Product.findAll({
      where: { 
        authorId: id, 
        isActive: true,
        status: 'published'
      },
      include: [
        { model: require('../models').Category, as: 'category', attributes: ['id', 'name', 'icon'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    const postsCount = await Product.count({
      where: { 
        authorId: id, 
        isActive: true,
        status: 'published'
      }
    });

    // Get real follower count
    const followerCount = await Follow.count({
      where: { journalistId: journalist.id }
    });

    // Get real average rating from journalist reviews
    const reviews = await JournalistReview.findAll({
      where: { journalistId: journalist.id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'fullName', 'avatar']
      }],
      order: [['createdAt', 'DESC']]
    });

    // Calculate average rating
    let averageRating = 0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
      averageRating = parseFloat((sum / reviews.length).toFixed(2));
    }

    // Format reviews for frontend
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      user: review.user ? (review.user.fullName || review.user.username) : 'Unknown',
      avatar: review.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${review.user?.id || 'default'}`,
      date: new Date(review.createdAt).toLocaleDateString('mn-MN')
    }));

    // Check if current user is following (if authenticated)
    let isFollowing = false;
    // Allow multiple reviews - always set hasReviewed to false
    let hasReviewed = false;
    let userReview = null;
    if (req.user) {
      const follow = await Follow.findOne({
        where: {
          followerId: req.user.id,
          journalistId: journalist.id
        }
      });
      isFollowing = !!follow;

      // Get the most recent review from current user (for display purposes only)
      // Users can still submit multiple reviews
      const existingReview = await JournalistReview.findOne({
        where: {
          journalistId: journalist.id,
          userId: req.user.id
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName', 'avatar']
        }],
        order: [['createdAt', 'DESC']]
      });

      if (existingReview) {
        // Show the most recent review but don't prevent new reviews
        userReview = {
          id: existingReview.id,
          rating: existingReview.rating,
          comment: existingReview.comment,
          user: existingReview.user ? (existingReview.user.fullName || existingReview.user.username) : 'Unknown',
          avatar: existingReview.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${existingReview.user?.id || 'default'}`,
          date: new Date(existingReview.createdAt).toLocaleDateString('mn-MN')
        };
      }
    }

    res.json({
      journalist: {
        ...journalist,
        posts: postsCount,
        products,
        followers: followerCount,
        rating: averageRating,
        reviews: formattedReviews,
        isFollowing,
        hasReviewed,
        userReview
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Follow a journalist
exports.followJournalist = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get journalist by userId
    const journalist = await Journalist.findOne({
      where: { userId: id }
    });

    if (!journalist) {
      return res.status(404).json({ error: 'Journalist not found' });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      where: {
        followerId: userId,
        journalistId: journalist.id
      }
    });

    if (existingFollow) {
      return res.status(400).json({ error: 'Already following this journalist' });
    }

    // Create follow
    await Follow.create({
      followerId: userId,
      journalistId: journalist.id
    });

    // Update follower count
    const followerCount = await Follow.count({
      where: { journalistId: journalist.id }
    });

    res.json({
      message: 'Successfully followed journalist',
      followers: followerCount,
      isFollowing: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Unfollow a journalist
exports.unfollowJournalist = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get journalist by userId
    const journalist = await Journalist.findOne({
      where: { userId: id }
    });

    if (!journalist) {
      return res.status(404).json({ error: 'Journalist not found' });
    }

    // Remove follow
    const deleted = await Follow.destroy({
      where: {
        followerId: userId,
        journalistId: journalist.id
      }
    });

    if (deleted === 0) {
      return res.status(400).json({ error: 'Not following this journalist' });
    }

    // Update follower count
    const followerCount = await Follow.count({
      where: { journalistId: journalist.id }
    });

    res.json({
      message: 'Successfully unfollowed journalist',
      followers: followerCount,
      isFollowing: false
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a review for a journalist
exports.createJournalistReview = async (req, res) => {
  try {
    const { id } = req.params; // This is the journalistUserId (the one being reviewed)
    const { rating, comment } = req.body;
    const userId = req.user.id; // This is the reviewer's userId

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Convert rating to integer and validate
    const ratingInt = parseInt(rating);
    if (!rating || isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Convert id to integer (journalistUserId - the one being reviewed)
    const journalistUserId = parseInt(id);
    if (isNaN(journalistUserId)) {
      return res.status(400).json({ error: 'Invalid journalist ID' });
    }

    // Prevent users from reviewing themselves
    if (userId === journalistUserId) {
      return res.status(400).json({ error: 'You cannot review yourself' });
    }

    // Get journalist by userId (the journalist being reviewed)
    const journalist = await Journalist.findOne({
      where: { userId: journalistUserId }
    });

    if (!journalist) {
      return res.status(404).json({ error: 'Journalist not found' });
    }

    // Check if the reviewer is also a journalist
    const reviewerJournalist = await Journalist.findOne({
      where: { userId: userId }
    });

    if (reviewerJournalist) {
      console.log(`Journalist (ID: ${reviewerJournalist.id}) is reviewing another journalist (ID: ${journalist.id})`);
    }

    // ALWAYS CREATE NEW REVIEW - NO CHECK FOR EXISTING REVIEWS
    console.log('Creating review:', {
      journalistId: journalist.id,
      userId: userId,
      rating: ratingInt,
      comment: comment || null
    });
    
    const newReview = await JournalistReview.create({
      journalistId: journalist.id,
      userId: userId,
      rating: ratingInt,
      comment: comment || null
    });

    // Verify the review was actually created
    if (!newReview || !newReview.id) {
      console.error('Review creation failed - no review object returned');
      return res.status(500).json({ 
        error: 'Failed to create review',
        details: 'Review object was not created'
      });
    }

    console.log('Review created successfully with ID:', newReview.id);

    // Verify the review was actually saved to the database
    const verifyReview = await JournalistReview.findByPk(newReview.id);
    if (!verifyReview) {
      console.error('Review was not found in database after creation!');
      return res.status(500).json({ 
        error: 'Failed to save review',
        details: 'Review was created but not found in database'
      });
    }
    console.log('Review verified in database:', verifyReview.id);

    // Recalculate average rating from all reviews
    const reviews = await JournalistReview.findAll({
      where: { journalistId: journalist.id }
    });

    console.log(`Total reviews for journalist ${journalist.id}:`, reviews.length);

    let averageRating = 0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
      averageRating = parseFloat((sum / reviews.length).toFixed(2));
      
      // Update journalist's average rating
      await journalist.update({ rating: averageRating });
      console.log('Updated journalist rating to:', averageRating);
    }

    res.json({
      message: 'Review created successfully',
      rating: averageRating,
      reviewId: newReview.id
    });
  } catch (error) {
    console.error('Error in createJournalistReview:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      original: error.original
    });

    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => ({
        field: err.path,
        message: err.message
      }));
      console.error('Validation errors:', errors);
      return res.status(400).json({ 
        error: 'Validation error',
        details: errors
      });
    }
    
    // If you get unique constraint error, the constraint still exists in DB
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.error('Database still has unique constraint. Run this SQL to remove it:');
      console.error('ALTER TABLE journalist_reviews DROP CONSTRAINT IF EXISTS journalist_reviews_journalist_id_user_id_unique;');
      console.error('Full error:', error);
      
      // Fallback: Update existing review instead
      try {
        // Re-fetch params inside the catch block
        const journalistUserId = parseInt(req.params.id);
        const userId = req.user.id;
        const ratingInt = parseInt(req.body.rating);
        const comment = req.body.comment || null;
        
        const journalist = await Journalist.findOne({
          where: { userId: journalistUserId }
        });
        
        if (!journalist) {
          return res.status(404).json({ 
            error: 'Journalist not found in fallback',
            details: 'Please contact administrator to remove the unique constraint'
          });
        }
        
        const existingReview = await JournalistReview.findOne({
          where: {
            journalistId: journalist.id,
            userId: userId
          },
          order: [['createdAt', 'DESC']]
        });
        
        if (existingReview) {
          await existingReview.update({
            rating: ratingInt,
            comment: comment,
            updatedAt: new Date()
          });
          
          // Recalculate average rating
          const reviews = await JournalistReview.findAll({
            where: { journalistId: journalist.id }
          });
          
          let averageRating = 0;
          if (reviews.length > 0) {
            const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
            averageRating = parseFloat((sum / reviews.length).toFixed(2));
            
            // Update journalist's average rating
            await journalist.update({ rating: averageRating });
          }
          
          return res.json({
            message: 'Review updated successfully (fallback due to constraint)',
            rating: averageRating
          });
        } else {
          // No existing review found, but constraint prevented creation
          return res.status(400).json({ 
            error: 'Database constraint prevents creating review',
            details: 'Please run the SQL script to remove the unique constraint: remove-unique-constraint-journalist-reviews.sql'
          });
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        return res.status(400).json({ 
          error: 'Database constraint prevents multiple reviews',
          details: 'Please contact administrator to remove the unique constraint. Error: ' + fallbackError.message
        });
      }
    }

    // Handle database constraint errors
    if (error.name === 'SequelizeDatabaseError' || error.name === 'SequelizeForeignKeyConstraintError') {
      console.error('Database error:', error.message, error.original);
      return res.status(400).json({ 
        error: 'Database constraint error',
        details: error.message || 'A database constraint prevented the operation'
      });
    }

    // Generic error
    console.error('Unexpected error creating journalist review:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};