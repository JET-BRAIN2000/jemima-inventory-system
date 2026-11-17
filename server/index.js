const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

function assertRows(rows) { return Array.isArray(rows) ? rows : []; }

// Utility to run queries
async function query(sql, params=[]) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

// --- Auth ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    const existing = await query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existing.length) return res.status(409).json({ error: 'Username or email already exists' });

    const userId = `u${Date.now()}`;
    const hashed = await bcrypt.hash(password, 10);
    const now = new Date();
    await query('INSERT INTO users (user_id, username, email, password, account_status, created_date) VALUES (?, ?, ?, ?, ?, ?)', [userId, username, email, hashed, 'Active', now]);
    await query('INSERT INTO profiles (user_id, full_name, job_title, phone_number, date_of_birth, address, profile_picture_path, date_modified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [userId, username, 'Store Owner', null, null, null, null, now]);
    await query('INSERT INTO stores (store_id, user_id, store_name, store_description, store_address, store_phone, store_email, base_currency, currency_symbol, timezone, date_created, date_modified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [`s${Date.now()}`, userId, `${username}'s Store`, '', '', '', email, 'USD', '$', 'UTC+0', now, now]);

    const token = jwt.sign({ user_id: userId, username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user_id: userId, username });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

    const rows = await query('SELECT * FROM users WHERE username = ?', [username]);
    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = rows[0];

    const match = await bcrypt.compare(password, user.password).catch(() => false);
    const ok = match || (user.password === password);
    if (!ok) {
      // Log failed login attempt
      try {
        await query(
          'INSERT INTO security_logs (log_id, user_id, event_type, event_description, ip_address, user_agent, event_timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [`sl${Date.now()}`, user.user_id, 'failed_login', 'Failed login attempt - incorrect password', req.ip || null, req.headers['user-agent'] || null, new Date()]
        );
      } catch (logErr) { console.error('Failed to log security event:', logErr.message); }

      return res.status(401).json({ error: 'Invalid password' });
    }

    const now = new Date();
    await query('UPDATE users SET last_login = ? WHERE user_id = ?', [now, user.user_id]);

    // Log successful login
    try {
      await query(
        'INSERT INTO security_logs (log_id, user_id, event_type, event_description, ip_address, user_agent, event_timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [`sl${Date.now()}`, user.user_id, 'login', 'Successful login', req.ip || null, req.headers['user-agent'] || null, now]
      );
    } catch (logErr) { console.error('Failed to log security event:', logErr.message); }

    const token = jwt.sign({ user_id: user.user_id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user_id: user.user_id, username: user.username });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const rows = await query('SELECT user_id, username, email, account_status, created_date, last_login, password_changed_at FROM users WHERE user_id = ?', [userId]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/auth/change-password', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ error: 'Missing fields' });

    if (new_password.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });

    const rows = await query('SELECT * FROM users WHERE user_id = ?', [userId]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    const user = rows[0];

    const match = await bcrypt.compare(current_password, user.password).catch(() => false);
    const ok = match || (user.password === current_password);
    if (!ok) {
      // Log failed password change attempt
      try {
        await query(
          'INSERT INTO security_logs (log_id, user_id, event_type, event_description, ip_address, user_agent, event_timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [`sl${Date.now()}`, userId, 'password_change', 'Failed password change - current password incorrect', req.ip || null, req.headers['user-agent'] || null, new Date()]
        );
      } catch (logErr) { console.error('Failed to log security event:', logErr.message); }

      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const now = new Date();
    const hashed = await bcrypt.hash(new_password, 10);

    // Update password and password_changed_at timestamp in users table
    await query('UPDATE users SET password = ?, password_changed_at = ? WHERE user_id = ?', [hashed, now, userId]);

    // Log successful password change in security_logs
    try {
      await query(
        'INSERT INTO security_logs (log_id, user_id, event_type, event_description, ip_address, user_agent, event_timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [`sl${Date.now() + 1}`, userId, 'password_change', 'Password changed successfully', req.ip || null, req.headers['user-agent'] || null, now]
      );
    } catch (logErr) { console.error('Failed to log security event:', logErr.message); }

    res.json({ ok: true, message: 'Password changed successfully', password_changed_at: now });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// --- Security logs endpoint ---
app.get('/api/security-logs', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const limit = parseInt(req.query.limit) || 20;
    const rows = await query(
      'SELECT log_id, event_type, event_description, ip_address, event_timestamp FROM security_logs WHERE user_id = ? ORDER BY event_timestamp DESC LIMIT ?',
      [userId, limit]
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// --- Middleware to protect routes ---
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing auth' });
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'Invalid auth' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) { return res.status(401).json({ error: 'Invalid token' }); }
}

// --- Inventory endpoints ---
app.get('/api/inventory', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const rows = await query('SELECT * FROM inventory_items WHERE user_id = ? AND item_status = "Active"', [userId]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/inventory', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { product_name, category_id, category_name, unit_price, quantity_initial, description } = req.body;
    const itemId = `i${Date.now()}`;
    const now = new Date();
    await query('INSERT INTO inventory_items (item_id, user_id, product_name, category_id, category_name, unit_price, quantity_current, quantity_initial, description, item_status, date_added, date_modified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [itemId, userId, product_name, category_id || null, category_name || null, unit_price || 0, quantity_initial || 0, quantity_initial || 0, description || '', 'Active', now, now]);
    res.json({ item_id: itemId });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

app.put('/api/inventory/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const id = req.params.id;
    const fields = req.body;
    const now = new Date();
    // Build update
    const sets = [];
    const vals = [];
    for (const k of Object.keys(fields)) { sets.push(`${k} = ?`); vals.push(fields[k]); }
    sets.push('date_modified = ?'); vals.push(now);
    vals.push(id, userId);
    const sql = `UPDATE inventory_items SET ${sets.join(', ')} WHERE item_id = ? AND user_id = ?`;
    await query(sql, vals);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

app.delete('/api/inventory/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id; const id = req.params.id;
    await query('UPDATE inventory_items SET item_status = ?, date_modified = ? WHERE item_id = ? AND user_id = ?', ['Inactive', new Date(), id, userId]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// --- Categories ---
app.get('/api/categories', authMiddleware, async (req, res) => {
  try { const userId = req.user.user_id; const rows = await query('SELECT * FROM categories WHERE user_id = ?', [userId]); res.json(rows); } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/categories', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { category_name, description } = req.body;
    if (!category_name) return res.status(400).json({ error: 'Category name is required' });
    const categoryId = `c${Date.now()}`;
    const now = new Date();
    await query('INSERT INTO categories (category_id, user_id, category_name, description, date_created) VALUES (?, ?, ?, ?, ?)', [categoryId, userId, category_name, description || '', now]);
    res.json({ category_id: categoryId, category_name, description: description || '' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// --- Sales ---
app.get('/api/sales', authMiddleware, async (req, res) => {
  try { const userId = req.user.user_id; const rows = await query('SELECT * FROM sales WHERE user_id = ? ORDER BY sale_timestamp DESC', [userId]); res.json(rows); } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/sales', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { customer_name, item_id, item_name, quantity_sold, unit_price, total_amount, payment_method, receipt_number } = req.body;
    const saleId = `sale-${Date.now()}`;
    const now = new Date();
    await query('INSERT INTO sales (sale_id, user_id, customer_name, item_id, item_name, quantity_sold, unit_price, total_amount, payment_method, sale_timestamp, receipt_number, transaction_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [saleId, userId, customer_name || '', item_id || null, item_name || '', quantity_sold || 0, unit_price || 0, total_amount || 0, payment_method || 'Cash', now, receipt_number || '', 'Completed']);
    // Deduct inventory quantity
    if (item_id) {
      await query('UPDATE inventory_items SET quantity_current = GREATEST(quantity_current - ?, 0), date_modified = ? WHERE item_id = ? AND user_id = ?', [quantity_sold || 0, now, item_id, userId]);
    }
    res.json({ sale_id: saleId });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// --- Profile endpoints ---
// Helper: normalise profile row for the frontend (null → empty string, date → YYYY-MM-DD)
function normaliseProfile(row) {
  if (!row) return null;
  const p = { ...row };
  // Convert date objects/strings to YYYY-MM-DD or '' if null/sentinel
  if (p.date_of_birth) {
    const d = new Date(p.date_of_birth);
    const iso = d.toISOString().split('T')[0]; // 'YYYY-MM-DD'
    p.date_of_birth = (iso === '1900-01-01') ? '' : iso;
  } else {
    p.date_of_birth = '';
  }
  // Ensure string fields are never null for the frontend
  p.phone_number = p.phone_number || '';
  p.address = p.address || '';
  p.profile_picture_path = p.profile_picture_path || '';
  p.full_name = p.full_name || '';
  return p;
}

app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const rows = await query('SELECT * FROM profiles WHERE user_id = ?', [userId]);
    res.json(normaliseProfile(rows[0]));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

app.put('/api/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Only allow specific profile fields to be updated (security: block user_id changes)
    const allowedFields = [
      'full_name', 'job_title', 'phone_number', 'date_of_birth',
      'address', 'profile_picture_path'
    ];
    const fields = Object.keys(req.body)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        const val = req.body[key];
        // date_of_birth, address, profile_picture_path are nullable — store NULL when empty
        if (key === 'date_of_birth') {
          obj[key] = (!val || val === '') ? null : val;
        } else if (key === 'address' || key === 'profile_picture_path') {
          obj[key] = (!val || val === '') ? null : val;
        } else {
          // full_name, job_title, phone_number — store empty string rather than null
          obj[key] = (val === undefined || val === null) ? '' : val;
        }
        return obj;
      }, {});

    if (!Object.keys(fields).length) {
      return res.status(400).json({ error: 'No valid profile fields provided' });
    }

    const now = new Date();
    const sets = [];
    const vals = [];

    for (const k of Object.keys(fields)) {
      sets.push(`${k} = ?`);
      vals.push(fields[k]);
    }
    sets.push('date_modified = ?');
    vals.push(now);
    vals.push(userId);

    const sql = `UPDATE profiles SET ${sets.join(', ')} WHERE user_id = ?`;
    await query(sql, vals);

    // Return the normalised profile so the frontend gets consistent values
    const updatedRows = await query('SELECT * FROM profiles WHERE user_id = ?', [userId]);
    const updatedProfile = normaliseProfile(updatedRows[0]);

    res.json({ ok: true, profile: updatedProfile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Store endpoints ---
app.get('/api/store', authMiddleware, async (req, res) => {
  try { const userId = req.user.user_id; const rows = await query('SELECT * FROM stores WHERE user_id = ?', [userId]); res.json(rows[0] || null); } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

app.put('/api/store', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const allowedFields = [
      'store_name', 'store_description', 'store_address', 'store_phone',
      'store_email', 'store_logo_path', 'base_currency', 'currency_symbol',
      'timezone', 'date_modified'
    ];
    const fields = Object.keys(req.body)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => ({ ...obj, [key]: req.body[key] }), {});

    if (!Object.keys(fields).length) {
      return res.status(400).json({ error: 'No valid store fields provided' });
    }

    const now = new Date();
    const sets = [];
    const vals = [];

    for (const k of Object.keys(fields)) {
      sets.push(`${k} = ?`);
      vals.push(fields[k]);
    }
    sets.push('date_modified = ?');
    vals.push(now);
    vals.push(userId);

    const sql = `UPDATE stores SET ${sets.join(', ')} WHERE user_id = ?`;
    await query(sql, vals);
    const updatedStore = await query('SELECT * FROM stores WHERE user_id = ?', [userId]);
    res.json({ ok: true, store: updatedStore[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server running on port ${port}`));
