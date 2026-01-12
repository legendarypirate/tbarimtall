const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const JournalistReview = sequelize.define('JournalistReview', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  journalistId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'journalists',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  }
  // createdAt and updatedAt are automatically handled by timestamps: true
}, {
  tableName: 'journalist_reviews',
  timestamps: true,
  // Explicitly disable unique constraint on journalistId + userId
  indexes: [
    {
      fields: ['journalistId']
    },
    {
      fields: ['userId']
    },
    // This index allows duplicates - remove 'unique: true'
    {
      fields: ['journalistId', 'userId']
    }
  ],
  // Disable unique constraint at model level
  uniqueKeys: {
    // Don't define any unique constraints here
  }
});

// Add method to check for existing recent reviews
JournalistReview.findRecentByUserAndJournalist = async function(userId, journalistId, days = 1) {
  const { Op } = require('sequelize');
  const oneDayAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return await this.findOne({
    where: {
      userId,
      journalistId,
      createdAt: {
        [Op.gte]: oneDayAgo
      }
    },
    order: [['createdAt', 'DESC']]
  });
};

module.exports = JournalistReview;