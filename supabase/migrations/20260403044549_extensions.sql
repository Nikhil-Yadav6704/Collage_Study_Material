-- Enable required PostgreSQL extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";      -- for fuzzy text search
create extension if not exists "unaccent";      -- for accent-insensitive search
