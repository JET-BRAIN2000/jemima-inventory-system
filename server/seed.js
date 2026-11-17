const bcrypt = require('bcryptjs');
const pool = require('./db');

async function seed() {
  const now = new Date();
  const userId = 'u001';
  const storeId = 's001';
  const password = await bcrypt.hash('Admin@123', 10);

  const categories = [
    { category_id: 'c001', category_name: 'Grains & Rice', description: 'All grain products' },
    { category_id: 'c002', category_name: 'Cooking Oil', description: 'Vegetable and cooking oils' },
    { category_id: 'c003', category_name: 'Sweeteners', description: 'Sugar and related products' },
    { category_id: 'c004', category_name: 'Seasonings', description: 'Salt, spices, and condiments' },
    { category_id: 'c005', category_name: 'Beverages', description: 'Drinks and beverages' },
    { category_id: 'c006', category_name: 'Dairy & Eggs', description: 'Dairy products and eggs' },
    { category_id: 'c007', category_name: 'Canned Goods', description: 'Tinned and packaged food' },
    { category_id: 'c008', category_name: 'Snacks', description: 'Biscuits, chips, and snacks' },
  ];

  const inventoryItems = [
    { item_id: 'i001', product_name: 'Rice (5kg)', category_id: 'c001', category_name: 'Grains & Rice', unit_price: 4500.00, quantity_current: 45, quantity_initial: 100, description: 'Premium long-grain parboiled rice' },
    { item_id: 'i002', product_name: 'Groundnut Oil (1L)', category_id: 'c002', category_name: 'Cooking Oil', unit_price: 1800.00, quantity_current: 30, quantity_initial: 60, description: 'Pure groundnut cooking oil' },
    { item_id: 'i003', product_name: 'Sugar (1kg)', category_id: 'c003', category_name: 'Sweeteners', unit_price: 1200.00, quantity_current: 80, quantity_initial: 100, description: 'Refined white sugar' },
    { item_id: 'i004', product_name: 'Table Salt (1kg)', category_id: 'c004', category_name: 'Seasonings', unit_price: 400.00, quantity_current: 7, quantity_initial: 50, description: 'Iodized table salt' },
    { item_id: 'i005', product_name: 'Milo (500g)', category_id: 'c005', category_name: 'Beverages', unit_price: 2500.00, quantity_current: 20, quantity_initial: 40, description: 'Chocolate malt drink' },
    { item_id: 'i006', product_name: 'Evaporated Milk (peak)', category_id: 'c006', category_name: 'Dairy & Eggs', unit_price: 650.00, quantity_current: 0, quantity_initial: 60, description: 'Peak evaporated milk 170g' },
    { item_id: 'i007', product_name: 'Tomato Paste (tin)', category_id: 'c007', category_name: 'Canned Goods', unit_price: 350.00, quantity_current: 55, quantity_initial: 80, description: 'Tomato paste 400g tin' },
    { item_id: 'i008', product_name: 'Cabin Biscuits', category_id: 'c008', category_name: 'Snacks', unit_price: 200.00, quantity_current: 120, quantity_initial: 150, description: 'Cabin cream crackers' },
    { item_id: 'i009', product_name: 'Spaghetti (500g)', category_id: 'c001', category_name: 'Grains & Rice', unit_price: 800.00, quantity_current: 3, quantity_initial: 50, description: 'Golden pasta spaghetti' },
    { item_id: 'i010', product_name: 'Vegetable Oil (2L)', category_id: 'c002', category_name: 'Cooking Oil', unit_price: 2800.00, quantity_current: 18, quantity_initial: 30, description: 'Pure vegetable oil 2 litres' },
  ];

  const sales = [
    { sale_id: 'sale-00001', customer_name: 'Amaka', item_id: 'i001', item_name: 'Rice (5kg)', quantity_sold: 2, unit_price: 4500.00, total_amount: 9000.00, payment_method: 'Cash', receipt_number: 'RCP-00001', sale_timestamp: new Date(now.getTime() - 86400000 * 1) },
    { sale_id: 'sale-00002', customer_name: 'Chidi', item_id: 'i002', item_name: 'Groundnut Oil (1L)', quantity_sold: 1, unit_price: 1800.00, total_amount: 1800.00, payment_method: 'Credit Card', receipt_number: 'RCP-00002', sale_timestamp: new Date(now.getTime() - 86400000 * 2) },
    { sale_id: 'sale-00003', customer_name: 'Funmi', item_id: 'i005', item_name: 'Milo (500g)', quantity_sold: 3, unit_price: 2500.00, total_amount: 7500.00, payment_method: 'Mobile Money', receipt_number: 'RCP-00003', sale_timestamp: new Date(now.getTime() - 86400000 * 3) },
    { sale_id: 'sale-00004', customer_name: 'Emeka', item_id: 'i004', item_name: 'Table Salt (1kg)', quantity_sold: 5, unit_price: 400.00, total_amount: 2000.00, payment_method: 'Cash', receipt_number: 'RCP-00004', sale_timestamp: new Date(now.getTime() - 86400000 * 4) },
    { sale_id: 'sale-00005', customer_name: 'Ngozi', item_id: 'i008', item_name: 'Cabin Biscuits', quantity_sold: 10, unit_price: 200.00, total_amount: 2000.00, payment_method: 'Debit Card', receipt_number: 'RCP-00005', sale_timestamp: new Date(now.getTime() - 86400000 * 5) },
  ];

  try {
    console.log('Clearing existing data...');
    await pool.query('DELETE FROM sales');
    await pool.query('DELETE FROM inventory_items');
    await pool.query('DELETE FROM categories');
    await pool.query('DELETE FROM stores');
    await pool.query('DELETE FROM profiles');
    await pool.query('DELETE FROM users');

    console.log('Seeding users, profile and store...');
    await pool.query('INSERT INTO users (user_id, username, email, password, account_status, created_date) VALUES (?, ?, ?, ?, ?, ?)', [userId, 'admin', 'admin@jemima.store', password, 'Active', now]);
    await pool.query('INSERT INTO profiles (user_id, full_name, job_title, phone_number, date_modified) VALUES (?, ?, ?, ?, ?)', [userId, 'Jemima Store Admin', 'Store Owner', '+234 801 234 5678', now]);
    await pool.query('INSERT INTO stores (store_id, user_id, store_name, store_description, store_address, store_phone, store_email, base_currency, currency_symbol, timezone, date_created, date_modified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [storeId, userId, 'Jemima Provision Store', 'Your one-stop shop for quality provisions', '12 Market Street, Lagos, Nigeria', '+234 801 234 5678', 'info@jemima.store', 'NGN', '₦', 'UTC+1 (West Africa Time)', now, now]);

    console.log('Seeding categories...');
    for (const category of categories) {
      await pool.query('INSERT INTO categories (category_id, user_id, category_name, description, date_created) VALUES (?, ?, ?, ?, ?)', [category.category_id, userId, category.category_name, category.description, now]);
    }

    console.log('Seeding inventory items...');
    for (const item of inventoryItems) {
      await pool.query('INSERT INTO inventory_items (item_id, user_id, product_name, category_id, category_name, unit_price, quantity_current, quantity_initial, description, item_status, date_added, date_modified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [item.item_id, userId, item.product_name, item.category_id, item.category_name, item.unit_price, item.quantity_current, item.quantity_initial, item.description, 'Active', now, now]);
    }

    console.log('Seeding sales records...');
    for (const sale of sales) {
      await pool.query('INSERT INTO sales (sale_id, user_id, customer_name, item_id, item_name, quantity_sold, unit_price, total_amount, payment_method, sale_timestamp, receipt_number, transaction_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [sale.sale_id, userId, sale.customer_name, sale.item_id, sale.item_name, sale.quantity_sold, sale.unit_price, sale.total_amount, sale.payment_method, sale.sale_timestamp, sale.receipt_number, 'Completed']);
    }

    console.log('Seed data inserted successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed database:', error);
    process.exit(1);
  }
}

seed();
