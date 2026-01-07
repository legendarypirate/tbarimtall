const { Category, Subcategory, Product } = require('../models');
require('dotenv').config();

/**
 * Script to remove or deactivate generic categories with names like "Category 37", "Category 40", etc.
 * These are likely subcategories that were incorrectly stored as categories.
 */
async function removeGenericCategories() {
  try {
    console.log('=== Removing Generic Categories ===\n');

    // Find all categories with generic names
    const allCategories = await Category.findAll({
      include: [{
        model: Subcategory,
        as: 'subcategories',
        required: false
      }]
    });

    const genericCategories = allCategories.filter(cat => {
      return /^Category\s+\d+$/i.test(cat.name);
    });

    console.log(`Found ${genericCategories.length} generic categories:\n`);
    genericCategories.forEach(cat => {
      console.log(`  - ID: ${cat.id}, Name: "${cat.name}"`);
    });

    if (genericCategories.length === 0) {
      console.log('\nNo generic categories found. Nothing to clean up.');
      return;
    }

    // Check for products and subcategories associated with these categories
    console.log('\nChecking for associated data...\n');
    for (const cat of genericCategories) {
      const productsCount = await Product.count({ where: { categoryId: cat.id } });
      const subcategoriesCount = cat.subcategories ? cat.subcategories.length : 0;

      console.log(`Category ${cat.id} ("${cat.name}"):`);
      console.log(`  - Products: ${productsCount}`);
      console.log(`  - Subcategories: ${subcategoriesCount}`);

      if (productsCount > 0 || subcategoriesCount > 0) {
        console.log(`  ⚠️  WARNING: This category has associated data. Consider reassigning before deletion.`);
      }
    }

    // Ask for confirmation (in a real scenario, you might want to add command-line args)
    console.log('\n=== Options ===');
    console.log('1. Deactivate generic categories (set isActive = false)');
    console.log('2. Delete generic categories (only if no products/subcategories)');
    console.log('3. Cancel\n');

    // For now, we'll deactivate them by default
    // You can modify this script to accept command-line arguments for different actions
    const action = process.argv[2] || 'deactivate';

    if (action === 'deactivate') {
      console.log('Deactivating generic categories...\n');
      for (const cat of genericCategories) {
        await cat.update({ isActive: false });
        console.log(`✓ Deactivated category ${cat.id} ("${cat.name}")`);
      }
      console.log(`\n✓ Successfully deactivated ${genericCategories.length} generic categories.`);
    } else if (action === 'delete') {
      console.log('Deleting generic categories (only those without products/subcategories)...\n');
      let deletedCount = 0;
      for (const cat of genericCategories) {
        const productsCount = await Product.count({ where: { categoryId: cat.id } });
        const subcategoriesCount = await Subcategory.count({ where: { categoryId: cat.id } });

        if (productsCount === 0 && subcategoriesCount === 0) {
          await cat.destroy();
          console.log(`✓ Deleted category ${cat.id} ("${cat.name}")`);
          deletedCount++;
        } else {
          console.log(`✗ Skipped category ${cat.id} ("${cat.name}") - has ${productsCount} products and ${subcategoriesCount} subcategories`);
        }
      }
      console.log(`\n✓ Successfully deleted ${deletedCount} generic categories.`);
    } else {
      console.log('Cancelled. No changes made.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
removeGenericCategories();

