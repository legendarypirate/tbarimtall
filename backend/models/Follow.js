const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Follow = sequelize.define('Follow', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  followerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who is following'
  },
  journalistId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'journalists',
      key: 'id'
    },
    comment: 'Journalist being followed'
  }
}, {
  tableName: 'follows',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['followerId', 'journalistId'],
      name: 'unique_follow'
    },
    {
      fields: ['journalistId'],
      name: 'idx_follows_journalist'
    },
    {
      fields: ['followerId'],
      name: 'idx_follows_follower'
    }
  ]
});

module.exports = Follow;

