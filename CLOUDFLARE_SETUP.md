# 🚀 Cloudflare D1 Database Setup Guide

## What I've Done For You

✅ Created D1-compatible database schema (`database/d1-schema.sql`)  
✅ Created Cloudflare configuration file (`wrangler.toml`)  
✅ Created D1 database helper functions (`lib/d1-db.ts`)  
✅ Added npm scripts for easy database management  
✅ Installed Wrangler CLI  
✅ Created migration documentation  

---

## 🎯 What You Need To Do

### Step 1: Login to Cloudflare

```bash
npx wrangler login
```

This will open your browser. Log in with your Cloudflare account.

---

### Step 2: Create D1 Database

```bash
npm run db:create
```

**IMPORTANT:** After running this, you'll see output like:

```
✅ Successfully created DB 'heremylinks-db'

[[d1_databases]]
binding = "DB"
database_name = "heremylinks-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  ⬅️ COPY THIS!
```

**Copy the `database_id`** and paste it into your `wrangler.toml` file:

```toml
[[d1_databases]]
binding = "DB"
database_name = "heremylinks-db"
database_id = "paste-your-database-id-here"  ⬅️ PASTE HERE
```

---

### Step 3: Initialize Database Schema

Run this to create all tables in your D1 database:

```bash
npm run db:migrate
```

This creates:
- `users` table
- `accounts` table
- `bio_links` table  
- `social_links` table
- All indexes and foreign keys

---

### Step 4: Verify Database Creation

Check that everything is set up:

```bash
# List all databases
npx wrangler d1 list

# Check tables
npx wrangler d1 execute heremylinks-db --remote --command "SELECT name FROM sqlite_master WHERE type='table'"
```

You should see: `users`, `accounts`, `bio_links`, `social_links`

---

## 📊 In Your Cloudflare Dashboard

### Go to Cloudflare Dashboard

1. Visit [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **D1**
3. You should see your database: **heremylinks-db**

### View Your Database

Click on **heremylinks-db** to:
- View all tables
- Run SQL queries directly in the browser
- Monitor usage and performance
- View metrics (reads/writes)

### Set Up Pages Project (for deployment)

1. Go to **Workers & Pages** → **Create Application** → **Pages**
2. Connect to your GitHub repository
3. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
   - **Framework preset**: Next.js

4. Add environment variables:
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `APPLE_ID`
   - `APPLE_SECRET`
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`
   - `R2_PUBLIC_URL`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`

5. In **Settings** → **Functions** → **D1 database bindings**:
   - Add binding: `DB` → Select `heremylinks-db`

---

## 🔧 Local Development

For local development with D1:

```bash
# Initialize local D1 database
npm run db:migrate:local

# Start development server with D1 access
npm run dev:wrangler
```

Or use regular dev (but D1 won't be available):
```bash
npm run dev
```

---

## 📦 Migrating Existing MySQL Data

If you have existing data in MySQL you want to keep:

### 1. Export from MySQL

```bash
# Export users
mysqldump -u root -p heremylinks users --no-create-info --compact --skip-extended-insert > mysql-users.sql

# Export accounts
mysqldump -u root -p heremylinks accounts --no-create-info --compact --skip-extended-insert > mysql-accounts.sql

# Export bio_links
mysqldump -u root -p heremylinks bio_links --no-create-info --compact --skip-extended-insert > mysql-bio-links.sql

# Export social_links
mysqldump -u root -p heremylinks social_links --no-create-info --compact --skip-extended-insert > mysql-social-links.sql
```

### 2. Convert MySQL to SQLite Format

You'll need to edit the exported files:

**Changes needed:**
- Remove backticks: `` `column_name` `` → `column_name`
- Replace `\\'` with `''` for escaping quotes
- Remove any MySQL-specific syntax
- Change `0000-00-00 00:00:00` to `NULL` or proper dates

### 3. Import to D1

```bash
npx wrangler d1 execute heremylinks-db --remote --file=./mysql-users.sql
npx wrangler d1 execute heremylinks-db --remote --file=./mysql-accounts.sql
npx wrangler d1 execute heremylinks-db --remote --file=./mysql-bio-links.sql
npx wrangler d1 execute heremylinks-db --remote --file=./mysql-social-links.sql
```

---

## 🧪 Testing Your D1 Database

### Query Users
```bash
npm run db:query "SELECT COUNT(*) as total FROM users"
```

### Add a Test User
```bash
npx wrangler d1 execute heremylinks-db --remote --command "INSERT INTO users (id, username, email, name) VALUES ('test-123', 'testuser', 'test@example.com', 'Test User')"
```

### View Recent Users
```bash
npx wrangler d1 execute heremylinks-db --remote --command "SELECT username, email, created_at FROM users ORDER BY created_at DESC LIMIT 5"
```

---

## 🔍 Useful Commands

| Command | Description |
|---------|-------------|
| `npm run db:create` | Create new D1 database |
| `npm run db:migrate` | Run schema migrations (remote) |
| `npm run db:migrate:local` | Run schema migrations (local) |
| `npm run db:query "SQL"` | Run SQL query (remote) |
| `npm run db:query:local "SQL"` | Run SQL query (local) |
| `npx wrangler d1 list` | List all D1 databases |
| `npx wrangler d1 info heremylinks-db` | Show database info |
| `npx wrangler tail` | View live logs |

---

## 📊 D1 Pricing (Free Tier)

- ✅ **5 million reads/day** - FREE
- ✅ **100,000 writes/day** - FREE  
- ✅ **5 GB storage** - FREE
- ✅ **25 million rows read/month** - FREE

Perfect for most applications! 🎉

---

## ⚠️ Important Notes

1. **D1 uses SQLite syntax** - not MySQL
   - No `AUTO_INCREMENT` (we use UUIDs ✅)
   - `DATETIME` stored as `TEXT`
   - `TINYINT` becomes `INTEGER`

2. **Foreign Keys**
   - D1 supports foreign keys
   - Cascading deletes work properly
   - Already configured in schema ✅

3. **Connection Handling**
   - D1 is serverless - no connection pooling needed
   - Automatic scaling
   - Built-in edge caching

4. **Local Development**
   - Use `npm run dev:wrangler` for D1 access
   - Or use `npm run dev` and connect to remote D1

---

## 🆘 Troubleshooting

### Error: "D1 Database not available"
```bash
# Make sure database_id is set in wrangler.toml
# Make sure you're running with wrangler
npm run dev:wrangler
```

### Error: "Table already exists"
```bash
# Drop and recreate tables
npx wrangler d1 execute heremylinks-db --remote --command "DROP TABLE IF EXISTS users; DROP TABLE IF EXISTS accounts; DROP TABLE IF EXISTS bio_links; DROP TABLE IF EXISTS social_links"
npm run db:migrate
```

### Error: "No such column"
```bash
# Check your schema
npx wrangler d1 execute heremylinks-db --remote --command "PRAGMA table_info(users)"
```

### View Logs
```bash
npx wrangler tail
```

---

## 📚 Next Steps

1. ✅ Complete Steps 1-4 above
2. 🔄 Update your application code to use D1 (see `lib/d1-db.ts`)
3. 🧪 Test locally with `npm run dev:wrangler`
4. 🚀 Deploy to Cloudflare Pages
5. 🎉 Enjoy serverless database!

---

## 🔗 Useful Links

- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [D1 Examples](https://developers.cloudflare.com/d1/examples/)
- [Cloudflare Dashboard](https://dash.cloudflare.com/)

---

Need help? Check `DATABASE_MIGRATION.md` for more detailed migration instructions!

