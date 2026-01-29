const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const bannerController = require('../controllers/bannerController');
const heroSliderController = require('../controllers/heroSliderController');
const faqController = require('../controllers/faqController');
const rolePermissionController = require('../controllers/rolePermissionController');
const membershipController = require('../controllers/membershipController');
const { authenticate, authorize, requireSuperAdmin } = require('../middleware/auth');
const { uploadProduct, uploadImage } = require('../config/multer');
const multer = require('multer');

// Create multer instance for hero slider images (memory storage for Cloudinary)
const uploadHeroSliderImage = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for images
  }
});

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);

// Income Analytics
router.get('/income', adminController.getIncomeAnalytics);

// Users CRUD
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.post('/users/:id/charge-income', adminController.chargeUserIncome);
router.post('/users/:id/charge-point', adminController.chargeUserPoint);
router.delete('/users/:id', adminController.deleteUser);

// Products CRUD
router.get('/products', adminController.getAllProductsAdmin);
router.get('/products/:productId/download', adminController.downloadProductFile);
router.get('/products/:productId/purchases', adminController.getProductPurchaseHistory);
router.put('/products/:id', uploadProduct.fields([
  { name: 'previewImages', maxCount: 10 } // Allow up to 10 preview images
]), adminController.updateProductAdmin);
router.delete('/products/:id', adminController.deleteProductAdmin);

// Categories CRUD
router.get('/categories', adminController.getAllCategoriesAdmin);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// Subcategories CRUD
router.get('/subcategories', adminController.getAllSubcategoriesAdmin);
router.post('/subcategories', adminController.createSubcategory);
router.put('/subcategories/:id', adminController.updateSubcategory);
router.delete('/subcategories/:id', adminController.deleteSubcategory);

// Orders/Payments CRUD
router.get('/orders', adminController.getAllOrders);
router.get('/orders/qpay', adminController.getQPayOrders);
router.put('/orders/:id', adminController.updateOrder);

// Banners CRUD
router.get('/banners', bannerController.getAllBannersAdmin);
router.post('/banners', bannerController.createBanner);
router.put('/banners/:id', bannerController.updateBanner);
router.delete('/banners/:id', bannerController.deleteBanner);

// Hero Sliders CRUD
router.get('/hero-sliders', heroSliderController.getAllHeroSlidersAdmin);
router.post('/hero-sliders', uploadHeroSliderImage.single('image'), heroSliderController.createHeroSlider);
router.put('/hero-sliders/:id', uploadHeroSliderImage.single('image'), heroSliderController.updateHeroSlider);
router.delete('/hero-sliders/:id', heroSliderController.deleteHeroSlider);

// FAQs CRUD
router.get('/faqs', faqController.getAllFAQsAdmin);
router.get('/faqs/:id', faqController.getFAQById);
router.post('/faqs', faqController.createFAQ);
router.put('/faqs/:id', faqController.updateFAQ);
router.delete('/faqs/:id', faqController.deleteFAQ);

// Role Permissions CRUD (Super Admin only)
router.get('/role-permissions', requireSuperAdmin, rolePermissionController.getAllRolePermissions);
router.get('/role-permissions/:id', requireSuperAdmin, rolePermissionController.getRolePermissionById);
router.post('/role-permissions', requireSuperAdmin, rolePermissionController.createRolePermission);
router.put('/role-permissions/:id', requireSuperAdmin, rolePermissionController.updateRolePermission);
router.delete('/role-permissions/:id', requireSuperAdmin, rolePermissionController.deleteRolePermission);
router.get('/role-permissions/role/:roleName/users', requireSuperAdmin, rolePermissionController.getUsersByRole);

// Memberships CRUD
router.get('/memberships', membershipController.getAllMemberships);
router.get('/memberships/:id', membershipController.getMembershipById);
router.post('/memberships', membershipController.createMembership);
router.put('/memberships/:id', membershipController.updateMembership);
router.delete('/memberships/:id', membershipController.deleteMembership);

// User subscription management
router.put('/users/:userId/subscription', membershipController.updateUserSubscription);

module.exports = router;

