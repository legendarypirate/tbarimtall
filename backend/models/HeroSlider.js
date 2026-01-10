const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HeroSlider = sequelize.define('HeroSlider', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  imageUrl: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  subtitle: {
    type: DataTypes.STRING(255),
    allowNull: true
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
  tableName: 'hero_sliders',
  timestamps: true
});

module.exports = HeroSlider;

