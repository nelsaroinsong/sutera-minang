import crypto from 'node:crypto';

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function toUserProfile(row) {
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    phone: row.phone || '',
    spice_preference: row.spice_preference || 'normal',
    default_notes: row.default_notes || '',
    role: row.role,
  };
}

function toMenuItem(row) {
  return {
    id: row.id,
    category_id: row.category_id,
    item_number: row.item_number,
    name: row.name,
    description: row.description || '',
    price: row.price,
    is_available: Boolean(row.is_available),
    is_signature: Boolean(row.is_signature),
    badge: row.badge || null,
    image_url: row.image_url || undefined,
  };
}

async function handleApiRequest(req, res) {
  const urlObj = new URL(req.url, 'http://localhost');
  const pathname = urlObj.pathname;
  const method = (req.method || 'GET').toUpperCase();

  const { getDb, hashPassword, verifyPassword } = await import('./db.mjs');
  const db = await getDb();

  // Auth: Sign Up Customer
  if (pathname === '/api/auth/signup' && method === 'POST') {
    const body = await readJsonBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const fullName = String(body.full_name || '').trim();
    const phone = String(body.phone || '').trim();

    if (!email || !password || !fullName) {
      return sendJson(res, 400, { error: 'Nama lengkap, email, dan kata sandi wajib diisi.' });
    }
    if (password.length < 6) {
      return sendJson(res, 400, { error: 'Kata sandi minimal 6 karakter.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return sendJson(res, 409, {
        error: 'Email sudah terdaftar. Silakan masuk dengan akun Anda.',
      });
    }

    const id = `usr_${crypto.randomUUID()}`;
    const passwordHash = hashPassword(password);

    db.prepare(
      'INSERT INTO users (id, email, password_hash, full_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, email, passwordHash, fullName, phone, 'user');

    const created = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return sendJson(res, 201, { user: toUserProfile(created) });
  }

  // Auth: Sign In Customer
  if (pathname === '/api/auth/signin' && method === 'POST') {
    const body = await readJsonBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return sendJson(res, 401, {
        error: 'Email atau kata sandi salah. Silakan periksa kembali atau daftar akun baru.',
      });
    }

    if (user.role === 'admin') {
      return sendJson(res, 403, {
        error: 'Akun ini adalah akun Admin. Silakan masuk melalui Portal Admin.',
      });
    }

    return sendJson(res, 200, { user: toUserProfile(user) });
  }

  // Auth: Admin Portal Sign In
  if (pathname === '/api/auth/admin' && method === 'POST') {
    const body = await readJsonBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return sendJson(res, 401, {
        error: 'Kredensial Admin tidak valid. Gunakan akun resmi Admin Rumah Makan.',
      });
    }

    if (user.role !== 'admin') {
      return sendJson(res, 403, {
        error: 'Akun ini terdaftar sebagai Pembeli, bukan Admin Rumah Makan.',
      });
    }

    return sendJson(res, 200, { user: toUserProfile(user) });
  }

  // Auth: Update Profile
  if (pathname === '/api/auth/profile' && method === 'PUT') {
    const body = await readJsonBody(req);
    const id = String(body.id || '');
    if (!id) {
      return sendJson(res, 400, { error: 'User ID diperlukan.' });
    }

    const fullName = String(body.full_name || '').trim();
    const phone = String(body.phone || '').trim();
    const spicePref = String(body.spice_preference || 'normal');
    const defaultNotes = String(body.default_notes || '').trim();

    db.prepare(
      'UPDATE users SET full_name = ?, phone = ?, spice_preference = ?, default_notes = ? WHERE id = ?'
    ).run(fullName, phone, spicePref, defaultNotes, id);

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!updated) {
      return sendJson(res, 404, { error: 'Pengguna tidak ditemukan.' });
    }

    return sendJson(res, 200, { user: toUserProfile(updated) });
  }

  // Categories
  if (pathname === '/api/categories' && method === 'GET') {
    const rows = db.prepare('SELECT * FROM categories ORDER BY display_order ASC').all();
    return sendJson(res, 200, { categories: rows });
  }

  // Menu Items: List & Create
  if (pathname === '/api/menu-items' && method === 'GET') {
    const rows = db.prepare('SELECT * FROM menu_items ORDER BY item_number ASC').all();
    return sendJson(res, 200, { items: rows.map(toMenuItem) });
  }

  if (pathname === '/api/menu-items' && method === 'POST') {
    const body = await readJsonBody(req);
    const id = `m_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`;
    db.prepare(
      'INSERT INTO menu_items (id, category_id, item_number, name, description, price, is_available, is_signature, badge, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      id,
      body.category_id,
      body.item_number ?? 99,
      body.name,
      body.description || '',
      Number(body.price) || 0,
      body.is_available === false ? 0 : 1,
      body.is_signature ? 1 : 0,
      body.badge || null,
      body.image_url || null
    );
    const created = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
    return sendJson(res, 201, { item: toMenuItem(created) });
  }

  // Menu Items: Update & Delete
  const menuMatch = pathname.match(/^\/api\/menu-items\/([^/]+)$/);
  if (menuMatch) {
    const itemId = decodeURIComponent(menuMatch[1]);
    if (method === 'PATCH') {
      const body = await readJsonBody(req);
      const existing = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(itemId);
      if (!existing) return sendJson(res, 404, { error: 'Menu tidak ditemukan.' });

      db.prepare(
        `UPDATE menu_items SET
          category_id = ?,
          item_number = ?,
          name = ?,
          description = ?,
          price = ?,
          is_available = ?,
          is_signature = ?,
          badge = ?,
          image_url = ?
        WHERE id = ?`
      ).run(
        body.category_id ?? existing.category_id,
        body.item_number ?? existing.item_number,
        body.name ?? existing.name,
        body.description ?? existing.description,
        body.price !== undefined ? Number(body.price) : existing.price,
        body.is_available !== undefined ? (body.is_available ? 1 : 0) : existing.is_available,
        body.is_signature !== undefined ? (body.is_signature ? 1 : 0) : existing.is_signature,
        body.badge !== undefined ? body.badge || null : existing.badge,
        body.image_url !== undefined ? body.image_url || null : existing.image_url,
        itemId
      );
      const updated = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(itemId);
      return sendJson(res, 200, { item: toMenuItem(updated) });
    }

    if (method === 'DELETE') {
      db.prepare('DELETE FROM menu_items WHERE id = ?').run(itemId);
      return sendJson(res, 200, { ok: true });
    }
  }

  // Orders: List & Create
  if (pathname === '/api/orders' && method === 'GET') {
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    const result = orders.map((o) => ({
      ...o,
      notes: o.notes || undefined,
      table_number: o.table_number || undefined,
      customer_phone: o.customer_phone || undefined,
      updated_at: o.updated_at || undefined,
      items: getItems.all(o.id),
    }));
    return sendJson(res, 200, { orders: result });
  }

  if (pathname === '/api/orders' && method === 'POST') {
    const body = await readJsonBody(req);
    const id = `ord_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`;
    const orderCode = `SM-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();
    const isCash = body.payment_method === 'cash';
    const paymentMethod = body.payment_method || (isCash ? 'cash' : 'qris');
    const paymentStatus = body.payment_status || (isCash ? 'unpaid' : 'paid');

    db.exec('BEGIN');
    try {
      db.prepare(
        `INSERT INTO orders (id, order_code, order_type, table_number, customer_name, customer_phone, status, payment_method, payment_status, total_amount, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        orderCode,
        body.order_type || 'dine_in',
        body.table_number || null,
        body.customer_name,
        body.customer_phone || null,
        paymentMethod,
        paymentStatus,
        Number(body.total_amount) || 0,
        body.notes || null,
        now,
        now
      );

      const insertItem = db.prepare(
        'INSERT INTO order_items (id, order_id, menu_item_id, item_name, price, quantity, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      const items = Array.isArray(body.items) ? body.items : [];
      for (const it of items) {
        insertItem.run(
          `oi_${crypto.randomUUID()}`,
          id,
          it.menu_item_id || null,
          it.item_name,
          Number(it.price) || 0,
          Number(it.quantity) || 1,
          it.notes || null
        );
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
    return sendJson(res, 201, { order: { ...order, items: orderItems } });
  }

  // Orders: Update status
  const statusMatch = pathname.match(/^\/api\/orders\/([^/]+)\/status$/);
  if (statusMatch && method === 'PATCH') {
    const orderId = decodeURIComponent(statusMatch[1]);
    const body = await readJsonBody(req);
    const now = new Date().toISOString();
    db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(
      body.status,
      now,
      orderId
    );
    return sendJson(res, 200, { ok: true });
  }

  // Orders: Update payment
  const paymentMatch = pathname.match(/^\/api\/orders\/([^/]+)\/payment$/);
  if (paymentMatch && method === 'PATCH') {
    const orderId = decodeURIComponent(paymentMatch[1]);
    const body = await readJsonBody(req);
    const now = new Date().toISOString();
    if (body.payment_method) {
      db.prepare(
        'UPDATE orders SET payment_status = ?, payment_method = ?, updated_at = ? WHERE id = ?'
      ).run(body.payment_status, body.payment_method, now, orderId);
    } else {
      db.prepare('UPDATE orders SET payment_status = ?, updated_at = ? WHERE id = ?').run(
        body.payment_status,
        now,
        orderId
      );
    }
    return sendJson(res, 200, { ok: true });
  }

  return sendJson(res, 404, { error: `Endpoint tidak ditemukan: ${method} ${pathname}` });
}

export function sqliteApiPlugin() {
  const attachMiddleware = (server) => {
    server.middlewares.use('/api', (req, res, next) => {
      // Restore full /api prefix for URL routing
      req.url = `/api${req.url === '/' ? '' : req.url}`;
      handleApiRequest(req, res).catch((err) => {
        console.error('[SQLite API Error]', err);
        sendJson(res, 500, { error: err?.message || 'Terjadi kesalahan pada server SQLite.' });
      });
    });
  };

  return {
    name: 'sqlite-api-plugin',
    configureServer: attachMiddleware,
    configurePreviewServer: attachMiddleware,
  };
}
