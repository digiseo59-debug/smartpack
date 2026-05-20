-- SmartPack / MolEmballage - Initial Database Schema
-- Run this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'salarie');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_mode AS ENUM ('cash', 'transfer', 'check');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE stock_type AS ENUM ('normal', 'serigraphie');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'salarie',
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'salarie')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Clients
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    credit NUMERIC(12,2) NOT NULL DEFAULT 0,
    notes TEXT DEFAULT '',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'fa-folder',
    color TEXT NOT NULL DEFAULT 'cat-gray',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    stock INTEGER NOT NULL DEFAULT 0,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    cost_price NUMERIC(10,2) DEFAULT 0,
    stock_type stock_type NOT NULL DEFAULT 'normal',
    low_stock_threshold INTEGER NOT NULL DEFAULT 20,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    location TEXT DEFAULT '',
    credit NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sales
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ref_number TEXT UNIQUE NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT now(),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    payment_mode payment_mode NOT NULL DEFAULT 'cash',
    is_credit BOOLEAN NOT NULL DEFAULT false,
    credit_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    is_gift BOOLEAN NOT NULL DEFAULT false,
    notes TEXT DEFAULT '',
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sale Items
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    is_special BOOLEAN NOT NULL DEFAULT false
);

-- Purchases
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ref_number TEXT UNIQUE NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT now(),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    payment_mode payment_mode NOT NULL DEFAULT 'cash',
    is_credit BOOLEAN NOT NULL DEFAULT false,
    credit_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    notes TEXT DEFAULT '',
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Purchase Items
CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TIMESTAMPTZ NOT NULL DEFAULT now(),
    description TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    category TEXT DEFAULT 'general',
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stock Movements
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_cost NUMERIC(10,2),
    movement_type TEXT NOT NULL,
    reference_id UUID,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}',
    updated_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO settings (key, value) VALUES
    ('business', '{"name": "MolEmballage.ma", "subtitle": "Gestion Commerciale", "currency": "DH", "phone": "", "address": "Meknes, Maroc"}'),
    ('sale_counter', '{"next_id": 168, "prefix": "VNT", "year": 2026}'),
    ('purchase_counter', '{"next_id": 13, "prefix": "ACH", "year": 2026}')
ON CONFLICT (key) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clients_credit ON clients (credit) WHERE credit > 0;
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales (date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_client ON sales (client_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_by ON sales (created_by);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items (sale_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases (date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (date DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON profiles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON clients;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON products;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON suppliers;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON sales;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON purchases;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Helper function
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Create sale function (atomic transaction)
CREATE OR REPLACE FUNCTION create_sale(
    p_client_id UUID,
    p_payment_mode payment_mode,
    p_is_credit BOOLEAN,
    p_is_gift BOOLEAN,
    p_notes TEXT,
    p_items JSONB
)
RETURNS UUID AS $$
DECLARE
    v_sale_id UUID;
    v_ref_number TEXT;
    v_total NUMERIC(12,2) := 0;
    v_item JSONB;
    v_counter JSONB;
    v_next_id INTEGER;
BEGIN
    SELECT value INTO v_counter FROM settings WHERE key = 'sale_counter' FOR UPDATE;
    v_next_id := (v_counter->>'next_id')::INTEGER;
    v_ref_number := (v_counter->>'prefix') || '-' || (v_counter->>'year') || '-' || LPAD(v_next_id::TEXT, 4, '0');

    UPDATE settings
    SET value = jsonb_set(v_counter, '{next_id}', to_jsonb(v_next_id + 1)), updated_at = now()
    WHERE key = 'sale_counter';

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_total := v_total + ((v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::NUMERIC);
    END LOOP;

    INSERT INTO sales (id, ref_number, client_id, total_amount, payment_mode, is_credit, credit_amount, is_gift, notes, created_by)
    VALUES (
        uuid_generate_v4(), v_ref_number, p_client_id,
        CASE WHEN p_is_gift THEN 0 ELSE v_total END,
        p_payment_mode, p_is_credit,
        CASE WHEN p_is_credit THEN v_total ELSE 0 END,
        p_is_gift, p_notes, auth.uid()
    )
    RETURNING id INTO v_sale_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, is_special)
        VALUES (
            v_sale_id,
            CASE WHEN (v_item->>'is_special')::BOOLEAN THEN NULL ELSE (v_item->>'product_id')::UUID END,
            v_item->>'product_name',
            (v_item->>'quantity')::INTEGER,
            (v_item->>'unit_price')::NUMERIC,
            COALESCE((v_item->>'is_special')::BOOLEAN, false)
        );

        IF NOT COALESCE((v_item->>'is_special')::BOOLEAN, false) THEN
            UPDATE products SET stock = stock - (v_item->>'quantity')::INTEGER
            WHERE id = (v_item->>'product_id')::UUID;

            INSERT INTO stock_movements (product_id, quantity, movement_type, reference_id, created_by)
            VALUES ((v_item->>'product_id')::UUID, -(v_item->>'quantity')::INTEGER, 'sale', v_sale_id, auth.uid());
        END IF;
    END LOOP;

    IF p_is_credit AND p_client_id IS NOT NULL THEN
        UPDATE clients SET credit = credit + v_total WHERE id = p_client_id;
    END IF;

    RETURN v_sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_select_admin" ON profiles FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE USING (get_user_role() = 'admin');

-- Clients policies
CREATE POLICY "clients_select" ON clients FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "clients_insert" ON clients FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "clients_update" ON clients FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "clients_delete" ON clients FOR DELETE USING (get_user_role() = 'admin');

-- Categories policies
CREATE POLICY "categories_select" ON categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "categories_insert" ON categories FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "categories_update" ON categories FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY "categories_delete" ON categories FOR DELETE USING (get_user_role() = 'admin');

-- Products policies
CREATE POLICY "products_select" ON products FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "products_insert" ON products FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "products_update" ON products FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY "products_delete" ON products FOR DELETE USING (get_user_role() = 'admin');

-- Sales policies
CREATE POLICY "sales_select_admin" ON sales FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "sales_select_own" ON sales FOR SELECT USING (created_by = auth.uid());
CREATE POLICY "sales_insert" ON sales FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "sales_update" ON sales FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY "sales_delete" ON sales FOR DELETE USING (get_user_role() = 'admin');

-- Sale items policies
CREATE POLICY "sale_items_select" ON sale_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "sale_items_insert" ON sale_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Suppliers policies
CREATE POLICY "suppliers_select" ON suppliers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "suppliers_insert" ON suppliers FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "suppliers_update" ON suppliers FOR UPDATE USING (get_user_role() = 'admin');

-- Purchases policies
CREATE POLICY "purchases_select" ON purchases FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "purchases_insert" ON purchases FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "purchases_update" ON purchases FOR UPDATE USING (get_user_role() = 'admin');

-- Purchase items policies
CREATE POLICY "purchase_items_select" ON purchase_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "purchase_items_insert" ON purchase_items FOR INSERT WITH CHECK (get_user_role() = 'admin');

-- Expenses policies
CREATE POLICY "expenses_select" ON expenses FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "expenses_insert" ON expenses FOR INSERT WITH CHECK (get_user_role() = 'admin');

-- Stock movements policies
CREATE POLICY "stock_movements_select" ON stock_movements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "stock_movements_insert" ON stock_movements FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Settings policies
CREATE POLICY "settings_select" ON settings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "settings_update" ON settings FOR UPDATE USING (get_user_role() = 'admin');
