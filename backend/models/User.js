const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  fullName: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('viewer', 'journalist', 'admin'),
    defaultValue: 'viewer'
  },
  avatar: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isSuperAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  membership_type: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    comment: 'Reference to membership id (gold, silver, bronze)'
  },
  subscriptionStartDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Subscription start date'
  },
  subscriptionEndDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Subscription end date'
  },
  wallet: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Wallet account number (e.g., QPay wallet number, bank account)'
  },
  income: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Total wallet balance - sum of all completed orders for user\'s products',
    get() {
      const value = this.getDataValue('income');
      return value !== null && value !== undefined 
        ? parseFloat(value) 
        : 0;
    },
    set(value) {
      this.setDataValue('income', parseFloat(value) || 0);
    }
  },
  point: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Points earned from product sales commissions (membership-based)',
    get() {
      const value = this.getDataValue('point');
      return value !== null && value !== undefined 
        ? parseFloat(value) 
        : 0;
    },
    set(value) {
      this.setDataValue('point', parseFloat(value) || 0);
    }
  },
  publishedFileCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Count of published products (status=published and isActive=true)'
  },
  privacyAccepted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether user has accepted the privacy policy'
  },
  termsAccepted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether user has accepted the terms and conditions'
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
      
      // Set default FREE membership (id: 2) for journalists
      if (user.role === 'journalist' && !user.membership_type) {
        user.membership_type = 2; // FREE membership
        // Set subscription dates (1 year from now)
        const now = new Date();
        user.subscriptionStartDate = now;
        const oneYearLater = new Date(now);
        oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
        user.subscriptionEndDate = oneYearLater;
      }
      
      // Auto-assign wallet number if not provided
      if (!user.wallet) {
        try {
          // Use raw SQL query to find max wallet number (PostgreSQL compatible)
          // Try to cast wallet to integer, ignore non-numeric values
          const [results] = await sequelize.query(
            `SELECT MAX(
              CASE 
                WHEN wallet ~ '^[0-9]+$' THEN wallet::INTEGER 
                ELSE 0 
              END
            ) as maxWallet 
             FROM users 
             WHERE wallet IS NOT NULL 
             AND wallet != ''`,
            { type: sequelize.QueryTypes.SELECT }
          );
          
          const maxWallet = results?.maxWallet || 0;
          
          // Start from 514826 if max is less than that, otherwise increment
          const nextWallet = maxWallet >= 514826 ? maxWallet + 1 : 514826;
          
          user.wallet = nextWallet.toString();
          console.log(`✅ Auto-assigned wallet number: ${user.wallet} for new user`);
        } catch (error) {
          console.error('Error auto-assigning wallet number:', error);
          // If there's an error, start from 514826 as fallback
          user.wallet = '514826';
          console.log(`⚠️  Using fallback wallet number: ${user.wallet}`);
        }
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;

