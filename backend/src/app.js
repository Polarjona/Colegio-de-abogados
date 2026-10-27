const express = require('express');
const cors = require('cors');
const { pool } = require('./db');
const { comparePassword, createToken, hashPassword, requireAuth } = require('./auth');
const { sendToDevices } = require('./firebase');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

app.get('/', (req, res) => {
  res.json({ message: 'Marco Legal API funcionando' });
});

app.get('/health', async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'OK',
      message: 'Backend funcionando correctamente'
    });
  } catch (error) {
    next(error);
  }
});

app.post('/register', async (req, res, next) => {
  const { email, password, name } = req.body || {};
  if (!isNonEmptyString(email) || !isNonEmptyString(password) || password.length < 8) {
    return res.status(400).json({
      error: 'email and password are required; password must contain at least 8 characters'
    });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const passwordHash = await hashPassword(password);
    const result = await client.query(
      `INSERT INTO users (email, name, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, created_at`,
      [email.trim().toLowerCase(), isNonEmptyString(name) ? name.trim() : null, passwordHash]
    );
    const user = result.rows[0];
    await client.query(
      'INSERT INTO preferences (user_id) VALUES ($1)',
      [user.id]
    );
    await client.query('COMMIT');
    res.status(201).json({ user, token: createToken(user) });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    if (error.code === '23505') {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }
    next(error);
  } finally {
    if (client) {
      client.release();
    }
  }
});

app.post('/login', async (req, res, next) => {
  const { email, password } = req.body || {};
  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT id, email, name, password_hash, created_at FROM users WHERE email = $1',
      [email.trim().toLowerCase()]
    );
    const user = result.rows[0];
    if (!user || !(await comparePassword(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    delete user.password_hash;
    res.json({ user, token: createToken(user) });
  } catch (error) {
    next(error);
  }
});

app.get('/news', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, title, summary, content, source_url, published_at
       FROM news
       WHERE published_at <= NOW()
       ORDER BY published_at DESC
       LIMIT 50`
    );
    res.json({ news: result.rows });
  } catch (error) {
    next(error);
  }
});

app.get('/preferences', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT email_notifications, push_notifications, categories
       FROM preferences WHERE user_id = $1`,
      [req.user.sub]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Preferences not found' });
    }
    res.json({ preferences: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

app.put('/preferences', requireAuth, async (req, res, next) => {
  const { emailNotifications, pushNotifications, categories } = req.body || {};
  if (
    typeof emailNotifications !== 'boolean' ||
    typeof pushNotifications !== 'boolean' ||
    !Array.isArray(categories) ||
    categories.some((category) => typeof category !== 'string')
  ) {
    return res.status(400).json({
      error: 'emailNotifications, pushNotifications, and categories are required'
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO preferences (user_id, email_notifications, push_notifications, categories)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET
         email_notifications = EXCLUDED.email_notifications,
         push_notifications = EXCLUDED.push_notifications,
         categories = EXCLUDED.categories,
         updated_at = NOW()
       RETURNING email_notifications, push_notifications, categories`,
      [req.user.sub, emailNotifications, pushNotifications, categories]
    );
    res.json({ preferences: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

app.post('/notifications/send', requireAuth, async (req, res, next) => {
  const { title, body, data } = req.body || {};
  if (!isNonEmptyString(title) || !isNonEmptyString(body)) {
    return res.status(400).json({ error: 'title and body are required' });
  }

  try {
    const result = await pool.query(
      'SELECT token FROM device_tokens WHERE active = TRUE'
    );
    if (result.rows.length === 0) {
      return res.status(200).json({ sent: 0, failed: 0 });
    }

    const response = await sendToDevices(
      result.rows.map((row) => row.token),
      { title: title.trim(), body: body.trim(), ...(data ? { data } : {}) }
    );
    res.json({ sent: response.successCount, failed: response.failureCount });
  } catch (error) {
    if (error.message === 'Firebase Cloud Messaging is not configured') {
      return res.status(503).json({ error: error.message });
    }
    next(error);
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
