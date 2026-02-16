-- ============================================================================
-- SPORTS MANAGEMENT SAAS - DATABASE SCHEMA
-- Multi-tenant Architecture with club_id isolation
-- PostgreSQL 14+
-- ============================================================================

-- Enable UUID extension for better distributed IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for secure password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS - Type Safety
-- ============================================================================

-- User roles in the system
CREATE TYPE user_role AS ENUM (
    'SUPER_ADMIN',      -- Platform administrator
    'CLUB_ADMIN',       -- Club direction/management
    'COACH',            -- Team coach
    'PARENT'            -- Player's parent/guardian
);

-- Payment status lifecycle
CREATE TYPE payment_status AS ENUM (
    'PENDING',          -- Waiting for payment
    'PAID',             -- Successfully paid
    'OVERDUE',          -- Past due date
    'CANCELLED',        -- Cancelled by admin
    'REFUNDED'          -- Payment refunded
);

-- Payment types
CREATE TYPE payment_type AS ENUM (
    'MONTHLY_FEE',      -- Regular monthly subscription
    'REGISTRATION',     -- Annual registration fee
    'TOURNAMENT',       -- Tournament participation fee
    'EQUIPMENT',        -- Equipment/uniform purchase
    'OTHER'             -- Other custom fees
);

-- Payment methods
CREATE TYPE payment_method AS ENUM (
    'MBWAY',            -- MB Way (Portugal)
    'MULTIBANCO',       -- Multibanco reference
    'CREDIT_CARD',      -- Credit/Debit card
    'CASH',             -- Cash payment
    'BANK_TRANSFER'     -- Direct bank transfer
);

-- Order status
CREATE TYPE order_status AS ENUM (
    'CART',             -- In shopping cart
    'PENDING',          -- Order placed, awaiting payment
    'PAID',             -- Payment confirmed
    'PROCESSING',       -- Being prepared
    'SHIPPED',          -- Shipped to customer
    'DELIVERED',        -- Delivered successfully
    'CANCELLED',        -- Cancelled by user/admin
    'REFUNDED'          -- Refunded
);

-- Player position on field
CREATE TYPE player_position AS ENUM (
    'GOALKEEPER',
    'DEFENDER',
    'MIDFIELDER',
    'FORWARD'
);

-- Training attendance status
CREATE TYPE attendance_status AS ENUM (
    'PENDING',          -- Not yet marked
    'PRESENT',
    'ABSENT',
    'LATE',
    'JUSTIFIED',        -- Absent but with justification
    'INJURED'           -- Injured/Medical leave
);

-- Match result type
CREATE TYPE match_result AS ENUM (
    'WIN',
    'DRAW',
    'LOSS',
    'SCHEDULED'         -- Match not yet played
);

-- ============================================================================
-- CORE TABLES - Multi-tenant Foundation
-- ============================================================================

-- Clubs/Tenants - Each club is a separate tenant
CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'fcporto' for fcporto.seuapp.com
    logo_url TEXT,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Portugal',
    tax_id VARCHAR(50), -- NIF in Portugal
    
    -- Subscription management
    subscription_plan VARCHAR(50) DEFAULT 'FREE', -- FREE, STARTER, PRO
    subscription_status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, CANCELLED
    subscription_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    subscription_ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Settings stored as JSON for flexibility
    settings JSONB DEFAULT '{
        "currency": "EUR",
        "timezone": "Europe/Lisbon",
        "language": "pt",
        "notifications_enabled": true,
        "payment_reminders_days": [7, 3, 1]
    }'::jsonb,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete
);

-- Indexes for performance
CREATE INDEX idx_clubs_subdomain ON clubs(subdomain) WHERE deleted_at IS NULL;
CREATE INDEX idx_clubs_subscription_status ON clubs(subscription_status);

COMMENT ON TABLE clubs IS 'Clubs/Tenants - Each club is isolated with club_id';
COMMENT ON COLUMN clubs.subdomain IS 'Unique subdomain for tenant identification';
COMMENT ON COLUMN clubs.settings IS 'Club-specific settings in JSONB format';


-- Users - Global authentication table (shared across all clubs)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    
    -- Authentication
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    
    -- Profile
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    birth_date DATE,
    
    -- Security
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    reset_password_token VARCHAR(255),
    reset_password_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure unique email per club
    UNIQUE(club_id, email)
);

-- Indexes
CREATE INDEX idx_users_club_id ON users(club_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(club_id, role);

COMMENT ON TABLE users IS 'System users with multi-tenant isolation via club_id';
COMMENT ON COLUMN users.club_id IS 'Foreign Key to clubs(id): Ensures user belongs to a specific club/tenant';


-- ============================================================================
-- SPORTS MANAGEMENT TABLES
-- ============================================================================

-- Teams/Squads
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL, -- e.g., "Sub-15 A", "Juniores"
    category VARCHAR(100), -- e.g., "Sub-15", "Sub-17", "Seniores"
    gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE', 'MIXED')),
    
    -- Season management
    season VARCHAR(20) NOT NULL, -- e.g., "2024/2025"
    
    -- Coach assignment (FK to users where role='COACH')
    head_coach_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assistant_coach_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Team details
    description TEXT,
    team_photo_url TEXT,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(club_id, name, season)
);

CREATE INDEX idx_teams_club_id ON teams(club_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_teams_season ON teams(club_id, season);
CREATE INDEX idx_teams_head_coach ON teams(head_coach_id);

COMMENT ON TABLE teams IS 'Football teams/squads within a club';
COMMENT ON COLUMN teams.club_id IS 'Foreign Key to clubs(id): Identifies the club this team belongs to';
COMMENT ON COLUMN teams.head_coach_id IS 'Foreign Key to users(id): Main coach responsible for team';
COMMENT ON COLUMN teams.assistant_coach_id IS 'Foreign Key to users(id): Assistant coach';


-- Players/Athletes
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE')),
    photo_url TEXT,
    
    -- Parent/Guardian reference (FK to users where role='PARENT')
    parent_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Current team assignment
    current_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    
    -- Player details
    jersey_number INTEGER CHECK (jersey_number > 0 AND jersey_number <= 99),
    preferred_position player_position,
    height_cm INTEGER, -- Height in centimeters
    weight_kg DECIMAL(5,2), -- Weight in kilograms
    
    -- Contact & Emergency
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    
    -- Health information
    blood_type VARCHAR(5),
    allergies TEXT,
    medical_conditions TEXT,
    medical_certificate_url TEXT,
    medical_certificate_expires_at DATE,
    
    -- Documentation
    citizen_card_number VARCHAR(50),
    tax_id VARCHAR(50), -- NIF
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    registration_date DATE DEFAULT CURRENT_DATE,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_players_club_id ON players(club_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_players_parent_id ON players(parent_id);
CREATE INDEX idx_players_current_team ON players(current_team_id);
CREATE INDEX idx_players_active ON players(club_id, is_active);

COMMENT ON TABLE players IS 'Athletes/Players registered in the club';
COMMENT ON COLUMN players.club_id IS 'Foreign Key to clubs(id): Identifies the club this player belongs to';
COMMENT ON COLUMN players.parent_id IS 'Foreign Key to users(id): Parent/Guardian responsible for player';
COMMENT ON COLUMN players.current_team_id IS 'Foreign Key to teams(id): Current team assignment';


-- Player Team History (many-to-many with history)
CREATE TABLE player_team_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Period in team
    joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
    left_at DATE,
    
    -- Stats during this period
    matches_played INTEGER DEFAULT 0,
    goals_scored INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_player_team_history_player ON player_team_history(player_id);
CREATE INDEX idx_player_team_history_team ON player_team_history(team_id);

COMMENT ON TABLE player_team_history IS 'Historical record of player team assignments';
COMMENT ON COLUMN player_team_history.club_id IS 'Foreign Key to clubs(id): Multi-tenancy isolation';
COMMENT ON COLUMN player_team_history.player_id IS 'Foreign Key to players(id): The player';
COMMENT ON COLUMN player_team_history.team_id IS 'Foreign Key to teams(id): The team';


-- Training Sessions
CREATE TABLE trainings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Schedule
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Location
    location VARCHAR(255) NOT NULL,
    field_type VARCHAR(50), -- e.g., "Grass", "Artificial", "Indoor"
    
    -- Training plan
    title VARCHAR(255),
    objectives TEXT,
    
    -- Training plan details in structured format
    exercises JSONB DEFAULT '[]'::jsonb, -- Array of exercise objects
    -- Example: [{"name": "Warm-up", "duration": 15, "description": "..."}]
    
    notes TEXT, -- Post-training notes
    
    -- Status
    is_cancelled BOOLEAN DEFAULT FALSE,
    cancellation_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_trainings_club_id ON trainings(club_id);
CREATE INDEX idx_trainings_team_id ON trainings(team_id);
CREATE INDEX idx_trainings_date ON trainings(team_id, scheduled_date);
CREATE INDEX idx_trainings_coach ON trainings(coach_id);

COMMENT ON TABLE trainings IS 'Scheduled training sessions';
COMMENT ON COLUMN trainings.club_id IS 'Foreign Key to clubs(id): Multi-tenancy isolation';
COMMENT ON COLUMN trainings.team_id IS 'Foreign Key to teams(id): Team this training is for';
COMMENT ON COLUMN trainings.coach_id IS 'Foreign Key to users(id): Coach conducting the training';
COMMENT ON COLUMN trainings.exercises IS 'JSONB array of training exercises with details';


-- Training Attendance
CREATE TABLE training_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    
    training_id UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    
    status attendance_status NOT NULL DEFAULT 'PENDING',
    
    -- Additional info
    arrived_at TIME,
    justification TEXT, -- If absent or late
    notes TEXT,
    
    -- Marked by
    marked_by_user_id UUID REFERENCES users(id),
    marked_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(training_id, player_id)
);

CREATE INDEX idx_training_attendance_training ON training_attendance(training_id);
CREATE INDEX idx_training_attendance_player ON training_attendance(player_id);
CREATE INDEX idx_training_attendance_status ON training_attendance(club_id, status);

COMMENT ON TABLE training_attendance IS 'Player attendance tracking for trainings';
COMMENT ON COLUMN training_attendance.club_id IS 'Foreign Key to clubs(id): Multi-tenancy isolation';
COMMENT ON COLUMN training_attendance.training_id IS 'Foreign Key to trainings(id)';
COMMENT ON COLUMN training_attendance.player_id IS 'Foreign Key to players(id)';
COMMENT ON COLUMN training_attendance.marked_by_user_id IS 'Foreign Key to users(id): Who recorded attendance';


-- Matches/Games
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Match details
    opponent_name VARCHAR(255) NOT NULL,
    competition VARCHAR(255), -- e.g., "League", "Cup", "Friendly"
    
    -- Schedule
    match_date DATE NOT NULL,
    match_time TIME,
    location VARCHAR(255) NOT NULL,
    is_home_match BOOLEAN DEFAULT TRUE,
    
    -- Result
    result match_result DEFAULT 'SCHEDULED',
    goals_for INTEGER,
    goals_against INTEGER,
    
    -- Statistics stored as JSONB for flexibility
    statistics JSONB DEFAULT '{}'::jsonb,
    -- Example: {"possession": 60, "shots": 15, "corners": 8}
    
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_matches_club_id ON matches(club_id);
CREATE INDEX idx_matches_team_id ON matches(team_id);
CREATE INDEX idx_matches_date ON matches(team_id, match_date DESC);

COMMENT ON TABLE matches IS 'Football matches/games';
COMMENT ON COLUMN matches.club_id IS 'Foreign Key to clubs(id): Multi-tenancy isolation';
COMMENT ON COLUMN matches.team_id IS 'Foreign Key to teams(id): Team playing the match';


-- Match Call-ups (Convocatórias)
CREATE TABLE match_callups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    
    -- Call-up details
    is_starter BOOLEAN DEFAULT FALSE, -- Is in starting lineup
    position player_position,
    jersey_number INTEGER,
    
    -- Match participation
    played BOOLEAN DEFAULT FALSE,
    minutes_played INTEGER DEFAULT 0,
    goals_scored INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_card BOOLEAN DEFAULT FALSE,
    
    -- Additional stats
    performance_rating DECIMAL(3,1) CHECK (performance_rating >= 0 AND performance_rating <= 10),
    notes TEXT,
    
    created_by_user_id UUID REFERENCES users(id), -- Coach who created callup
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(match_id, player_id)
);

CREATE INDEX idx_match_callups_match ON match_callups(match_id);
CREATE INDEX idx_match_callups_player ON match_callups(player_id);

COMMENT ON TABLE match_callups IS 'Players called up for matches (convocatórias)';
COMMENT ON COLUMN match_callups.club_id IS 'Foreign Key to clubs(id): Multi-tenancy isolation';
COMMENT ON COLUMN match_callups.match_id IS 'Foreign Key to matches(id)';
COMMENT ON COLUMN match_callups.player_id IS 'Foreign Key to players(id)';
COMMENT ON COLUMN match_callups.created_by_user_id IS 'Foreign Key to users(id): Coach who created the callup';


-- ============================================================================
-- FINANCIAL MANAGEMENT TABLES
-- ============================================================================

-- Payments (Mensalidades e outras taxas)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    
    -- Who is paying (parent) and for whom (player)
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    payer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT, -- Usually parent
    
    -- Payment details
    payment_type payment_type NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) DEFAULT 'EUR',
    
    -- Status tracking
    status payment_status NOT NULL DEFAULT 'PENDING',
    
    -- Payment method and reference
    payment_method payment_method,
    reference_code VARCHAR(100), -- Multibanco reference, MB Way phone, etc.
    transaction_id VARCHAR(255), -- External payment gateway transaction ID
    
    -- Dates
    due_date DATE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Period covered (for monthly fees)
    period_start DATE,
    period_end DATE,
    
    -- Additional info
    description TEXT,
    notes TEXT, -- Internal notes
    
    -- Reminders
    reminder_sent_count INTEGER DEFAULT 0,
    last_reminder_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Processing
    processed_by_user_id UUID REFERENCES users(id), -- Admin who processed payment
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_payments_club_id ON payments(club_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_player_id ON payments(player_id);
CREATE INDEX idx_payments_payer_id ON payments(payer_id);
CREATE INDEX idx_payments_status ON payments(club_id, status);
CREATE INDEX idx_payments_due_date ON payments(club_id, due_date) WHERE status = 'PENDING';
CREATE INDEX idx_payments_overdue ON payments(club_id, due_date) 
    WHERE status = 'OVERDUE' AND deleted_at IS NULL;

COMMENT ON TABLE payments IS 'Payment records for fees, registrations, etc.';
COMMENT ON COLUMN payments.club_id IS 'Foreign Key to clubs(id): Multi-tenancy isolation';
COMMENT ON COLUMN payments.player_id IS 'Foreign Key to players(id): Player this payment is for';
COMMENT ON COLUMN payments.payer_id IS 'Foreign Key to users(id): Parent/Guardian making the payment';
COMMENT ON COLUMN payments.processed_by_user_id IS 'Foreign Key to users(id): Admin who confirmed payment';
COMMENT ON COLUMN payments.reference_code IS 'Payment reference (Multibanco, MB Way, etc.)';


-- Invoices/Receipts
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    
    -- Invoice numbering (must be sequential per club for legal compliance)
    invoice_number VARCHAR(50) NOT NULL,
    invoice_series VARCHAR(10) DEFAULT 'A', -- For different series if needed
    
    -- Amounts
    subtotal DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0, -- VAT rate (IVA in Portugal, usually 23%)
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Billing details
    billed_to_name VARCHAR(255) NOT NULL,
    billed_to_tax_id VARCHAR(50), -- NIF
    billed_to_address TEXT,
    
    -- Invoice items (can be JSONB for flexibility)
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Example: [{"description": "Monthly fee - March 2024", "amount": 50.00}]
    
    -- Dates
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    
    -- PDF generation
    pdf_url TEXT,
    pdf_generated_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    is_cancelled BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(club_id, invoice_series, invoice_number)
);

CREATE INDEX idx_invoices_club_id ON invoices(club_id);
CREATE INDEX idx_invoices_payment_id ON invoices(payment_id);
CREATE INDEX idx_invoices_number ON invoices(club_id, invoice_number);
CREATE INDEX idx_invoices_issue_date ON invoices(club_id, issue_date DESC);

COMMENT ON TABLE invoices IS 'Legal invoices/receipts for payments';
COMMENT ON COLUMN invoices.club_id IS 'Foreign Key to clubs(id): Multi-tenancy isolation';
COMMENT ON COLUMN invoices.payment_id IS 'Foreign Key to payments(id): Related payment record';
COMMENT ON COLUMN invoices.items IS 'JSONB array of invoice line items';


-- Stock/Inventory (Club Store Products)
CREATE TABLE stock_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    
    -- Product info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100), -- Stock Keeping Unit
    
    -- Category
    category VARCHAR(100), -- e.g., "Jersey", "Training Gear", "Accessories"
    
    -- Pricing
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    cost_price DECIMAL(10,2), -- Cost to club (for profit calculation)
    currency VARCHAR(3) DEFAULT 'EUR',
    
    -- Inventory
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    low_stock_threshold INTEGER DEFAULT 5,
    
    -- Product details
    sizes_available VARCHAR(255)[], -- Array: ['XS', 'S', 'M', 'L', 'XL']
    colors_available VARCHAR(255)[], -- Array: ['Blue', 'White', 'Red']
    
    -- Media
    image_url TEXT,
    additional_images TEXT[], -- Array of image URLs
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- SEO & Display
    display_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_stock_items_club_id ON stock_items(club_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_stock_items_category ON stock_items(club_id, category) WHERE is_active = TRUE;
CREATE INDEX idx_stock_items_sku ON stock_items(club_id, sku);
CREATE INDEX idx_stock_items_low_stock ON stock_items(club_id) 
    WHERE stock_quantity <= low_stock_threshold AND is_active = TRUE;

COMMENT ON TABLE stock_items IS 'Products available in club store';
COMMENT ON COLUMN stock_items.club_id IS 'Foreign Key to clubs(id): Multi-tenancy isolation';
COMMENT ON COLUMN stock_items.low_stock_threshold IS 'Alert when stock falls below this level';


-- Orders (Club Store Orders)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    
    -- Customer (parent)
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Order number (user-friendly reference)
    order_number VARCHAR(50) NOT NULL,
    
    -- Status
    status order_status NOT NULL DEFAULT 'CART',
    
    -- Amounts
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    currency VARCHAR(3) DEFAULT 'EUR',
    
    -- Shipping
    shipping_address TEXT,
    shipping_city VARCHAR(100),
    shipping_postal_code VARCHAR(20),
    shipping_country VARCHAR(100) DEFAULT 'Portugal',
    
    -- Delivery
    estimated_delivery_date DATE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    tracking_number VARCHAR(255),
    
    -- Payment
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    payment_method payment_method,
    
    -- Notes
    customer_notes TEXT,
    internal_notes TEXT,
    
    -- Timestamps for status tracking
    placed_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(club_id, order_number)
);

CREATE INDEX idx_orders_club_id ON orders(club_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(club_id, status);
CREATE INDEX idx_orders_created_at ON orders(club_id, created_at DESC);
CREATE INDEX idx_orders_number ON orders(club_id, order_number);

COMMENT ON TABLE orders IS 'Customer orders from club store';
COMMENT ON COLUMN orders.club_id IS 'Foreign Key to clubs(id): Multi-tenancy isolation';
COMMENT ON COLUMN orders.customer_id IS 'Foreign Key to users(id): Parent who placed the order';
COMMENT ON COLUMN orders.payment_id IS 'Foreign Key to payments(id): Payment for this order';


-- Order Items (Products in each order)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    stock_item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE RESTRICT,
    
    -- Product snapshot (at time of order)
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    
    -- Variant selected
    selected_size VARCHAR(50),
    selected_color VARCHAR(50),
    
    -- Pricing (snapshot at time of order)
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal DECIMAL(10,2) NOT NULL, -- unit_price * quantity
    
    -- Discount
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_stock_item_id ON order_items(stock_item_id);

COMMENT ON TABLE order_items IS 'Line items for each order';
COMMENT ON COLUMN order_items.club_id IS 'Foreign Key to clubs(id): Multi-tenancy isolation';
COMMENT ON COLUMN order_items.order_id IS 'Foreign Key to orders(id): Order this item belongs to';
COMMENT ON COLUMN order_items.stock_item_id IS 'Foreign Key to stock_items(id): Product reference';
COMMENT ON COLUMN order_items.product_name IS 'Snapshot of product name at time of order';


-- Stock Movement History (Audit trail for inventory)
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    
    stock_item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
    
    -- Movement details
    movement_type VARCHAR(50) NOT NULL, -- 'PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN'
    quantity INTEGER NOT NULL, -- Positive for additions, negative for deductions
    
    -- Reference to related record
    order_item_id UUID REFERENCES order_items(id),
    
    -- Before and after quantities
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    
    -- Notes
    reason TEXT,
    
    -- Who made the change
    created_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_stock_item ON stock_movements(stock_item_id);
CREATE INDEX idx_stock_movements_order_item ON stock_movements(order_item_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(club_id, created_at DESC);

COMMENT ON TABLE stock_movements IS 'Audit trail for all stock quantity changes';
COMMENT ON COLUMN stock_movements.club_id IS 'Foreign Key to clubs(id): Multi-tenancy isolation';
COMMENT ON COLUMN stock_movements.stock_item_id IS 'Foreign Key to stock_items(id): Product being moved';
COMMENT ON COLUMN stock_movements.order_item_id IS 'Foreign Key to order_items(id): If movement from sale';
COMMENT ON COLUMN stock_movements.created_by_user_id IS 'Foreign Key to users(id): Who made the change';


-- ============================================================================
-- NOTIFICATION SYSTEM
-- ============================================================================

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    
    -- Recipient
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification details
    type VARCHAR(100) NOT NULL, -- 'PAYMENT_DUE', 'TRAINING_REMINDER', 'CALLUP', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Related entities (optional)
    related_entity_type VARCHAR(100), -- 'PAYMENT', 'TRAINING', 'MATCH', etc.
    related_entity_id UUID,
    
    -- Action URL (deep link in mobile app)
    action_url TEXT,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Delivery
    sent_via VARCHAR(50)[], -- ['PUSH', 'EMAIL', 'SMS']
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_club_id ON notifications(club_id);
CREATE INDEX idx_notifications_created_at ON notifications(user_id, created_at DESC);

COMMENT ON TABLE notifications IS 'User notifications (push, email, in-app)';
COMMENT ON COLUMN notifications.club_id IS 'Foreign Key to clubs(id): Multi-tenancy isolation';
COMMENT ON COLUMN notifications.user_id IS 'Foreign Key to users(id): Notification recipient';


-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Function to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON clubs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trainings_updated_at BEFORE UPDATE ON trainings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_attendance_updated_at BEFORE UPDATE ON training_attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_match_callups_updated_at BEFORE UPDATE ON match_callups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_items_updated_at BEFORE UPDATE ON stock_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Function to automatically mark payments as OVERDUE
CREATE OR REPLACE FUNCTION check_overdue_payments()
RETURNS void AS $$
BEGIN
    UPDATE payments
    SET status = 'OVERDUE'
    WHERE status = 'PENDING'
    AND due_date < CURRENT_DATE
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_overdue_payments IS 'Automatically mark pending payments as overdue - run daily via cron';


-- Function to update stock quantity after order item creation
CREATE OR REPLACE FUNCTION update_stock_on_order()
RETURNS TRIGGER AS $$
DECLARE
    current_stock INTEGER;
BEGIN
    -- Get current stock
    SELECT stock_quantity INTO current_stock
    FROM stock_items
    WHERE id = NEW.stock_item_id AND club_id = NEW.club_id;
    
    -- Update stock
    UPDATE stock_items
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.stock_item_id AND club_id = NEW.club_id;
    
    -- Create stock movement record
    INSERT INTO stock_movements (
        club_id, stock_item_id, movement_type, quantity,
        order_item_id, quantity_before, quantity_after, reason
    ) VALUES (
        NEW.club_id, NEW.stock_item_id, 'SALE', -NEW.quantity,
        NEW.id, current_stock, current_stock - NEW.quantity,
        'Order #' || (SELECT order_number FROM orders WHERE id = NEW.order_id)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_on_order
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_stock_on_order();

COMMENT ON FUNCTION update_stock_on_order IS 'Automatically decrease stock and log movement when order item is created';


-- Function to generate sequential order numbers
CREATE OR REPLACE FUNCTION generate_order_number(p_club_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    next_number INTEGER;
    order_num VARCHAR;
BEGIN
    -- Get next number for this club (today's orders + 1)
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 10) AS INTEGER)), 0) + 1
    INTO next_number
    FROM orders
    WHERE club_id = p_club_id
    AND order_number LIKE TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '%';
    
    -- Format: YYYYMMDD-NNNN (e.g., 20240315-0001)
    order_num := TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_order_number IS 'Generate sequential order number: YYYYMMDD-NNNN';


-- ============================================================================
-- CONSISTENCY TRIGGERS (Multi-tenant Protection)
-- ============================================================================

-- Function to check that linked entities belong to the same club
-- 1. Player Consistency
CREATE OR REPLACE FUNCTION check_player_consistency()
RETURNS TRIGGER AS $$
DECLARE
    t_club_id UUID;
    p_club_id UUID;
BEGIN
    -- Check Player -> Team
    IF NEW.current_team_id IS NOT NULL THEN
        SELECT club_id INTO t_club_id FROM teams WHERE id = NEW.current_team_id;
        IF t_club_id != NEW.club_id THEN
            RAISE EXCEPTION 'Consistency Error: Player club_id (%) matches team club_id (%)\', NEW.club_id, t_club_id;
        END IF;
    END IF;

    -- Check Player -> Parent (User)
    IF NEW.parent_id IS NOT NULL THEN
        SELECT club_id INTO p_club_id FROM users WHERE id = NEW.parent_id;
        IF p_club_id != NEW.club_id THEN
             RAISE EXCEPTION 'Consistency Error: Player club_id (%) does not match Parent club_id (%)\', NEW.club_id, p_club_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Team Consistency
CREATE OR REPLACE FUNCTION check_team_consistency()
RETURNS TRIGGER AS $$
DECLARE
    p_club_id UUID;
BEGIN
    -- Check Team -> Coach
    IF NEW.head_coach_id IS NOT NULL THEN
        SELECT club_id INTO p_club_id FROM users WHERE id = NEW.head_coach_id;
        IF p_club_id != NEW.club_id THEN
             RAISE EXCEPTION 'Consistency Error: Team club_id (%) does not match Coach club_id (%)\', NEW.club_id, p_club_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Training Consistency
CREATE OR REPLACE FUNCTION check_training_consistency()
RETURNS TRIGGER AS $$
DECLARE
    t_club_id UUID;
BEGIN
    -- Check Training -> Team
    IF NEW.team_id IS NOT NULL THEN
        SELECT club_id INTO t_club_id FROM teams WHERE id = NEW.team_id;
        IF t_club_id != NEW.club_id THEN
             RAISE EXCEPTION 'Consistency Error: Training club_id (%) does not match Team club_id (%)\', NEW.club_id, t_club_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_consistency_players
BEFORE INSERT OR UPDATE ON players
FOR EACH ROW EXECUTE FUNCTION check_player_consistency();

CREATE TRIGGER check_consistency_teams
BEFORE INSERT OR UPDATE ON teams
FOR EACH ROW EXECUTE FUNCTION check_team_consistency();

CREATE TRIGGER check_consistency_trainings
BEFORE INSERT OR UPDATE ON trainings
FOR EACH ROW EXECUTE FUNCTION check_training_consistency();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Active players with parent info
CREATE VIEW v_active_players_with_parents AS
SELECT 
    p.id AS player_id,
    p.club_id,
    p.first_name || ' ' || p.last_name AS player_name,
    p.birth_date,
    p.photo_url,
    p.jersey_number,
    p.preferred_position,
    t.id AS team_id,
    t.name AS team_name,
    u.id AS parent_id,
    u.first_name || ' ' || u.last_name AS parent_name,
    u.email AS parent_email,
    u.phone AS parent_phone
FROM players p
INNER JOIN users u ON p.parent_id = u.id
LEFT JOIN teams t ON p.current_team_id = t.id
WHERE p.is_active = TRUE 
AND p.deleted_at IS NULL
AND u.deleted_at IS NULL;

COMMENT ON VIEW v_active_players_with_parents IS 'Active players with parent contact information';


-- View: Payment summary by player
CREATE VIEW v_player_payment_summary AS
SELECT 
    p.club_id,
    p.id AS player_id,
    p.first_name || ' ' || p.last_name AS player_name,
    COUNT(pay.id) FILTER (WHERE pay.status = 'PENDING') AS pending_payments,
    COUNT(pay.id) FILTER (WHERE pay.status = 'OVERDUE') AS overdue_payments,
    COALESCE(SUM(pay.amount) FILTER (WHERE pay.status IN ('PENDING', 'OVERDUE')), 0) AS total_outstanding,
    COALESCE(SUM(pay.amount) FILTER (WHERE pay.status = 'PAID'), 0) AS total_paid
FROM players p
LEFT JOIN payments pay ON p.id = pay.player_id AND pay.deleted_at IS NULL
WHERE p.deleted_at IS NULL
GROUP BY p.club_id, p.id, p.first_name, p.last_name;

COMMENT ON VIEW v_player_payment_summary IS 'Payment statistics per player';


-- View: Team roster with player details
CREATE VIEW v_team_rosters AS
SELECT 
    t.id AS team_id,
    t.club_id,
    t.name AS team_name,
    t.category,
    t.season,
    p.id AS player_id,
    p.first_name || ' ' || p.last_name AS player_name,
    p.jersey_number,
    p.preferred_position,
    p.birth_date,
    EXTRACT(YEAR FROM AGE(p.birth_date)) AS age,
    u.first_name || ' ' || u.last_name AS parent_name,
    u.phone AS parent_phone
FROM teams t
LEFT JOIN players p ON t.id = p.current_team_id AND p.is_active = TRUE AND p.deleted_at IS NULL
LEFT JOIN users u ON p.parent_id = u.id
WHERE t.deleted_at IS NULL;

COMMENT ON VIEW v_team_rosters IS 'Complete team rosters with player and parent info';


-- View: Stock items with low inventory alert
CREATE VIEW v_low_stock_items AS
SELECT 
    club_id,
    id AS stock_item_id,
    name,
    sku,
    category,
    stock_quantity,
    low_stock_threshold,
    price,
    (low_stock_threshold - stock_quantity) AS units_needed
FROM stock_items
WHERE stock_quantity <= low_stock_threshold
AND is_active = TRUE
AND deleted_at IS NULL
ORDER BY stock_quantity ASC;

COMMENT ON VIEW v_low_stock_items IS 'Products that need restocking';


-- ============================================================================
-- SAMPLE DATA INSERTS (Optional - for development/testing)
-- ============================================================================

-- Insert sample club
INSERT INTO clubs (name, subdomain, email, phone, city, subscription_plan)
VALUES ('FC Porto Academy', 'fcporto', 'admin@fcportoacademy.pt', '+351912345678', 'Porto', 'PRO');

-- Note: In production, you'd create users with properly hashed passwords
-- This is just for schema demonstration

-- ============================================================================
-- GRANTS & PERMISSIONS (Adjust based on your deployment strategy)
-- ============================================================================

-- Example: Create role for application
-- CREATE ROLE sports_app_role;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sports_app_role;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sports_app_role;

-- ============================================================================
-- MAINTENANCE QUERIES
-- ============================================================================

-- Query to check database size by club
CREATE VIEW v_club_storage_usage AS
SELECT 
    c.id AS club_id,
    c.name AS club_name,
    (SELECT COUNT(*) FROM users WHERE club_id = c.id) AS users_count,
    (SELECT COUNT(*) FROM players WHERE club_id = c.id) AS players_count,
    (SELECT COUNT(*) FROM payments WHERE club_id = c.id) AS payments_count,
    (SELECT COUNT(*) FROM orders WHERE club_id = c.id) AS orders_count
FROM clubs c
WHERE c.deleted_at IS NULL;

COMMENT ON VIEW v_club_storage_usage IS 'Monitor data usage per club';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================