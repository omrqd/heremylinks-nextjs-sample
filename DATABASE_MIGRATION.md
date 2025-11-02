# Cloudflare D1 Database Migration Guide

This guide will help you migrate from MySQL to Cloudflare D1 database.

## 📋 Prerequisites

1. Cloudflare account
2. Wrangler CLI installed
3. Existing Next.js project

## 🚀 Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
# or
pnpm add -g wrangler
```

## 🔐 Step 2: Login to Cloudflare

```bash
wrangler login
```

This will open your browser to authenticate with Cloudflare.

## 🗄️ Step 3: Create D1 Database

```bash
wrangler d1 create heremylinks-db
```

**Important:** Save the output! It will show:
- `database_name`: heremylinks-db
- `database_id`: A UUID like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

Copy the `database_id` and paste it into `wrangler.toml` file:

```toml
[[d1_databases]]
binding = "DB"
database_name = "heremylinks-db"
database_id = "paste-your-database-id-here"
```

## 📊 Step 4: Initialize Database Schema

Run the D1 schema to create all tables:

```bash
wrangler d1 execute heremylinks-db --remote --file=./database/d1-schema.sql
```

## 🧪 Step 5: Test Database Connection (Local)

For local development:

```bash
# Create local D1 database
wrangler d1 execute heremylinks-db --local --file=./database/d1-schema.sql

# Start local development
wrangler pages dev
```

## 📦 Step 6: Export Your Existing MySQL Data

If you have existing MySQL data you want to migrate:

1. **Export users table:**
```bash
mysqldump -u root -p heremylinks users --no-create-info --compact > users_data.sql
```

2. **Export other tables:**
```bash
mysqldump -u root -p heremylinks accounts bio_links social_links --no-create-info --compact > other_data.sql
```

3. **Convert MySQL syntax to SQLite:**
   - Remove backticks from column names
   - Change `\'` to `''` for escaping
   - Remove `ENGINE=` and `CHARSET=` statements

4. **Import to D1:**
```bash
wrangler d1 execute heremylinks-db --remote --file=./users_data.sql
wrangler d1 execute heremylinks-db --remote --file=./other_data.sql
```

## 🔧 Step 7: Update Environment Variables

Create `.dev.vars` file for local development (copy from `.dev.vars.example`):

```bash
cp .dev.vars.example .dev.vars
```

Update your production environment variables in Cloudflare Dashboard:
- Go to Workers & Pages → Your App → Settings → Variables

## 🌐 Step 8: Deploy to Cloudflare Pages

```bash
# Build your Next.js app
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy .next
```

## ✅ Verify Database

Check your D1 database:

```bash
# List all databases
wrangler d1 list

# Query your database
wrangler d1 execute heremylinks-db --remote --command "SELECT COUNT(*) FROM users"

# View all tables
wrangler d1 execute heremylinks-db --remote --command "SELECT name FROM sqlite_master WHERE type='table'"
```

## 🔍 Debugging

View D1 logs:
```bash
wrangler tail
```

## 📝 Important Notes

1. **D1 uses SQLite** - Some MySQL features are not available:
   - No AUTO_INCREMENT (use UUIDs instead - already implemented)
   - DATETIME is stored as TEXT
   - BIGINT is stored as INTEGER
   - No stored procedures

2. **Rate Limits:**
   - Free tier: 5 million reads/day
   - First 25 million rows read are free

3. **Local Development:**
   - Use `wrangler pages dev` instead of `next dev` for local D1 access
   - Or use `--local` flag with wrangler commands

4. **Data Migration:**
   - Export existing data from MySQL before switching
   - Test thoroughly in development before production

## 🆘 Troubleshooting

**Issue: D1 not available in development**
```bash
# Make sure you're using wrangler dev
wrangler pages dev npm run dev
```

**Issue: Foreign key constraints**
```bash
# Enable foreign keys in D1 queries
wrangler d1 execute heremylinks-db --remote --command "PRAGMA foreign_keys = ON"
```

**Issue: Schema changes**
```bash
# Run migrations
wrangler d1 execute heremylinks-db --remote --file=./database/migrations/your-migration.sql
```

## 📚 Resources

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [D1 Pricing](https://developers.cloudflare.com/d1/platform/pricing/)

