-- ==============================================================================
-- SUTERA MINANG: Haute Gastronomy Ordering App
-- Supabase PostgreSQL Schema & Initial Seed Data
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean Drop if exists (optional reset)
-- DROP TABLE IF EXISTS order_items CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS menu_items CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subtitle TEXT,
  display_order INT DEFAULT 0
);

-- 4. Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  item_number INT,
  name TEXT NOT NULL,
  description TEXT,
  price INT NOT NULL, -- in IDR (e.g., 18000)
  is_available BOOLEAN DEFAULT true,
  is_signature BOOLEAN DEFAULT false,
  badge TEXT, -- e.g. 'SIGNATURE DELICACY', '100% HALAL', 'FAVORIT'
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code TEXT UNIQUE NOT NULL, -- e.g. 'SM-1042'
  order_type TEXT NOT NULL CHECK (order_type IN ('dine_in', 'takeaway')),
  table_number TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'cooking', 'ready', 'completed', 'cancelled')),
  total_amount INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  item_name TEXT NOT NULL,
  price INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  notes TEXT
);

-- 7. Realtime Enablement
-- Allow clients to listen to changes on orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'order_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
  END IF;
END $$;

-- 8. Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Permissive public policies for ordering app demo
CREATE POLICY "Public can read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public can read menu_items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Public can insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Public can update orders" ON orders FOR UPDATE USING (true);
CREATE POLICY "Public can insert order items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read order items" ON order_items FOR SELECT USING (true);

-- Admin can manage menu items
CREATE POLICY "Public can update menu items" ON menu_items FOR ALL USING (true);

-- ==============================================================================
-- 9. SEED DATA (Sutera Minang Exact Menu from Image)
-- ==============================================================================

-- Clear existing data if re-running
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM menu_items;
DELETE FROM categories;

-- Insert Categories
INSERT INTO categories (id, name, slug, subtitle, display_order) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Makanan Utama', 'makanan-utama', 'Hidangan Tradisi Istimewa (12 Pilihan Pusaka Ranah Minang)', 1),
  ('c2000000-0000-0000-0000-000000000002', 'Minuman Tradisional', 'minuman-tradisional', 'Koleksi Penyejuk & Warisan Ranah (Sajian Pengantar Penawar Rempah)', 2);

-- Insert 12 Makanan Utama
INSERT INTO menu_items (category_id, item_number, name, description, price, is_available, is_signature, badge) VALUES
  ('c1000000-0000-0000-0000-000000000001', 1, 'Rendang Daging', 'Daging sapi pilihan dimasak perlahan rempah 8 jam, karamelisasi sempurna.', 18000, true, true, 'WARISAN PUSAKA'),
  ('c1000000-0000-0000-0000-000000000001', 2, 'Dendeng Balado', 'Irisan daging renyah dengan sambal balado cabai merah uleg segar.', 18000, true, true, 'FAVORIT TAMU'),
  ('c1000000-0000-0000-0000-000000000001', 3, 'Ayam Pop', 'Ayam kampung lembut gurih bumbu rempah kelapa, disajikan khas kuah orisinal.', 15000, true, false, 'KLASIK'),
  ('c1000000-0000-0000-0000-000000000001', 4, 'Ayam Gulai', 'Ayam empuk dimasak kuah santan kuning rempah kaya aroma serai & kunyit.', 15000, true, false, NULL),
  ('c1000000-0000-0000-0000-000000000001', 5, 'Gulai Tunjang', 'Kikil sapi kenyal lembut dalam rendaman kuah gulai pedas gurih pekat.', 20000, true, true, 'REMPAH PEKAT'),
  ('c1000000-0000-0000-0000-000000000001', 6, 'Gulai Kepala Ikan', 'Kepala kakap segar dengan kuah gulai asam pedas beraroma ruku-ruku.', 35000, true, true, 'SPECIAL CHEF'),
  ('c1000000-0000-0000-0000-000000000001', 7, 'Ikan Asam Padeh', 'Ikan segar berkuah merah segar asam pedas tanpa santan khas Darek.', 16000, true, false, 'KHAS DAREK'),
  ('c1000000-0000-0000-0000-000000000001', 8, 'Telur Balado', 'Telur rebus goreng berselimut sambal balado pedas manis gurih.', 8000, true, false, NULL),
  ('c1000000-0000-0000-0000-000000000001', 9, 'Gulai Cincang', 'Daging & tetelan sapi cincang bumbu rempah pekat berkaldu mantap.', 18000, true, false, NULL),
  ('c1000000-0000-0000-0000-000000000001', 10, 'Sate Padang', 'Daging & lidah sapi kuah kental rempah kari kuning khas Pariaman.', 18000, true, false, 'PARIAMAN'),
  ('c1000000-0000-0000-0000-000000000001', 11, 'Perkedel Kentang', 'Olahan kentang lembut berbumbu seledri dan daging cincang goreng renyah.', 5000, true, false, NULL),
  ('c1000000-0000-0000-0000-000000000001', 12, 'Sambal Ijo', 'Ulekan cabai hijau pilihan, tomat hijau, dan minyak kelapa gurih khas.', 4000, true, false, 'TRADISIONAL');

-- Insert 8 Minuman Tradisional
INSERT INTO menu_items (category_id, item_number, name, description, price, is_available, is_signature, badge) VALUES
  ('c2000000-0000-0000-0000-000000000002', 1, 'Teh Talua', 'Racikan teh hitam pekat dikocok kuning telur bebek & perasan jeruk nipis (Signature 5 Lapis).', 12000, true, true, 'SIGNATURE DELICACY'),
  ('c2000000-0000-0000-0000-000000000002', 2, 'Kopi Talua', 'Kopi robusta Bukittinggi berbusa lembut kocokan telur khas Ranah Minang.', 14000, true, true, 'WARISAN IKONIK'),
  ('c2000000-0000-0000-0000-000000000002', 3, 'Es Teh Manis', 'Daun teh melati wangi pilihan dengan gula tebu asli dingin menyegarkan.', 5000, true, false, NULL),
  ('c2000000-0000-0000-0000-000000000002', 4, 'Es Jeruk', 'Perasan murni jeruk segar manis asam alami dengan es serut.', 7000, true, false, NULL),
  ('c2000000-0000-0000-0000-000000000002', 5, 'Jeruk Nipis Hangat', 'Air perasan jeruk nipis segar murni penyeimbang hidangan gurih berempah.', 7000, true, false, 'PENYEIMBANG'),
  ('c2000000-0000-0000-0000-000000000002', 6, 'Kopi Hitam', 'Seduhan kopi tubruk pekat aromatik khas dataran tinggi Minangkabau.', 5000, true, false, NULL),
  ('c2000000-0000-0000-0000-000000000002', 7, 'Teh Manis Hangat', 'Teh tubruk hangat aromatik menenangkan pendamping hidangan berempah.', 4000, true, false, NULL),
  ('c2000000-0000-0000-0000-000000000002', 8, 'Es Cincau', 'Potongan cincau hitam kenyal dengan sirup pandan wangi & santan gurih.', 7000, true, false, 'SEGAR GURIH');
