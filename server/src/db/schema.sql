-- PERFEKT AGENCY / PERFEKT Academy — schéma PostgreSQL
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(190) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student','instructor','admin')),
  phone         VARCHAR(40),
  country       VARCHAR(80),
  city          VARCHAR(80),
  bio           TEXT,
  avatar_url    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  reset_token   TEXT,
  reset_expires TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sessions = appareils connectés (limitation du partage de comptes)
CREATE TABLE IF NOT EXISTS sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device     TEXT,
  ip         VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS courses (
  id                SERIAL PRIMARY KEY,
  slug              VARCHAR(180) NOT NULL UNIQUE,
  title             VARCHAR(200) NOT NULL,
  subtitle          TEXT,
  description       TEXT,
  category_id       INT REFERENCES categories(id) ON DELETE SET NULL,
  level             VARCHAR(30) NOT NULL DEFAULT 'Débutant',
  price             INT NOT NULL DEFAULT 0,
  promo_price       INT,
  duration_hours    NUMERIC(5,1) NOT NULL DEFAULT 0,
  image_url         TEXT,
  preview_video_url TEXT,
  objectives        JSONB NOT NULL DEFAULT '[]',
  prerequisites     JSONB NOT NULL DEFAULT '[]',
  skills            JSONB NOT NULL DEFAULT '[]',
  faq               JSONB NOT NULL DEFAULT '[]',
  final_project     TEXT,
  instructor_name   VARCHAR(120),
  pass_score        INT NOT NULL DEFAULT 70,
  downloads_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  published         BOOLEAN NOT NULL DEFAULT TRUE,
  featured          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS modules (
  id        SERIAL PRIMARY KEY,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title     VARCHAR(200) NOT NULL,
  position  INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lessons (
  id           SERIAL PRIMARY KEY,
  module_id    INT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title        VARCHAR(200) NOT NULL,
  type         VARCHAR(20) NOT NULL DEFAULT 'video' CHECK (type IN ('video','pdf','text','exercise')),
  video_url    TEXT,
  file_url     TEXT,
  content      TEXT,
  duration_min INT NOT NULL DEFAULT 0,
  position     INT NOT NULL DEFAULT 0,
  is_preview   BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS quizzes (
  id        SERIAL PRIMARY KEY,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id INT REFERENCES modules(id) ON DELETE CASCADE,
  title     VARCHAR(200) NOT NULL,
  is_final  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS questions (
  id            SERIAL PRIMARY KEY,
  quiz_id       INT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question      TEXT NOT NULL,
  options       JSONB NOT NULL DEFAULT '[]',
  correct_index INT NOT NULL DEFAULT 0,
  position      INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS enrollments (
  id           SERIAL PRIMARY KEY,
  user_id      INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id    INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  last_lesson_id INT,
  UNIQUE (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id          INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id        INT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed        BOOLEAN NOT NULL DEFAULT FALSE,
  position_seconds INT NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id    INT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score      INT NOT NULL,
  passed     BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS submissions (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id  INT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  grade      INT,
  feedback   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS certificates (
  id        SERIAL PRIMARY KEY,
  number    VARCHAR(40) NOT NULL UNIQUE,
  user_id   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  score     INT NOT NULL,
  signature TEXT NOT NULL,
  revoked   BOOLEAN NOT NULL DEFAULT FALSE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS coupons (
  id         SERIAL PRIMARY KEY,
  code       VARCHAR(40) NOT NULL UNIQUE,
  percent    INT NOT NULL CHECK (percent BETWEEN 1 AND 100),
  max_uses   INT,
  used       INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id              SERIAL PRIMARY KEY,
  reference       VARCHAR(40) NOT NULL UNIQUE,
  user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id       INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  original_amount INT NOT NULL,
  amount          INT NOT NULL,
  coupon_code     VARCHAR(40),
  method          VARCHAR(30) NOT NULL,
  phone           VARCHAR(40),
  status          VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at         TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id  INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  rating     INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  approved   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

-- Forum de discussion / questions au formateur (par leçon)
CREATE TABLE IF NOT EXISTS comments (
  id          SERIAL PRIMARY KEY,
  lesson_id   INT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id   INT REFERENCES comments(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  is_question BOOLEAN NOT NULL DEFAULT FALSE,
  approved    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notes personnelles de l'apprenant
CREATE TABLE IF NOT EXISTS notes (
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id  INT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  content    TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS posts (
  id              SERIAL PRIMARY KEY,
  slug            VARCHAR(200) NOT NULL UNIQUE,
  title           VARCHAR(220) NOT NULL,
  excerpt         TEXT,
  content         TEXT,
  category        VARCHAR(60) NOT NULL DEFAULT 'Actualités',
  cover_url       TEXT,
  author          VARCHAR(120),
  read_minutes    INT NOT NULL DEFAULT 4,
  seo_title       VARCHAR(220),
  seo_description TEXT,
  published       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id          SERIAL PRIMARY KEY,
  slug        VARCHAR(200) NOT NULL UNIQUE,
  title       VARCHAR(200) NOT NULL,
  category    VARCHAR(80) NOT NULL,
  client      VARCHAR(120),
  year        INT,
  description TEXT,
  cover_url   TEXT,
  before_url  TEXT,
  after_url   TEXT,
  gallery     JSONB NOT NULL DEFAULT '[]',
  featured    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quotes (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  email      VARCHAR(190) NOT NULL,
  phone      VARCHAR(40),
  company    VARCHAR(160),
  service    VARCHAR(120),
  budget     VARCHAR(60),
  message    TEXT,
  status     VARCHAR(20) NOT NULL DEFAULT 'nouveau',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  email      VARCHAR(190) NOT NULL,
  phone      VARCHAR(40),
  subject    VARCHAR(200),
  message    TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS newsletter (
  id         SERIAL PRIMARY KEY,
  email      VARCHAR(190) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(200) NOT NULL,
  body       TEXT,
  link       TEXT,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id         SERIAL PRIMARY KEY,
  user_id    INT REFERENCES users(id) ON DELETE SET NULL,
  action     VARCHAR(80) NOT NULL,
  meta       JSONB NOT NULL DEFAULT '{}',
  ip         VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  key   VARCHAR(80) PRIMARY KEY,
  value JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_courses_cat ON courses(category_id);
CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_lesson ON comments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);

-- Migrations douces
ALTER TABLE projects ADD COLUMN IF NOT EXISTS gallery JSONB NOT NULL DEFAULT '[]';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS sessions INT;
