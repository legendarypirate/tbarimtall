const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FAQ = sequelize.define('FAQ', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  question: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'JSON object with mn and en keys for multilingual questions'
  },
  answer: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'JSON object with mn and en keys for multilingual answers'
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'faqs',
  timestamps: true
});

module.exports = FAQ;

