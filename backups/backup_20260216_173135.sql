--
-- PostgreSQL database dump
--

\restrict ilFvfidOCzydGyT9x0saOB0YWCr0HyCTPaDfBjIVpfVRJg8DGQnFLbmDKAwl2gD

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: sports_admin
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO sports_admin;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: sports_admin
--

COMMENT ON SCHEMA public IS '';


--
-- Name: absence_notice_status; Type: TYPE; Schema: public; Owner: sports_admin
--

CREATE TYPE public.absence_notice_status AS ENUM (
    'PENDING',
    'APPROVED',
    'DISMISSED'
);


ALTER TYPE public.absence_notice_status OWNER TO sports_admin;

--
-- Name: attendance_status; Type: TYPE; Schema: public; Owner: sports_admin
--

CREATE TYPE public.attendance_status AS ENUM (
    'PENDING',
    'PRESENT',
    'ABSENT',
    'LATE',
    'JUSTIFIED',
    'INJURED'
);


ALTER TYPE public.attendance_status OWNER TO sports_admin;

--
-- Name: match_result; Type: TYPE; Schema: public; Owner: sports_admin
--

CREATE TYPE public.match_result AS ENUM (
    'WIN',
    'DRAW',
    'LOSS',
    'SCHEDULED'
);


ALTER TYPE public.match_result OWNER TO sports_admin;

--
-- Name: medical_status; Type: TYPE; Schema: public; Owner: sports_admin
--

CREATE TYPE public.medical_status AS ENUM (
    'FIT',
    'INJURED',
    'SICK',
    'CONDITIONED'
);


ALTER TYPE public.medical_status OWNER TO sports_admin;

--
-- Name: order_status; Type: TYPE; Schema: public; Owner: sports_admin
--

CREATE TYPE public.order_status AS ENUM (
    'CART',
    'PENDING',
    'PAID',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED'
);


ALTER TYPE public.order_status OWNER TO sports_admin;

--
-- Name: payment_method; Type: TYPE; Schema: public; Owner: sports_admin
--

CREATE TYPE public.payment_method AS ENUM (
    'MBWAY',
    'MULTIBANCO',
    'CREDIT_CARD',
    'CASH',
    'BANK_TRANSFER'
);


ALTER TYPE public.payment_method OWNER TO sports_admin;

--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: sports_admin
--

CREATE TYPE public.payment_status AS ENUM (
    'PENDING',
    'PAID',
    'OVERDUE',
    'CANCELLED',
    'REFUNDED'
);


ALTER TYPE public.payment_status OWNER TO sports_admin;

--
-- Name: payment_type; Type: TYPE; Schema: public; Owner: sports_admin
--

CREATE TYPE public.payment_type AS ENUM (
    'MONTHLY_FEE',
    'REGISTRATION',
    'TOURNAMENT',
    'EQUIPMENT',
    'OTHER'
);


ALTER TYPE public.payment_type OWNER TO sports_admin;

--
-- Name: player_position; Type: TYPE; Schema: public; Owner: sports_admin
--

CREATE TYPE public.player_position AS ENUM (
    'GOALKEEPER',
    'DEFENDER',
    'MIDFIELDER',
    'FORWARD'
);


ALTER TYPE public.player_position OWNER TO sports_admin;

--
-- Name: player_status; Type: TYPE; Schema: public; Owner: sports_admin
--

CREATE TYPE public.player_status AS ENUM (
    'ACTIVE',
    'PENDING_WITHDRAWAL',
    'LEFT',
    'SUSPENDED'
);


ALTER TYPE public.player_status OWNER TO sports_admin;

--
-- Name: transfer_status; Type: TYPE; Schema: public; Owner: sports_admin
--

CREATE TYPE public.transfer_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
);


ALTER TYPE public.transfer_status OWNER TO sports_admin;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: sports_admin
--

CREATE TYPE public.user_role AS ENUM (
    'SUPER_ADMIN',
    'CLUB_ADMIN',
    'COACH',
    'PARENT'
);


ALTER TYPE public.user_role OWNER TO sports_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: sports_admin
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO sports_admin;

--
-- Name: absence_notices; Type: TABLE; Schema: public; Owner: sports_admin
--

CREATE TABLE public.absence_notices (
    id uuid NOT NULL,
    athlete_id uuid NOT NULL,
    player_id uuid,
    training_id uuid NOT NULL,
    submitted_by_parent_id uuid NOT NULL,
    type character varying(20) DEFAULT 'ABSENCE'::character varying NOT NULL,
    reason text,
    status public.absence_notice_status DEFAULT 'PENDING'::public.absence_notice_status NOT NULL,
    reviewed_by_user_id uuid,
    reviewed_at timestamp(6) with time zone,
    review_notes text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.absence_notices OWNER TO sports_admin;

--
-- Name: athletes; Type: TABLE; Schema: public; Owner: sports_admin
--

CREATE TABLE public.athletes (
    id uuid NOT NULL,
    public_id character varying(10) NOT NULL,
    global_parent_id uuid NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    birth_date date NOT NULL,
    gender character varying(10),
    citizen_card character varying(50),
    tax_id character varying(50),
    medical_conditions text,
    allergies text,
    current_club_id uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.athletes OWNER TO sports_admin;

--
-- Name: clubs; Type: TABLE; Schema: public; Owner: sports_admin
--

CREATE TABLE public.clubs (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    subdomain character varying(100) NOT NULL,
    logo_url text,
    email character varying(255) NOT NULL,
    phone character varying(20),
    address text,
    city character varying(100),
    postal_code character varying(20),
    country character varying(100) DEFAULT 'Portugal'::character varying NOT NULL,
    tax_id character varying(50),
    subscription_plan character varying(50) DEFAULT 'FREE'::character varying NOT NULL,
    subscription_status character varying(50) DEFAULT 'ACTIVE'::character varying NOT NULL,
    subscription_started_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    subscription_ends_at timestamp(6) with time zone,
    settings jsonb DEFAULT '{"currency": "EUR", "language": "pt", "timezone": "Europe/Lisbon", "notifications_enabled": true, "payment_reminders_days": [7, 3, 1]}'::jsonb NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    deleted_at timestamp(6) with time zone
);


ALTER TABLE public.clubs OWNER TO sports_admin;

--
-- Name: global_parents; Type: TABLE; Schema: public; Owner: sports_admin
--

CREATE TABLE public.global_parents (
    id uuid NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.global_parents OWNER TO sports_admin;

--
-- Name: injuries; Type: TABLE; Schema: public; Owner: sports_admin
--

CREATE TABLE public.injuries (
    id uuid NOT NULL,
    club_id uuid NOT NULL,
    player_id uuid NOT NULL,
    status public.medical_status DEFAULT 'INJURED'::public.medical_status NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    start_date date DEFAULT CURRENT_TIMESTAMP NOT NULL,
    end_date date,
    created_by_user_id uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.injuries OWNER TO sports_admin;

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: sports_admin
--

CREATE TABLE public.invoices (
    id uuid NOT NULL,
    club_id uuid NOT NULL,
    payment_id uuid,
    invoice_number character varying(50) NOT NULL,
    invoice_series character varying(10) DEFAULT 'A'::character varying NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    tax_rate numeric(5,2) DEFAULT 0 NOT NULL,
    tax_amount numeric(10,2) DEFAULT 0 NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    billed_to_name character varying(255) NOT NULL,
    billed_to_tax_id character varying(50),
    billed_to_address text,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    issue_date date DEFAULT CURRENT_TIMESTAMP NOT NULL,
    due_date date,
    pdf_url text,
    pdf_generated_at timestamp(6) with time zone,
    is_cancelled boolean DEFAULT false NOT NULL,
    cancelled_at timestamp(6) with time zone,
    cancellation_reason text,
    notes text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.invoices OWNER TO sports_admin;

--
-- Name: match_callups; Type: TABLE; Schema: public; Owner: sports_admin
--

CREATE TABLE public.match_callups (
    id uuid NOT NULL,
    club_id uuid NOT NULL,
    match_id uuid NOT NULL,
    player_id uuid NOT NULL,
    is_starter boolean DEFAULT false NOT NULL,
    "position" public.player_position,
    jersey_number integer,
    confirmed_by_parent boolean DEFAULT false NOT NULL,
    confirmed_at timestamp(6) with time zone,
    played boolean DEFAULT false NOT NULL,
    minutes_played integer DEFAULT 0 NOT NULL,
    goals_scored integer DEFAULT 0 NOT NULL,
    yellow_cards integer DEFAULT 0 NOT NULL,
    red_card boolean DEFAULT false NOT NULL,
    coach_rating numeric(3,1),
    notes text,
    created_by_user_id uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.match_callups OWNER TO sports_admin;

--
-- Name: matches; Type: TABLE; Schema: public; Owner: sports_admin
--

CREATE TABLE public.matches (
    id uuid NOT NULL,
    club_id uuid NOT NULL,
    team_id uuid NOT NULL,
    opponent_name character varying(255) NOT NULL,
    competition character varying(255),
    match_date date NOT NULL,
    match_time time(6) without time zone,
    location character varying(255) NOT NULL,
    is_home_match boolean DEFAULT true NOT NULL,
    result public.match_result DEFAULT 'SCHEDULED'::public.match_result NOT NULL,
    goals_for integer,
    goals_against integer,
    statistics jsonb DEFAULT '{}'::jsonb NOT NULL,
    notes text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.matches OWNER TO sports_admin;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: sports_admin
--

CREATE TABLE public.notifications (
    id uuid NOT NULL,
    club_id uuid NOT NULL,
    user_id uuid NOT NULL,
    type character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    related_entity_type character varying(100),
    related_entity_id uuid,
    action_url text,
    is_read boolean DEFAULT false NOT NULL,
    read_at timestamp(6) with time zone,
    sent_via text[],
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO sports_admin;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: sports_admin
--

CREATE TABLE public.order_items (
    id uuid NOT NULL,
    club_id uuid NOT NULL,
    order_id uuid NOT NULL,
    stock_item_id uuid NOT NULL,
    product_name character varying(255) NOT NULL,
    product_sku character varying(100),
    selected_size character varying(50),
    selected_color character varying(50),
    unit_price numeric(10,2) NOT NULL,
    quantity integer NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    discount_amount numeric(10,2) DEFAULT 0 NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.order_items OWNER TO sports_admin;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: sports_admin
--

CREATE TABLE public.orders (
    id uuid NOT NULL,
    club_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    order_number character varying(50) NOT NULL,
    status public.order_status DEFAULT 'CART'::public.order_status NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    shipping_cost numeric(10,2) DEFAULT 0 NOT NULL,
    tax_amount numeric(10,2) DEFAULT 0 NOT NULL,
    discount_amount numeric(10,2) DEFAULT 0 NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'EUR'::character varying NOT NULL,
    shipping_address text,
    shipping_city character varying(100),
    shipping_postal_code character varying(20),
    shipping_country character varying(100) DEFAULT 'Portugal'::character varying NOT NULL,
    estimated_delivery_date date,
    delivered_at timestamp(6) with time zone,
    tracking_number character varying(255),
    payment_id uuid,
    payment_method public.payment_method,
    customer_notes text,
    internal_notes text,
    placed_at timestamp(6) with time zone,
    paid_at timestamp(6) with time zone,
    shipped_at timestamp(6) with time zone,
    cancelled_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.orders OWNER TO sports_admin;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: sports_admin
--

CREATE TABLE public.payments (
    id uuid NOT NULL,
    club_id uuid NOT NULL,
    player_id uuid NOT NULL,
    payer_id uuid NOT NULL,
    payment_type public.payment_type NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'EUR'::character varying NOT NULL,
    status public.payment_status DEFAULT 'PENDING'::public.payment_status NOT NULL,
    payment_method public.payment_method,
    reference_code character varying(100),
    transaction_id character varying(255),
    due_date date NOT NULL,
    paid_at timestamp(6) with time zone,
    period_start date,
    period_end date,
    description text,
    notes text,
    reminder_sent_count integer DEFAULT 0 NOT NULL,
    last_reminder_sent_at timestamp(6) with time zone,
    processed_by_user_id uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    deleted_at timestamp(6) with time zone
);


ALTER TABLE public.payments OWNER TO sports_admin;

--
-- Name: player_team_history; Type: TABLE; Schema: public; Owner: sports_admin
--

CREATE TABLE public.player_team_history (
    id uuid NOT NULL,
    club_id uuid NOT NULL,
    player_id uuid NOT NULL,
    team_id uuid NOT NULL,
    joined_at date DEFAULT CURRENT_TIMESTAMP NOT NULL,
    left_at date,
    matches_played integer DEFAULT 0 NOT NULL,
    goals_scored integer DEFAULT 0 NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.player_team_history OWNER TO sports_admin;

--
-- Name: players; Type: TABLE; Schema: public; Owner: sports_admin
--

CREATE TABLE public.players (
    id uuid NOT NULL,
    club_id uuid NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    birth_date date NOT NULL,
    gender character varying(10),
    photo_url text,
    parent_id uuid NOT NULL,
    current_team_id uuid,
    jersey_number integer,
    preferred_position public.player_position,
    height_cm integer,
    weight_kg numeric(5,2),
    emergency_contact_name character varying(255),
    emergency_contact_phone character varying(20),
    blood_type character varying(5),
    allergies text,
    medical_conditions text,
    medical_certificate_url text,
    medical_certificate_expires_at date,
    citizen_card_number character varying(50),
    tax_id character varying(50),
    is_active boolean DEFAULT true NOT NULL,
    registration_date date DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    deleted_at timestamp(6) with time zone,
    athlete_id uuid,
    status public.player_status DEFAULT 'ACTIVE'::public.player_status NOT NULL,
    withdrawal_requested_at timestamp(6) with time zone,
    medical_status public.medical_status DEFAULT 'FIT'::public.medical_status NOT NULL,
    destination_club_email character varying(255),
    documents_sent_at timestamp(6) with time zone,
    withdrawal_letter_url text,
    withdrawal_reason text
);


ALTER TABLE public.players OWNER TO sports_admin;

--
-- Name: seasons; Type: TABLE; Schema: public; Owner: sports_admin
--

CREATE TABLE public.seasons (
    id uuid NOT NULL,
    club_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.seasons OWNER TO sports_admin;

--
-- Name: stock_items; Type: TABLE; Schema: public; Owner: sports_admin
--

CREATE TABLE public.stock_items (
    id uuid NOT NULL,
    club_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    sku character varying(100),
    category character varying(100),
    price numeric(10,2) NOT NULL,
    cost_price numeric(10,2),
    currency character varying(3) DEFAULT 'EUR'::character varying NOT NULL,
    stock_quantity integer DEFAULT 0 NOT NULL,
    low_stock_threshold integer DEFAULT 5 NOT NULL,
    sizes_available text[],
    colors_available text[],
    image_url text,
    additional_images text[],
    is_active boolean DEFAULT true NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    deleted_at timestamp(6) with time zone
);


ALTER TABLE public.stock_items OWNER TO sports_admin;

--
-- Name: stock_movements; Type: TABLE; Schema: public; Owner: sports_admin
--

CREATE TABLE public.stock_movements (
    id uuid NOT NULL,
    club_id uuid NOT NULL,
    stock_item_id uuid NOT NULL,
    "movementType" character varying(50) NOT NULL,
    quantity integer NOT NULL,
    order_item_id uuid,
    quantity_before integer NOT NULL,
    quantity_after integer NOT NULL,
    reason text,
    created_by_user_id uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.stock_movements OWNER TO sports_admin;

--
-- Name: teams; Type: TABLE; Schema: public; Owner: sports_admin
--

CREATE TABLE public.teams (
    id uuid NOT NULL,
    club_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    category character varying(100),
    gender character varying(10),
    season_id uuid NOT NULL,
    head_coach_id uuid,
    assistant_coach_id uuid,
    description text,
    team_photo_url text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    deleted_at timestamp(6) with time zone
);


ALTER TABLE public.teams OWNER TO sports_admin;

--
-- Name: training_attendance; Type: TABLE; Schema: public; Owner: sports_admin
--

CREATE TABLE public.training_attendance (
    id uuid NOT NULL,
    club_id uuid NOT NULL,
    training_id uuid NOT NULL,
    player_id uuid NOT NULL,
    status public.attendance_status DEFAULT 'PRESENT'::public.attendance_status NOT NULL,
    arrived_at time(6) without time zone,
    justification text,
    notes text,
    marked_by_user_id uuid,
    marked_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.training_attendance OWNER TO sports_admin;

--
-- Name: trainings; Type: TABLE; Schema: public; Owner: sports_admin
--

CREATE TABLE public.trainings (
    id uuid NOT NULL,
    club_id uuid NOT NULL,
    team_id uuid NOT NULL,
    coach_id uuid NOT NULL,
    scheduled_date date NOT NULL,
    start_time time(6) without time zone NOT NULL,
    end_time time(6) without time zone NOT NULL,
    location character varying(255) NOT NULL,
    field_type character varying(50),
    title character varying(255),
    objectives text,
    exercises jsonb DEFAULT '[]'::jsonb NOT NULL,
    notes text,
    plan_file_url text,
    is_cancelled boolean DEFAULT false NOT NULL,
    cancellation_reason text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    is_finalized boolean DEFAULT false NOT NULL,
    finalized_at timestamp(6) with time zone,
    finalized_by_user_id uuid
);


ALTER TABLE public.trainings OWNER TO sports_admin;

--
-- Name: transfer_requests; Type: TABLE; Schema: public; Owner: sports_admin
--

CREATE TABLE public.transfer_requests (
    id uuid NOT NULL,
    athlete_id uuid NOT NULL,
    from_club_id uuid,
    to_club_id uuid NOT NULL,
    status public.transfer_status DEFAULT 'PENDING'::public.transfer_status NOT NULL,
    requested_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    expires_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.transfer_requests OWNER TO sports_admin;

--
-- Name: users; Type: TABLE; Schema: public; Owner: sports_admin
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    club_id uuid NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role public.user_role NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    phone character varying(20),
    avatar_url text,
    birth_date date,
    email_verified boolean DEFAULT false NOT NULL,
    email_verified_at timestamp(6) with time zone,
    last_login_at timestamp(6) with time zone,
    is_active boolean DEFAULT true NOT NULL,
    reset_password_token character varying(255),
    reset_password_expires_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    deleted_at timestamp(6) with time zone,
    global_parent_id uuid
);


ALTER TABLE public.users OWNER TO sports_admin;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: sports_admin
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
db5f2f77-1185-4f9d-9a72-9379941d6c01	47941f0fd471418402ad3b6fa659f888053d9c829ca3aa3d0feb0b565b933f32	2026-02-16 13:56:06.297171+00	20260206143735_init_v2	\N	\N	2026-02-16 13:56:06.237207+00	1
8d9dde77-0b94-4d06-9371-d1d7a8d6c0d1	f2a94fdb578a587d9d8962d61275c10750b795a4febbf3041b960afdbfa56288	2026-02-16 13:56:06.303399+00	20260206155500_add_medical_department	\N	\N	2026-02-16 13:56:06.297905+00	1
bc8b67f3-77ab-488b-a193-bdfce53bfeac	bc8d81845ca3f255da83ca08c236e5d1ca364b1863fef51a2e2eb4a958c8c4f5	2026-02-16 13:56:06.306335+00	20260206171148_add_training_finalization	\N	\N	2026-02-16 13:56:06.304131+00	1
787716e0-4d19-42b9-a77e-4dfce3a7eccc	28937845d6b1e3fff80aea277fa2cd343898654d2fbf8a4fe27264cb8a681e21	2026-02-16 13:56:06.315166+00	20260206180930_add_absence_notices	\N	\N	2026-02-16 13:56:06.307184+00	1
aae8745b-ec3f-415b-b1c3-5ae83868a3ef	edd19d1262dcaf9f27b02a3fe077e3c64555416bd4c13bf119829168e38a6727	2026-02-16 13:56:53.780099+00	20260216135617_add_performance_and_sync	\N	\N	2026-02-16 13:56:53.754335+00	1
\.


--
-- Data for Name: absence_notices; Type: TABLE DATA; Schema: public; Owner: sports_admin
--

COPY public.absence_notices (id, athlete_id, player_id, training_id, submitted_by_parent_id, type, reason, status, reviewed_by_user_id, reviewed_at, review_notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: athletes; Type: TABLE DATA; Schema: public; Owner: sports_admin
--

COPY public.athletes (id, public_id, global_parent_id, first_name, last_name, birth_date, gender, citizen_card, tax_id, medical_conditions, allergies, current_club_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: clubs; Type: TABLE DATA; Schema: public; Owner: sports_admin
--

COPY public.clubs (id, name, subdomain, logo_url, email, phone, address, city, postal_code, country, tax_id, subscription_plan, subscription_status, subscription_started_at, subscription_ends_at, settings, created_at, updated_at, deleted_at) FROM stdin;
278d3f2b-f83e-4af3-b702-b532eead8d4a	Sporting Clube	sporting	\N	admin@sporting.pt	\N	\N	\N	\N	Portugal	\N	PRO	ACTIVE	2026-02-16 13:56:56.858+00	\N	{"currency": "EUR", "language": "pt", "timezone": "Europe/Lisbon", "notifications_enabled": true, "payment_reminders_days": [7, 3, 1]}	2026-02-16 13:56:56.858+00	2026-02-16 13:56:56.858+00	\N
b0ca99f8-4f2b-482a-92c2-bf3860edba97	Académica OAF	academica	\N	academica@academica.pt	\N	\N	\N	\N	Portugal	\N	FREE	ACTIVE	2026-02-16 14:42:06.251+00	\N	{"currency": "EUR", "language": "pt", "timezone": "Europe/Lisbon", "notifications_enabled": true, "payment_reminders_days": [7, 3, 1]}	2026-02-16 14:42:06.251+00	2026-02-16 14:42:06.251+00	\N
\.


--
-- Data for Name: global_parents; Type: TABLE DATA; Schema: public; Owner: sports_admin
--

COPY public.global_parents (id, email, password_hash, first_name, last_name, created_at, updated_at) FROM stdin;
2f568fcb-8d09-4a82-88f9-d2fbab9e2d0f	duarte@prazeres.pt	$2b$10$bG2Fm.0Z6YnizlmRQu/EZ.TJfF3QDajnIDdujSaD/nKdNTljw2zOe	Duarte	Marques	2026-02-16 14:43:50.936+00	2026-02-16 14:43:50.936+00
\.


--
-- Data for Name: injuries; Type: TABLE DATA; Schema: public; Owner: sports_admin
--

COPY public.injuries (id, club_id, player_id, status, name, description, start_date, end_date, created_by_user_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: sports_admin
--

COPY public.invoices (id, club_id, payment_id, invoice_number, invoice_series, subtotal, tax_rate, tax_amount, total_amount, billed_to_name, billed_to_tax_id, billed_to_address, items, issue_date, due_date, pdf_url, pdf_generated_at, is_cancelled, cancelled_at, cancellation_reason, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: match_callups; Type: TABLE DATA; Schema: public; Owner: sports_admin
--

COPY public.match_callups (id, club_id, match_id, player_id, is_starter, "position", jersey_number, confirmed_by_parent, confirmed_at, played, minutes_played, goals_scored, yellow_cards, red_card, coach_rating, notes, created_by_user_id, created_at, updated_at) FROM stdin;
82bafebb-ebf7-44cd-b5e2-11cec42ce0e5	278d3f2b-f83e-4af3-b702-b532eead8d4a	53c8ce30-dee8-49a4-876c-28f4fb5bfa3f	7680f4d4-b781-4d7e-bcb3-c92e63413d94	f	\N	\N	t	\N	f	0	0	0	f	\N	\N	\N	2026-02-16 13:56:57.46+00	2026-02-16 13:56:57.46+00
ecb7b324-75a1-4968-a251-ae5ee4126997	278d3f2b-f83e-4af3-b702-b532eead8d4a	53c8ce30-dee8-49a4-876c-28f4fb5bfa3f	64e30803-100a-4792-98bd-03549472b838	f	\N	\N	f	\N	f	0	0	0	f	\N	\N	\N	2026-02-16 13:56:57.461+00	2026-02-16 13:56:57.461+00
2d94d548-1a0a-4408-8b53-e221e12a7e53	278d3f2b-f83e-4af3-b702-b532eead8d4a	53c8ce30-dee8-49a4-876c-28f4fb5bfa3f	cf60c77a-3a6f-4583-9535-ae129fe32b78	f	\N	\N	f	\N	f	0	0	0	f	\N	\N	\N	2026-02-16 13:56:57.462+00	2026-02-16 13:56:57.462+00
aa70143f-af78-4fe0-9362-0301753c539b	278d3f2b-f83e-4af3-b702-b532eead8d4a	b0031418-c97c-439d-b02a-7f3678d85f5e	64db5551-7b80-4454-9217-b4e2c12a3277	f	\N	\N	f	\N	f	0	0	0	f	\N	\N	\N	2026-02-16 13:56:57.463+00	2026-02-16 13:56:57.463+00
fb96e89e-058e-4663-babf-bce00d8546dc	278d3f2b-f83e-4af3-b702-b532eead8d4a	b0031418-c97c-439d-b02a-7f3678d85f5e	7ce337b1-fd16-4ea6-9c9c-8b25d959361f	f	\N	\N	f	\N	f	0	0	0	f	\N	\N	\N	2026-02-16 13:56:57.463+00	2026-02-16 13:56:57.463+00
8d343630-4ab0-4372-a172-e41c78dc0d14	278d3f2b-f83e-4af3-b702-b532eead8d4a	b0031418-c97c-439d-b02a-7f3678d85f5e	5adc66e7-5f29-4b14-b681-aff466ea734d	f	\N	\N	f	\N	f	0	0	0	f	\N	\N	\N	2026-02-16 13:56:57.464+00	2026-02-16 13:56:57.464+00
6f7f7a09-b6a8-40fa-b373-5a54e2ee7271	278d3f2b-f83e-4af3-b702-b532eead8d4a	c712a1cb-3c17-4951-813b-9124364dc9a0	6d6345be-5085-48eb-a13b-9218bb25fbfb	f	\N	\N	t	\N	t	90	2	0	f	8.0	\N	\N	2026-02-16 13:56:57.464+00	2026-02-16 13:56:57.464+00
1f5c8be5-b48f-4e4d-9e7c-47cdf6c3b0aa	278d3f2b-f83e-4af3-b702-b532eead8d4a	c712a1cb-3c17-4951-813b-9124364dc9a0	d32b6b94-e5b4-4bb3-bf07-1c94e8bb368d	f	\N	\N	t	\N	t	90	1	0	f	9.0	\N	\N	2026-02-16 13:56:57.465+00	2026-02-16 13:56:57.465+00
81b670dc-486e-44f1-8b3d-9d02b49de822	278d3f2b-f83e-4af3-b702-b532eead8d4a	c712a1cb-3c17-4951-813b-9124364dc9a0	91164d14-6005-4a4b-a0a1-2f514c047d9d	f	\N	\N	t	\N	t	90	0	0	f	10.0	\N	\N	2026-02-16 13:56:57.466+00	2026-02-16 13:56:57.466+00
\.


--
-- Data for Name: matches; Type: TABLE DATA; Schema: public; Owner: sports_admin
--

COPY public.matches (id, club_id, team_id, opponent_name, competition, match_date, match_time, location, is_home_match, result, goals_for, goals_against, statistics, notes, created_at, updated_at) FROM stdin;
53c8ce30-dee8-49a4-876c-28f4fb5bfa3f	278d3f2b-f83e-4af3-b702-b532eead8d4a	67b81256-1718-4d0a-b205-fe1e950f05d6	FC Porto B	\N	2026-02-10	\N	Estádio Sporting	t	SCHEDULED	\N	\N	{}	\N	2026-02-16 13:56:57.458+00	2026-02-16 13:56:57.458+00
b0031418-c97c-439d-b02a-7f3678d85f5e	278d3f2b-f83e-4af3-b702-b532eead8d4a	5c7419a2-9987-4f92-87f6-1d9e77525f7c	Benfica Sub-17	\N	2026-02-12	\N	Campo Benfica	f	SCHEDULED	\N	\N	{}	\N	2026-02-16 13:56:57.459+00	2026-02-16 13:56:57.459+00
c712a1cb-3c17-4951-813b-9124364dc9a0	278d3f2b-f83e-4af3-b702-b532eead8d4a	28fc622b-28e1-497f-9290-c66b3e242c97	Braga Sub-19	\N	2026-01-28	\N	Estádio Sporting	t	WIN	3	1	{}	\N	2026-02-16 13:56:57.46+00	2026-02-16 13:56:57.46+00
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: sports_admin
--

COPY public.notifications (id, club_id, user_id, type, title, message, related_entity_type, related_entity_id, action_url, is_read, read_at, sent_via, created_at) FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: sports_admin
--

COPY public.order_items (id, club_id, order_id, stock_item_id, product_name, product_sku, selected_size, selected_color, unit_price, quantity, subtotal, discount_amount, total_amount, created_at) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: sports_admin
--

COPY public.orders (id, club_id, customer_id, order_number, status, subtotal, shipping_cost, tax_amount, discount_amount, total_amount, currency, shipping_address, shipping_city, shipping_postal_code, shipping_country, estimated_delivery_date, delivered_at, tracking_number, payment_id, payment_method, customer_notes, internal_notes, placed_at, paid_at, shipped_at, cancelled_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: sports_admin
--

COPY public.payments (id, club_id, player_id, payer_id, payment_type, amount, currency, status, payment_method, reference_code, transaction_id, due_date, paid_at, period_start, period_end, description, notes, reminder_sent_count, last_reminder_sent_at, processed_by_user_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: player_team_history; Type: TABLE DATA; Schema: public; Owner: sports_admin
--

COPY public.player_team_history (id, club_id, player_id, team_id, joined_at, left_at, matches_played, goals_scored, created_at) FROM stdin;
\.


--
-- Data for Name: players; Type: TABLE DATA; Schema: public; Owner: sports_admin
--

COPY public.players (id, club_id, first_name, last_name, birth_date, gender, photo_url, parent_id, current_team_id, jersey_number, preferred_position, height_cm, weight_kg, emergency_contact_name, emergency_contact_phone, blood_type, allergies, medical_conditions, medical_certificate_url, medical_certificate_expires_at, citizen_card_number, tax_id, is_active, registration_date, created_at, updated_at, deleted_at, athlete_id, status, withdrawal_requested_at, medical_status, destination_club_email, documents_sent_at, withdrawal_letter_url, withdrawal_reason) FROM stdin;
7680f4d4-b781-4d7e-bcb3-c92e63413d94	278d3f2b-f83e-4af3-b702-b532eead8d4a	João	Silva	2010-05-15	MALE	\N	7faf0a4f-4a0e-47d0-a531-7f85497c9b36	67b81256-1718-4d0a-b205-fe1e950f05d6	10	MIDFIELDER	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-02-16	2026-02-16 13:56:57.429+00	2026-02-16 13:56:57.429+00	\N	\N	ACTIVE	\N	FIT	\N	\N	\N	\N
64e30803-100a-4792-98bd-03549472b838	278d3f2b-f83e-4af3-b702-b532eead8d4a	Pedro	Costa	2010-03-20	MALE	\N	88b2036e-e90d-4dfb-8d0b-929f6c970223	67b81256-1718-4d0a-b205-fe1e950f05d6	9	FORWARD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-02-16	2026-02-16 13:56:57.436+00	2026-02-16 13:56:57.436+00	\N	\N	ACTIVE	\N	FIT	\N	\N	\N	\N
cf60c77a-3a6f-4583-9535-ae129fe32b78	278d3f2b-f83e-4af3-b702-b532eead8d4a	Miguel	Santos	2010-08-10	MALE	\N	12288be0-4c14-4484-b35e-189dfa3d2f97	67b81256-1718-4d0a-b205-fe1e950f05d6	4	DEFENDER	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-02-16	2026-02-16 13:56:57.441+00	2026-02-16 13:56:57.441+00	\N	\N	ACTIVE	\N	FIT	\N	\N	\N	\N
64db5551-7b80-4454-9217-b4e2c12a3277	278d3f2b-f83e-4af3-b702-b532eead8d4a	Rui	Almeida	2008-12-05	MALE	\N	08d4c129-fc94-42df-b97b-6d2913b8997f	5c7419a2-9987-4f92-87f6-1d9e77525f7c	8	MIDFIELDER	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-02-16	2026-02-16 13:56:57.445+00	2026-02-16 13:56:57.445+00	\N	\N	ACTIVE	\N	FIT	\N	\N	\N	\N
7ce337b1-fd16-4ea6-9c9c-8b25d959361f	278d3f2b-f83e-4af3-b702-b532eead8d4a	André	Ferreira	2008-07-22	MALE	\N	4e74bdf4-2531-4494-b6cc-5617fcedf358	5c7419a2-9987-4f92-87f6-1d9e77525f7c	7	FORWARD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-02-16	2026-02-16 13:56:57.448+00	2026-02-16 13:56:57.448+00	\N	\N	ACTIVE	\N	FIT	\N	\N	\N	\N
5adc66e7-5f29-4b14-b681-aff466ea734d	278d3f2b-f83e-4af3-b702-b532eead8d4a	Carlos	Mendes	2008-01-18	MALE	\N	0af9aec3-c80c-4ef4-bd9a-e4dcc70f854d	5c7419a2-9987-4f92-87f6-1d9e77525f7c	3	DEFENDER	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-02-16	2026-02-16 13:56:57.45+00	2026-02-16 13:56:57.45+00	\N	\N	ACTIVE	\N	FIT	\N	\N	\N	\N
6d6345be-5085-48eb-a13b-9218bb25fbfb	278d3f2b-f83e-4af3-b702-b532eead8d4a	Bruno	Oliveira	2006-11-30	MALE	\N	a784b92b-15f9-4771-a9f3-c9f80677be0d	28fc622b-28e1-497f-9290-c66b3e242c97	11	FORWARD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-02-16	2026-02-16 13:56:57.452+00	2026-02-16 13:56:57.452+00	\N	\N	ACTIVE	\N	FIT	\N	\N	\N	\N
d32b6b94-e5b4-4bb3-bf07-1c94e8bb368d	278d3f2b-f83e-4af3-b702-b532eead8d4a	Diogo	Rodrigues	2006-09-14	MALE	\N	ea07ee84-c2b2-434d-8685-f480e3b98016	28fc622b-28e1-497f-9290-c66b3e242c97	6	MIDFIELDER	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-02-16	2026-02-16 13:56:57.454+00	2026-02-16 13:56:57.454+00	\N	\N	ACTIVE	\N	FIT	\N	\N	\N	\N
91164d14-6005-4a4b-a0a1-2f514c047d9d	278d3f2b-f83e-4af3-b702-b532eead8d4a	Tiago	Pereira	2006-04-25	MALE	\N	cfd02917-4fe3-4c3a-8ab5-889e5ef65258	28fc622b-28e1-497f-9290-c66b3e242c97	5	DEFENDER	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-02-16	2026-02-16 13:56:57.456+00	2026-02-16 13:56:57.456+00	\N	\N	ACTIVE	\N	FIT	\N	\N	\N	\N
\.


--
-- Data for Name: seasons; Type: TABLE DATA; Schema: public; Owner: sports_admin
--

COPY public.seasons (id, club_id, name, start_date, end_date, is_active, created_at, updated_at) FROM stdin;
4e946c3f-fec6-4a2a-bc0d-a8a70d92688f	278d3f2b-f83e-4af3-b702-b532eead8d4a	2025/2026	2025-09-01	2026-06-30	t	2026-02-16 13:56:56.921+00	2026-02-16 13:56:56.921+00
da7b6139-5f2e-4bda-b3ef-b12702382535	278d3f2b-f83e-4af3-b702-b532eead8d4a	2024/2025	2024-09-01	2025-06-30	f	2026-02-16 13:56:56.923+00	2026-02-16 13:56:56.923+00
\.


--
-- Data for Name: stock_items; Type: TABLE DATA; Schema: public; Owner: sports_admin
--

COPY public.stock_items (id, club_id, name, description, sku, category, price, cost_price, currency, stock_quantity, low_stock_threshold, sizes_available, colors_available, image_url, additional_images, is_active, is_featured, display_order, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: stock_movements; Type: TABLE DATA; Schema: public; Owner: sports_admin
--

COPY public.stock_movements (id, club_id, stock_item_id, "movementType", quantity, order_item_id, quantity_before, quantity_after, reason, created_by_user_id, created_at) FROM stdin;
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: sports_admin
--

COPY public.teams (id, club_id, name, category, gender, season_id, head_coach_id, assistant_coach_id, description, team_photo_url, created_at, updated_at, deleted_at) FROM stdin;
67b81256-1718-4d0a-b205-fe1e950f05d6	278d3f2b-f83e-4af3-b702-b532eead8d4a	Sub-15 Masculino	SUB15	\N	4e946c3f-fec6-4a2a-bc0d-a8a70d92688f	\N	\N	\N	\N	2026-02-16 13:56:56.924+00	2026-02-16 13:56:56.924+00	\N
5c7419a2-9987-4f92-87f6-1d9e77525f7c	278d3f2b-f83e-4af3-b702-b532eead8d4a	Sub-17 Masculino	SUB17	\N	4e946c3f-fec6-4a2a-bc0d-a8a70d92688f	\N	\N	\N	\N	2026-02-16 13:56:56.926+00	2026-02-16 13:56:56.926+00	\N
28fc622b-28e1-497f-9290-c66b3e242c97	278d3f2b-f83e-4af3-b702-b532eead8d4a	Sub-19 Masculino	SUB19	\N	4e946c3f-fec6-4a2a-bc0d-a8a70d92688f	\N	\N	\N	\N	2026-02-16 13:56:56.927+00	2026-02-16 13:56:56.927+00	\N
\.


--
-- Data for Name: training_attendance; Type: TABLE DATA; Schema: public; Owner: sports_admin
--

COPY public.training_attendance (id, club_id, training_id, player_id, status, arrived_at, justification, notes, marked_by_user_id, marked_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: trainings; Type: TABLE DATA; Schema: public; Owner: sports_admin
--

COPY public.trainings (id, club_id, team_id, coach_id, scheduled_date, start_time, end_time, location, field_type, title, objectives, exercises, notes, plan_file_url, is_cancelled, cancellation_reason, created_at, updated_at, is_finalized, finalized_at, finalized_by_user_id) FROM stdin;
\.


--
-- Data for Name: transfer_requests; Type: TABLE DATA; Schema: public; Owner: sports_admin
--

COPY public.transfer_requests (id, athlete_id, from_club_id, to_club_id, status, requested_at, updated_at, expires_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: sports_admin
--

COPY public.users (id, club_id, email, password_hash, role, first_name, last_name, phone, avatar_url, birth_date, email_verified, email_verified_at, last_login_at, is_active, reset_password_token, reset_password_expires_at, created_at, updated_at, deleted_at, global_parent_id) FROM stdin;
0677449c-fdce-4d0e-bf4b-5823dfbf8e68	278d3f2b-f83e-4af3-b702-b532eead8d4a	admin@sporting.pt	$2b$10$Q5OQIoKxMyoFbOVYPVVyf.pwGY/foXNpbvkX11HK/TF8O8I7JKNhK	CLUB_ADMIN	Admin	Sporting	\N	\N	\N	f	\N	\N	t	\N	\N	2026-02-16 13:56:56.915+00	2026-02-16 13:56:56.915+00	\N	\N
7faf0a4f-4a0e-47d0-a531-7f85497c9b36	278d3f2b-f83e-4af3-b702-b532eead8d4a	maria.silva@email.pt	$2b$10$VSiU/byk0vnV0pWrdhtjcencIhxlQAi9ML7NJ1AvJkbeZVVtVmdxq	PARENT	Maria	Silva	\N	\N	\N	f	\N	\N	t	\N	\N	2026-02-16 13:56:56.983+00	2026-02-16 13:56:56.983+00	\N	\N
88b2036e-e90d-4dfb-8d0b-929f6c970223	278d3f2b-f83e-4af3-b702-b532eead8d4a	joao.costa@email.pt	$2b$10$/HwsUCoduMvBFrwErhFkrOZYGsRoRLeSHsQt0nXqbE54fV2grxvnm	PARENT	João	Costa	\N	\N	\N	f	\N	\N	t	\N	\N	2026-02-16 13:56:57.04+00	2026-02-16 13:56:57.04+00	\N	\N
12288be0-4c14-4484-b35e-189dfa3d2f97	278d3f2b-f83e-4af3-b702-b532eead8d4a	ana.santos@email.pt	$2b$10$LYVQNjnXGSC7igfOmJuJCuUWWCep7JFdJWYLhyyJt/rccMov2qzt2	PARENT	Ana	Santos	\N	\N	\N	f	\N	\N	t	\N	\N	2026-02-16 13:56:57.097+00	2026-02-16 13:56:57.097+00	\N	\N
08d4c129-fc94-42df-b97b-6d2913b8997f	278d3f2b-f83e-4af3-b702-b532eead8d4a	carlos.almeida@email.pt	$2b$10$Ky1Y5ayGGZsUDoHH0IdidezHcmQG.vDzknr/eyV8Bw.NKxGCBNDYy	PARENT	Carlos	Almeida	\N	\N	\N	f	\N	\N	t	\N	\N	2026-02-16 13:56:57.154+00	2026-02-16 13:56:57.154+00	\N	\N
4e74bdf4-2531-4494-b6cc-5617fcedf358	278d3f2b-f83e-4af3-b702-b532eead8d4a	sofia.ferreira@email.pt	$2b$10$HKHoszM7U8agKryEnGK1lup4RNZyPo6JJchkWFT5NWPOss3calBEW	PARENT	Sofia	Ferreira	\N	\N	\N	f	\N	\N	t	\N	\N	2026-02-16 13:56:57.211+00	2026-02-16 13:56:57.211+00	\N	\N
0af9aec3-c80c-4ef4-bd9a-e4dcc70f854d	278d3f2b-f83e-4af3-b702-b532eead8d4a	pedro.mendes@email.pt	$2b$10$W8EnaExk6GR5v83IjyXaduuXWZAYgF6u6KrbWKDDzxkpi8BP0PL92	PARENT	Pedro	Mendes	\N	\N	\N	f	\N	\N	t	\N	\N	2026-02-16 13:56:57.264+00	2026-02-16 13:56:57.264+00	\N	\N
a784b92b-15f9-4771-a9f3-c9f80677be0d	278d3f2b-f83e-4af3-b702-b532eead8d4a	rita.oliveira@email.pt	$2b$10$hVgWDgwGn5nO7BDd7xtqn.Bh21u7vfk6YuSEHkLc7F2tNBtH1l/DC	PARENT	Rita	Oliveira	\N	\N	\N	f	\N	\N	t	\N	\N	2026-02-16 13:56:57.319+00	2026-02-16 13:56:57.319+00	\N	\N
ea07ee84-c2b2-434d-8685-f480e3b98016	278d3f2b-f83e-4af3-b702-b532eead8d4a	manuel.rodrigues@email.pt	$2b$10$ZZQKTRqqpc6f49/wMt7n.Obi6RF5VMK.EhY4Fgmq0Qd14.9ms0yUa	PARENT	Manuel	Rodrigues	\N	\N	\N	f	\N	\N	t	\N	\N	2026-02-16 13:56:57.372+00	2026-02-16 13:56:57.372+00	\N	\N
cfd02917-4fe3-4c3a-8ab5-889e5ef65258	278d3f2b-f83e-4af3-b702-b532eead8d4a	teresa.pereira@email.pt	$2b$10$fgsm.u.iZmoXzUGGz.hUHOnP0Xe0MfkjvNT7O9eBmOxdncEYMxFli	PARENT	Teresa	Pereira	\N	\N	\N	f	\N	\N	t	\N	\N	2026-02-16 13:56:57.426+00	2026-02-16 13:56:57.426+00	\N	\N
dfa7dd9a-60c1-44bf-8bb9-a1edb15c08e4	b0ca99f8-4f2b-482a-92c2-bf3860edba97	academica@academica.pt	$2b$10$.CT6a6AITeqe4W7CbK9D4.pWpc4HwCamyarjh2Igqf4g2Hl1Xeglm	CLUB_ADMIN	Duarte	Prazeres	\N	\N	\N	f	\N	\N	t	\N	\N	2026-02-16 14:42:06.255+00	2026-02-16 14:42:06.255+00	\N	\N
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: absence_notices absence_notices_pkey; Type: CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.absence_notices
    ADD CONSTRAINT absence_notices_pkey PRIMARY KEY (id);


--
-- Name: athletes athletes_pkey; Type: CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.athletes
    ADD CONSTRAINT athletes_pkey PRIMARY KEY (id);


--
-- Name: clubs clubs_pkey; Type: CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.clubs
    ADD CONSTRAINT clubs_pkey PRIMARY KEY (id);


--
-- Name: global_parents global_parents_pkey; Type: CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.global_parents
    ADD CONSTRAINT global_parents_pkey PRIMARY KEY (id);


--
-- Name: injuries injuries_pkey; Type: CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.injuries
    ADD CONSTRAINT injuries_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: match_callups match_callups_pkey; Type: CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.match_callups
    ADD CONSTRAINT match_callups_pkey PRIMARY KEY (id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: player_team_history player_team_history_pkey; Type: CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.player_team_history
    ADD CONSTRAINT player_team_history_pkey PRIMARY KEY (id);


--
-- Name: players players_pkey; Type: CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_pkey PRIMARY KEY (id);


--
-- Name: seasons seasons_pkey; Type: CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.seasons
    ADD CONSTRAINT seasons_pkey PRIMARY KEY (id);


--
-- Name: stock_items stock_items_pkey; Type: CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.stock_items
    ADD CONSTRAINT stock_items_pkey PRIMARY KEY (id);


--
-- Name: stock_movements stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (id);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: training_attendance training_attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.training_attendance
    ADD CONSTRAINT training_attendance_pkey PRIMARY KEY (id);


--
-- Name: trainings trainings_pkey; Type: CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.trainings
    ADD CONSTRAINT trainings_pkey PRIMARY KEY (id);


--
-- Name: transfer_requests transfer_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.transfer_requests
    ADD CONSTRAINT transfer_requests_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: absence_notices_athlete_id_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX absence_notices_athlete_id_idx ON public.absence_notices USING btree (athlete_id);


--
-- Name: absence_notices_status_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX absence_notices_status_idx ON public.absence_notices USING btree (status);


--
-- Name: absence_notices_training_id_status_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX absence_notices_training_id_status_idx ON public.absence_notices USING btree (training_id, status);


--
-- Name: athletes_public_id_key; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE UNIQUE INDEX athletes_public_id_key ON public.athletes USING btree (public_id);


--
-- Name: clubs_email_key; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE UNIQUE INDEX clubs_email_key ON public.clubs USING btree (email);


--
-- Name: clubs_subdomain_key; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE UNIQUE INDEX clubs_subdomain_key ON public.clubs USING btree (subdomain);


--
-- Name: global_parents_email_key; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE UNIQUE INDEX global_parents_email_key ON public.global_parents USING btree (email);


--
-- Name: invoices_club_id_invoice_series_invoice_number_key; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE UNIQUE INDEX invoices_club_id_invoice_series_invoice_number_key ON public.invoices USING btree (club_id, invoice_series, invoice_number);


--
-- Name: match_callups_match_id_player_id_key; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE UNIQUE INDEX match_callups_match_id_player_id_key ON public.match_callups USING btree (match_id, player_id);


--
-- Name: matches_club_id_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX matches_club_id_idx ON public.matches USING btree (club_id);


--
-- Name: matches_match_date_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX matches_match_date_idx ON public.matches USING btree (match_date);


--
-- Name: matches_result_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX matches_result_idx ON public.matches USING btree (result);


--
-- Name: matches_team_id_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX matches_team_id_idx ON public.matches USING btree (team_id);


--
-- Name: orders_club_id_order_number_key; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE UNIQUE INDEX orders_club_id_order_number_key ON public.orders USING btree (club_id, order_number);


--
-- Name: payments_club_id_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX payments_club_id_idx ON public.payments USING btree (club_id);


--
-- Name: payments_created_at_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX payments_created_at_idx ON public.payments USING btree (created_at);


--
-- Name: payments_due_date_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX payments_due_date_idx ON public.payments USING btree (due_date);


--
-- Name: payments_player_id_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX payments_player_id_idx ON public.payments USING btree (player_id);


--
-- Name: payments_status_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX payments_status_idx ON public.payments USING btree (status);


--
-- Name: players_club_id_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX players_club_id_idx ON public.players USING btree (club_id);


--
-- Name: players_current_team_id_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX players_current_team_id_idx ON public.players USING btree (current_team_id);


--
-- Name: players_deleted_at_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX players_deleted_at_idx ON public.players USING btree (deleted_at);


--
-- Name: players_parent_id_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX players_parent_id_idx ON public.players USING btree (parent_id);


--
-- Name: players_status_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX players_status_idx ON public.players USING btree (status);


--
-- Name: seasons_club_id_name_key; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE UNIQUE INDEX seasons_club_id_name_key ON public.seasons USING btree (club_id, name);


--
-- Name: teams_club_id_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX teams_club_id_idx ON public.teams USING btree (club_id);


--
-- Name: teams_club_id_name_season_id_key; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE UNIQUE INDEX teams_club_id_name_season_id_key ON public.teams USING btree (club_id, name, season_id);


--
-- Name: teams_season_id_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX teams_season_id_idx ON public.teams USING btree (season_id);


--
-- Name: training_attendance_club_id_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX training_attendance_club_id_idx ON public.training_attendance USING btree (club_id);


--
-- Name: training_attendance_player_id_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX training_attendance_player_id_idx ON public.training_attendance USING btree (player_id);


--
-- Name: training_attendance_status_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX training_attendance_status_idx ON public.training_attendance USING btree (status);


--
-- Name: training_attendance_training_id_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX training_attendance_training_id_idx ON public.training_attendance USING btree (training_id);


--
-- Name: training_attendance_training_id_player_id_key; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE UNIQUE INDEX training_attendance_training_id_player_id_key ON public.training_attendance USING btree (training_id, player_id);


--
-- Name: trainings_club_id_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX trainings_club_id_idx ON public.trainings USING btree (club_id);


--
-- Name: trainings_coach_id_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX trainings_coach_id_idx ON public.trainings USING btree (coach_id);


--
-- Name: trainings_is_finalized_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX trainings_is_finalized_idx ON public.trainings USING btree (is_finalized);


--
-- Name: trainings_scheduled_date_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX trainings_scheduled_date_idx ON public.trainings USING btree (scheduled_date);


--
-- Name: trainings_team_id_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX trainings_team_id_idx ON public.trainings USING btree (team_id);


--
-- Name: users_club_id_email_key; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE UNIQUE INDEX users_club_id_email_key ON public.users USING btree (club_id, email);


--
-- Name: users_club_id_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX users_club_id_idx ON public.users USING btree (club_id);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_role_idx; Type: INDEX; Schema: public; Owner: sports_admin
--

CREATE INDEX users_role_idx ON public.users USING btree (role);


--
-- Name: absence_notices absence_notices_athlete_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.absence_notices
    ADD CONSTRAINT absence_notices_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES public.athletes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: absence_notices absence_notices_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.absence_notices
    ADD CONSTRAINT absence_notices_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: absence_notices absence_notices_reviewed_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.absence_notices
    ADD CONSTRAINT absence_notices_reviewed_by_user_id_fkey FOREIGN KEY (reviewed_by_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: absence_notices absence_notices_submitted_by_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.absence_notices
    ADD CONSTRAINT absence_notices_submitted_by_parent_id_fkey FOREIGN KEY (submitted_by_parent_id) REFERENCES public.global_parents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: absence_notices absence_notices_training_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.absence_notices
    ADD CONSTRAINT absence_notices_training_id_fkey FOREIGN KEY (training_id) REFERENCES public.trainings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: athletes athletes_global_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.athletes
    ADD CONSTRAINT athletes_global_parent_id_fkey FOREIGN KEY (global_parent_id) REFERENCES public.global_parents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: injuries injuries_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.injuries
    ADD CONSTRAINT injuries_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: injuries injuries_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.injuries
    ADD CONSTRAINT injuries_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: injuries injuries_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.injuries
    ADD CONSTRAINT injuries_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoices invoices_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invoices invoices_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: match_callups match_callups_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.match_callups
    ADD CONSTRAINT match_callups_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: match_callups match_callups_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.match_callups
    ADD CONSTRAINT match_callups_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: match_callups match_callups_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.match_callups
    ADD CONSTRAINT match_callups_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: match_callups match_callups_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.match_callups
    ADD CONSTRAINT match_callups_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: matches matches_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: matches matches_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_stock_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_stock_item_id_fkey FOREIGN KEY (stock_item_id) REFERENCES public.stock_items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: orders orders_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: orders orders_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_payer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_payer_id_fkey FOREIGN KEY (payer_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payments payments_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_processed_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_processed_by_user_id_fkey FOREIGN KEY (processed_by_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: player_team_history player_team_history_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.player_team_history
    ADD CONSTRAINT player_team_history_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: player_team_history player_team_history_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.player_team_history
    ADD CONSTRAINT player_team_history_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: player_team_history player_team_history_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.player_team_history
    ADD CONSTRAINT player_team_history_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: players players_athlete_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES public.athletes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: players players_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: players players_current_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_current_team_id_fkey FOREIGN KEY (current_team_id) REFERENCES public.teams(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: players players_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: seasons seasons_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.seasons
    ADD CONSTRAINT seasons_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_items stock_items_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.stock_items
    ADD CONSTRAINT stock_items_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_movements stock_movements_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: stock_movements stock_movements_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: stock_movements stock_movements_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: stock_movements stock_movements_stock_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_stock_item_id_fkey FOREIGN KEY (stock_item_id) REFERENCES public.stock_items(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: teams teams_assistant_coach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_assistant_coach_id_fkey FOREIGN KEY (assistant_coach_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: teams teams_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: teams teams_head_coach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_head_coach_id_fkey FOREIGN KEY (head_coach_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: teams teams_season_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_season_id_fkey FOREIGN KEY (season_id) REFERENCES public.seasons(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: training_attendance training_attendance_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.training_attendance
    ADD CONSTRAINT training_attendance_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: training_attendance training_attendance_marked_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.training_attendance
    ADD CONSTRAINT training_attendance_marked_by_user_id_fkey FOREIGN KEY (marked_by_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: training_attendance training_attendance_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.training_attendance
    ADD CONSTRAINT training_attendance_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.players(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: training_attendance training_attendance_training_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.training_attendance
    ADD CONSTRAINT training_attendance_training_id_fkey FOREIGN KEY (training_id) REFERENCES public.trainings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: trainings trainings_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.trainings
    ADD CONSTRAINT trainings_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: trainings trainings_coach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.trainings
    ADD CONSTRAINT trainings_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: trainings trainings_finalized_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.trainings
    ADD CONSTRAINT trainings_finalized_by_user_id_fkey FOREIGN KEY (finalized_by_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: trainings trainings_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.trainings
    ADD CONSTRAINT trainings_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: transfer_requests transfer_requests_athlete_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.transfer_requests
    ADD CONSTRAINT transfer_requests_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES public.athletes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: transfer_requests transfer_requests_from_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.transfer_requests
    ADD CONSTRAINT transfer_requests_from_club_id_fkey FOREIGN KEY (from_club_id) REFERENCES public.clubs(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transfer_requests transfer_requests_to_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.transfer_requests
    ADD CONSTRAINT transfer_requests_to_club_id_fkey FOREIGN KEY (to_club_id) REFERENCES public.clubs(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: users users_club_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_global_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: sports_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_global_parent_id_fkey FOREIGN KEY (global_parent_id) REFERENCES public.global_parents(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: sports_admin
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict ilFvfidOCzydGyT9x0saOB0YWCr0HyCTPaDfBjIVpfVRJg8DGQnFLbmDKAwl2gD

