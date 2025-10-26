# Migration from Turso/Drizzle to MySQL

This document explains the changes made when migrating from Turso + Drizzle ORM to MySQL with raw SQL queries.

## 🔄 What Changed

### Removed
- ❌ **@libsql/client** - Turso database client
- ❌ **drizzle-orm** - Drizzle ORM
- ❌ **drizzle-kit** - Drizzle schema management tools
- ❌ **@auth/drizzle-adapter** - Drizzle adapter for NextAuth
- ❌ `drizzle/` folder - All schema and migration files
- ❌ `drizzle.config.ts` - Drizzle configuration
- ❌ All Turso-related documentation files

### Added
- ✅ **mysql2** - MySQL database client (with Promise support)
- ✅ **uuid** - For generating unique IDs (replaces Drizzle's auto ID generation)
- ✅ `database/schema.sql` - MySQL database schema
- ✅ `lib/db.ts` - MySQL connection pool
- ✅ Updated `lib/auth.ts` - Custom NextAuth adapter for MySQL
- ✅ All API routes rewritten to use raw SQL queries
- ✅ `MYSQL_SETUP_GUIDE.md` - Complete MySQL setup guide
- ✅ `ENV_SETUP.md` - Environment variables guide

---

## 📁 File Changes

### New Files Created

1. **`lib/db.ts`**
   - MySQL connection pool using `mysql2/promise`
   - Handles database connections throughout the app
   - Auto-tests connection on startup

2. **`database/schema.sql`**
   - Complete MySQL schema with all tables
   - Includes indexes and foreign keys
   - UTF-8 support for international characters

3. **`lib/auth.ts`** (completely rewritten)
   - Custom NextAuth configuration without Drizzle adapter
   - Manual OAuth user creation and management
   - Direct SQL queries for authentication

4. **API Routes** (all rewritten):
   - `app/api/auth/register/route.ts` - User registration with bcrypt
   - `app/api/auth/[...nextauth]/route.ts` - NextAuth handler
   - `app/api/user/profile/route.ts` - User profile CRUD operations
   - `app/api/links/route.ts` - Bio links CRUD operations

5. **Documentation**:
   - `MYSQL_SETUP_GUIDE.md` - Complete MySQL setup instructions
   - `ENV_SETUP.md` - Environment variables configuration
   - `MIGRATION_TO_MYSQL.md` - This file

---

## 🗄️ Database Schema

The MySQL database uses the same structure as before, with these tables:

### Core Tables
- **users** - User accounts and profiles
- **accounts** - OAuth provider accounts (Google, Apple)
- **sessions** - NextAuth.js session management
- **verification_tokens** - Email verification and password resets

### Application Tables
- **bio_links** - User's bio page links with layouts
- **page_views** - Analytics for page views
- **link_clicks** - Analytics for link clicks

### Key Differences from Drizzle

| Feature | Drizzle ORM | MySQL (Raw SQL) |
|---------|-------------|-----------------|
| **Queries** | TypeScript methods | Raw SQL queries |
| **Type Safety** | Built-in TypeScript types | Manual TypeScript interfaces |
| **Migrations** | `drizzle-kit generate/push` | Manual SQL schema import |
| **Relationships** | Automatic joins | Manual JOIN queries |
| **ID Generation** | Auto UUID/increment | Manual `uuid()` generation |
| **Schema Updates** | TypeScript → SQL | Direct SQL modification |

---

## 🔧 Environment Variables

### Old (Turso):
```env
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
```

### New (MySQL):
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=heremylinks_user
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=heremylinks
```

**Important**: Create a `.env.local` file with your MySQL credentials. See `ENV_SETUP.md` for details.

---

## 📊 Code Examples

### Before (Drizzle ORM)

```typescript
// Query with Drizzle
const user = await db.query.users.findFirst({
  where: eq(users.email, email),
});

// Insert with Drizzle
await db.insert(users).values({
  id: uuidv4(),
  email,
  password: hashedPassword,
});
```

### After (MySQL Raw SQL)

```typescript
// Query with mysql2
const [rows] = await db.query<User[]>(
  'SELECT * FROM users WHERE email = ? LIMIT 1',
  [email]
);
const user = rows[0];

// Insert with mysql2
await db.query(
  'INSERT INTO users (id, email, password) VALUES (?, ?, ?)',
  [uuidv4(), email, hashedPassword]
);
```

---

## 🚀 Migration Steps for Developers

If you're migrating from the old Turso version to this MySQL version:

### 1. Remove Old Dependencies
```bash
npm uninstall @libsql/client drizzle-orm drizzle-kit @auth/drizzle-adapter
```

### 2. Install New Dependencies
```bash
npm install mysql2 uuid
npm install -D @types/uuid
```

### 3. Setup MySQL Database
Follow the instructions in `MYSQL_SETUP_GUIDE.md`:
- Install MySQL
- Create database and user
- Import schema from `database/schema.sql`

### 4. Configure Environment Variables
Create `.env.local` with MySQL credentials (see `ENV_SETUP.md`)

### 5. Start Development Server
```bash
npm run dev
```

You should see: `✅ MySQL database connected successfully`

---

## 🔐 Security Considerations

### MySQL Advantages
- ✅ More mature and widely supported
- ✅ Better tooling and GUI clients (MySQL Workbench, phpMyAdmin)
- ✅ Easier backups and migrations
- ✅ Self-hosted (full control over data)
- ✅ No vendor lock-in
- ✅ Better performance monitoring tools

### Security Best Practices
- Use dedicated database user (not root)
- Strong passwords
- SSL/TLS for connections in production
- Regular backups
- Keep MySQL updated
- Proper firewall configuration

---

## 🆘 Troubleshooting

### "Cannot find module 'drizzle-orm'"
**Solution**: Clear node_modules and reinstall
```bash
rm -rf node_modules package-lock.json
npm install
```

### "MySQL connection error"
**Solution**: Check MySQL service is running
```bash
# macOS
brew services start mysql

# Ubuntu
sudo systemctl start mysql
```

### "Access denied for user"
**Solution**: Verify credentials in `.env.local` match MySQL user

---

## 📈 Performance Comparison

| Aspect | Turso + Drizzle | MySQL |
|--------|-----------------|-------|
| **Setup Complexity** | Medium (Cloud service) | Low (Local install) |
| **Query Speed** | Fast (Edge-optimized) | Very Fast (Local network) |
| **Scalability** | Auto-scaling | Manual scaling |
| **Cost** | Usage-based | Free (self-hosted) |
| **Control** | Limited | Full control |
| **Tooling** | Limited | Extensive |

---

## ✅ Testing Checklist

After migration, test these features:

- [ ] User registration (email/password)
- [ ] User login (email/password)
- [ ] Google OAuth login (if configured)
- [ ] Apple OAuth login (if configured)
- [ ] Profile editing (name, bio, image)
- [ ] Adding bio links
- [ ] Deleting bio links
- [ ] Publishing page
- [ ] TikTok autofill feature
- [ ] Session persistence

---

## 📚 Additional Resources

- [MySQL Documentation](https://dev.mysql.com/doc/)
- [mysql2 Package](https://github.com/sidorares/node-mysql2)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [MySQL Workbench](https://www.mysql.com/products/workbench/) - GUI tool

---

## 🎯 Next Steps

1. ✅ Setup MySQL (follow `MYSQL_SETUP_GUIDE.md`)
2. ✅ Configure environment variables
3. ✅ Test all authentication flows
4. ✅ Add your bio links
5. 🚀 Deploy to production

---

**Need help?** Check `MYSQL_SETUP_GUIDE.md` or review the API routes in `app/api/` for implementation details.

