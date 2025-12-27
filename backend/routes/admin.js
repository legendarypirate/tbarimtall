const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const bannerController = require('../controllers/bannerController');
const rolePermissionController = require('../controllers/rolePermissionController');
const membershipController = require('../controllers/membershipController');
const { authenticate, authorize, requireSuperAdmin } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);

// Users CRUD
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Products CRUD
router.get('/products', adminController.getAllProductsAdmin);
router.put('/products/:id', adminController.updateProductAdmin);
router.delete('/products/:id', adminController.deleteProductAdmin);

// Categories CRUD
router.get('/categories', adminController.getAllCategoriesAdmin);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// Orders/Payments CRUD
router.get('/orders', adminController.getAllOrders);
router.get('/orders/qpay', adminController.getQPayOrders);
router.put('/orders/:id', adminController.updateOrder);

// Banners CRUD
router.get('/banners', bannerController.getAllBannersAdmin);
router.post('/banners', bannerController.createBanner);
router.put('/banners/:id', bannerController.updateBanner);
router.delete('/banners/:id', bannerController.deleteBanner);

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

module.exports = router;

