import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import path from 'node:path';

const DB_PATH = path.resolve(process.cwd(), 'database.sqlite');

let dbInstance = null;

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, keyHex] = storedHash.split(':');
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

const SEED_CATEGORIES = [
  {
    id: 'c1',
    name: 'Makanan Utama',
    slug: 'makanan-utama',
    subtitle: 'Hidangan Tradisi Istimewa • 12 Pilihan Pusaka Ranah Minang',
    display_order: 1,
  },
  {
    id: 'c2',
    name: 'Minuman Tradisional',
    slug: 'minuman-tradisional',
    subtitle: 'Koleksi Penyejuk & Warisan Ranah • Sajian Pengantar Penawar Rempah',
    display_order: 2,
  },
];

const SEED_MENU_ITEMS = [
  { id: 'm1', category_id: 'c1', item_number: 1, name: 'Rendang Daging', description: 'Daging sapi pilihan dimasak perlahan rempah 8 jam, karamelisasi sempurna.', price: 18000, is_available: 1, is_signature: 1, badge: 'WARISAN PUSAKA', image_url: '/assets/menu/rendang-daging.jpg' },
  { id: 'm2', category_id: 'c1', item_number: 2, name: 'Dendeng Balado', description: 'Irisan daging renyah dengan sambal balado cabai merah uleg segar.', price: 18000, is_available: 1, is_signature: 1, badge: 'FAVORIT', image_url: '/assets/menu/dendeng-balado.jpg' },
  { id: 'm3', category_id: 'c1', item_number: 3, name: 'Ayam Pop', description: 'Ayam kampung lembut gurih bumbu rempah kelapa, disajikan khas kuah orisinal.', price: 15000, is_available: 1, is_signature: 0, badge: 'KLASIK', image_url: '/assets/menu/ayam-pop.jpg' },
  { id: 'm4', category_id: 'c1', item_number: 4, name: 'Ayam Gulai', description: 'Ayam empuk dimasak kuah santan kuning rempah kaya aroma serai & kunyit.', price: 15000, is_available: 1, is_signature: 0, badge: null, image_url: '/assets/menu/ayam-gulai.jpg' },
  { id: 'm5', category_id: 'c1', item_number: 5, name: 'Gulai Tunjang', description: 'Kikil sapi kenyal lembut dalam rendaman kuah gulai pedas gurih pekat.', price: 20000, is_available: 1, is_signature: 1, badge: 'REMPAH PEKAT', image_url: '/assets/menu/gulai-tunjang.jpg' },
  { id: 'm6', category_id: 'c1', item_number: 6, name: 'Gulai Kepala Ikan', description: 'Kepala kakap segar dengan kuah gulai asam pedas beraroma ruku-ruku.', price: 35000, is_available: 1, is_signature: 1, badge: 'SPECIAL CHEF', image_url: '/assets/menu/gulai-kepala-ikan.jpg' },
  { id: 'm7', category_id: 'c1', item_number: 7, name: 'Ikan Asam Padeh', description: 'Ikan segar berkuah merah segar asam pedas tanpa santan khas Darek.', price: 16000, is_available: 1, is_signature: 0, badge: 'KHAS DAREK', image_url: '/assets/menu/ikan-asam-padeh.jpg' },
  { id: 'm8', category_id: 'c1', item_number: 8, name: 'Telur Balado', description: 'Telur rebus goreng berselimut sambal balado pedas manis gurih.', price: 8000, is_available: 1, is_signature: 0, badge: null, image_url: '/assets/menu/telur-balado.jpg' },
  { id: 'm9', category_id: 'c1', item_number: 9, name: 'Gulai Cincang', description: 'Daging & tetelan sapi cincang bumbu rempah pekat berkaldu mantap.', price: 18000, is_available: 1, is_signature: 0, badge: null, image_url: '/assets/menu/gulai-cincang.jpg' },
  { id: 'm10', category_id: 'c1', item_number: 10, name: 'Sate Padang', description: 'Daging & lidah sapi kuah kental rempah kari kuning khas Pariaman.', price: 18000, is_available: 1, is_signature: 0, badge: 'PARIAMAN', image_url: '/assets/menu/sate-padang.jpg' },
  { id: 'm11', category_id: 'c1', item_number: 11, name: 'Perkedel Kentang', description: 'Olahan kentang lembut berbumbu seledri dan daging cincang goreng renyah.', price: 5000, is_available: 1, is_signature: 0, badge: null, image_url: '/assets/menu/perkedel-kentang.jpg' },
  { id: 'm12', category_id: 'c1', item_number: 12, name: 'Sambal Ijo', description: 'Ulekan cabai hijau pilihan, tomat hijau, dan minyak kelapa gurih khas.', price: 4000, is_available: 1, is_signature: 0, badge: 'TRADISIONAL', image_url: '/assets/menu/sambal-ijo.jpg' },
  { id: 'd1', category_id: 'c2', item_number: 1, name: 'Teh Talua', description: 'Racikan teh hitam pekat dikocok kuning telur bebek & perasan jeruk nipis (Signature 5 Lapis).', price: 12000, is_available: 1, is_signature: 1, badge: 'SIGNATURE DELICACY', image_url: '/assets/menu/teh-talua.jpg' },
  { id: 'd2', category_id: 'c2', item_number: 2, name: 'Kopi Talua', description: 'Kopi robusta Bukittinggi berbusa lembut kocokan telur khas Ranah Minang.', price: 14000, is_available: 1, is_signature: 1, badge: 'WARISAN IKONIK', image_url: '/assets/menu/kopi-talua.jpg' },
  { id: 'd3', category_id: 'c2', item_number: 3, name: 'Es Teh Manis', description: 'Daun teh melati wangi pilihan dengan gula tebu asli dingin menyegarkan.', price: 5000, is_available: 1, is_signature: 0, badge: null, image_url: '/assets/menu/es-teh-manis.jpg' },
  { id: 'd4', category_id: 'c2', item_number: 4, name: 'Es Jeruk', description: 'Perasan murni jeruk segar manis asam alami dengan es serut.', price: 7000, is_available: 1, is_signature: 0, badge: null, image_url: '/assets/menu/es-jeruk.jpg' },
  { id: 'd5', category_id: 'c2', item_number: 5, name: 'Jeruk Nipis Hangat', description: 'Air perasan jeruk nipis segar murni penyeimbang hidangan gurih berempah.', price: 7000, is_available: 1, is_signature: 0, badge: 'PENYEIMBANG REMPAH', image_url: '/assets/menu/jeruk-nipis-hangat.jpg' },
  { id: 'd6', category_id: 'c2', item_number: 6, name: 'Kopi Hitam', description: 'Seduhan kopi tubruk pekat aromatik khas dataran tinggi Minangkabau.', price: 5000, is_available: 1, is_signature: 0, badge: null, image_url: '/assets/menu/kopi-hitam.jpg' },
  { id: 'd7', category_id: 'c2', item_number: 7, name: 'Teh Manis Hangat', description: 'Teh tubruk hangat aromatik menenangkan pendamping hidangan berempah.', price: 4000, is_available: 1, is_signature: 0, badge: null, image_url: '/assets/menu/teh-manis-hangat.jpg' },
  { id: 'd8', category_id: 'c2', item_number: 8, name: 'Es Cincau', description: 'Potongan cincau hitam kenyal dengan sirup pandan wangi & santan gurih.', price: 7000, is_available: 1, is_signature: 0, badge: 'SEGAR GURIH', image_url: '/assets/menu/es-cincau.jpg' },
];

export function getDb() {
  if (dbInstance) return dbInstance;

  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      spice_preference TEXT DEFAULT 'normal',
      default_notes TEXT DEFAULT '',
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      subtitle TEXT,
      display_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      item_number INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      is_available INTEGER DEFAULT 1,
      is_signature INTEGER DEFAULT 0,
      badge TEXT,
      image_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_code TEXT UNIQUE NOT NULL,
      order_type TEXT NOT NULL,
      table_number TEXT,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_method TEXT DEFAULT 'qris',
      payment_status TEXT DEFAULT 'paid',
      total_amount INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      menu_item_id TEXT,
      item_name TEXT NOT NULL,
      price INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  const catCount = db.prepare('SELECT COUNT(*) AS cnt FROM categories').get().cnt;
  if (catCount === 0) {
    const insertCat = db.prepare(
      'INSERT INTO categories (id, name, slug, subtitle, display_order) VALUES (?, ?, ?, ?, ?)'
    );
    for (const c of SEED_CATEGORIES) {
      insertCat.run(c.id, c.name, c.slug, c.subtitle, c.display_order);
    }
  }

  const menuCount = db.prepare('SELECT COUNT(*) AS cnt FROM menu_items').get().cnt;
  if (menuCount === 0) {
    const insertMenu = db.prepare(
      'INSERT INTO menu_items (id, category_id, item_number, name, description, price, is_available, is_signature, badge, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    for (const m of SEED_MENU_ITEMS) {
      insertMenu.run(
        m.id,
        m.category_id,
        m.item_number,
        m.name,
        m.description,
        m.price,
        m.is_available,
        m.is_signature,
        m.badge,
        m.image_url
      );
    }
  }

  const adminCount = db
    .prepare("SELECT COUNT(*) AS cnt FROM users WHERE role = 'admin'")
    .get().cnt;
  if (adminCount === 0) {
    const insertUser = db.prepare(
      'INSERT INTO users (id, email, password_hash, full_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)'
    );
    insertUser.run(
      'admin_master_01',
      'admin@suteraminang.com',
      hashPassword('admin123'),
      'Administrator Sutera Minang',
      '',
      'admin'
    );
    insertUser.run(
      'admin_master_02',
      'admin@padang.com',
      hashPassword('suteraminang123'),
      'Administrator Sutera Minang',
      '',
      'admin'
    );
  }

  dbInstance = db;
  return dbInstance;
}
