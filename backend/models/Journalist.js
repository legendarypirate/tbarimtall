const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Journalist = sequelize.define('Journalist', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  specialty: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  followers: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  posts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'journalists',
  timestamps: true
});

module.exports = Journalist;

