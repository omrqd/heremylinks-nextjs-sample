# MySQL Database Setup Guide for HereMyLinks

This guide will help you set up MySQL database for your HereMyLinks application.

## 📋 Prerequisites

- Node.js 18+ installed
- MySQL 8.0+ installed
- Basic knowledge of terminal/command line

---

## 🚀 Quick Start

### Step 1: Install MySQL

#### macOS (using Homebrew)
```bash
brew install mysql
brew services start mysql
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

#### Windows
1. Download MySQL installer from [mysql.com](https://dev.mysql.com/downloads/mysql/)
2. Run the installer and follow the setup wizard
3. Remember the root password you set during installation

---

### Step 2: Secure MySQL Installation (Recommended)

```bash
sudo mysql_secure_installation
```

Follow the prompts:
- Set root password (if not set during installation)
- Remove anonymous users: **Yes**
- Disallow root login remotely: **Yes**
- Remove test database: **Yes**
- Reload privilege tables: **Yes**

---

### Step 3: Create Database and User

1. **Login to MySQL**:
```bash
mysql -u root -p
```
Enter your root password when prompted.

2. **Create the database**:
```sql
CREATE DATABASE heremylinks CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. **Create a dedicated user** (recommended for security):
```sql
CREATE USER 'heremylinks_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON heremylinks.* TO 'heremylinks_user'@'localhost';
FLUSH PRIVILEGES;
```

4. **Exit MySQL**:
```sql
EXIT;
```

---

### Step 4: Import Database Schema

Navigate to your project directory and import the schema:

```bash
mysql -u heremylinks_user -p heremylinks < database/schema.sql
```

Or from within MySQL:
```bash
mysql -u heremylinks_user -p
```

Then:
```sql
USE heremylinks;
SOURCE /full/path/to/database/schema.sql;
```

---

### Step 5: Configure Environment Variables

1. **Create `.env.local` file** in your project root:

```bash
touch .env.local
```

2. **Add these variables**:

```env
# MySQL Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=heremylinks_user
MYSQL_PASSWORD=your_secure_password
MYSQL_DATABASE=heremylinks

# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_random_secret_here

# Optional: OAuth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_ID=
APPLE_SECRET=
```

3. **Generate NEXTAUTH_SECRET**:

```bash
openssl rand -base64 32
```

Copy the output and paste it as your `NEXTAUTH_SECRET`.

---

### Step 6: Install Dependencies

```bash
npm install
```

---

### Step 7: Start Development Server

```bash
npm run dev
```

You should see:
```
✅ MySQL database connected successfully
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## 🔍 Verify Database Tables

Check if all tables were created:

```bash
mysql -u heremylinks_user -p heremylinks
```

Then run:
```sql
SHOW TABLES;
```

You should see:
```
+-------------------------+
| Tables_in_heremylinks   |
+-------------------------+
| accounts                |
| bio_links               |
| link_clicks             |
| page_views              |
| sessions                |
| users                   |
| verification_tokens     |
+-------------------------+
```

---

## 🔧 Troubleshooting

### Connection Error: "Access denied for user"

**Problem**: Wrong username/password in `.env.local`

**Solution**: 
1. Verify credentials in MySQL:
```sql
SELECT User, Host FROM mysql.user WHERE User = 'heremylinks_user';
```

2. Reset password if needed:
```sql
ALTER USER 'heremylinks_user'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

---

### Error: "Can't connect to MySQL server"

**Problem**: MySQL service not running

**Solution**:
- **macOS**: `brew services start mysql`
- **Ubuntu**: `sudo systemctl start mysql`
- **Windows**: Start MySQL service from Services app

---

### Error: "Database 'heremylinks' does not exist"

**Solution**:
```sql
CREATE DATABASE heremylinks CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

### Port 3306 Already in Use

**Solution**: Change MySQL port in `/etc/mysql/my.cnf` and update `MYSQL_PORT` in `.env.local`

---

## 📊 Database Schema Overview

### **users** - User accounts and profiles
- Stores user credentials, profile data, and customization settings
- Handles both email/password and OAuth authentication

### **accounts** - OAuth provider accounts
- Links users to their Google/Apple OAuth accounts
- Stores OAuth tokens and refresh tokens

### **sessions** - User sessions (NextAuth.js)
- Manages active user sessions
- Handles JWT token validation

### **verification_tokens** - Email verification
- Temporary tokens for email verification
- Used for password resets

### **bio_links** - User's bio page links
- Stores all links displayed on user's bio page
- Supports multiple layouts and custom styling
- Tracks click counts

### **page_views** - Analytics data
- Tracks page views for each user's bio page
- Stores visitor information (IP, location, referrer)

### **link_clicks** - Link analytics
- Tracks individual link clicks
- Helps users understand which links perform best

---

## 🌐 Production Deployment

### For Production MySQL Database:

1. **Update `.env.production`**:
```env
MYSQL_HOST=your_production_host.com
MYSQL_PORT=3306
MYSQL_USER=production_user
MYSQL_PASSWORD=strong_production_password
MYSQL_DATABASE=heremylinks_prod
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=different_strong_secret_for_production
```

2. **Enable SSL for MySQL connection** (highly recommended):

Update `lib/db.ts`:
```typescript
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  ssl: {
    rejectUnauthorized: true,
  },
  // ... other options
});
```

3. **Security Best Practices**:
- Use strong, unique passwords
- Enable MySQL firewall rules
- Use SSL/TLS for connections
- Regularly backup your database
- Keep MySQL updated
- Use connection pooling (already configured)

---

## 🔐 OAuth Setup (Optional)

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
7. Copy **Client ID** and **Client Secret** to `.env.local`

### Apple OAuth

1. Go to [Apple Developer](https://developer.apple.com/)
2. Create an **App ID**
3. Create a **Services ID**
4. Configure **Sign in with Apple**
5. Add redirect URI: `https://yourdomain.com/api/auth/callback/apple`
6. Generate a **private key**
7. Configure in `.env.local`

---

## 📚 Useful MySQL Commands

```sql
-- View all databases
SHOW DATABASES;

-- Select database
USE heremylinks;

-- View all tables
SHOW TABLES;

-- Describe table structure
DESCRIBE users;

-- Count users
SELECT COUNT(*) FROM users;

-- View recent users
SELECT id, email, username, created_at FROM users ORDER BY created_at DESC LIMIT 10;

-- View all bio links for a user
SELECT title, url, layout FROM bio_links WHERE user_id = 'user_id_here' ORDER BY `order`;

-- Backup database
mysqldump -u heremylinks_user -p heremylinks > backup_$(date +%Y%m%d).sql

-- Restore database
mysql -u heremylinks_user -p heremylinks < backup_20250101.sql
```

---

## ✅ You're All Set!

Your MySQL database is now configured and ready to use with HereMyLinks!

**Next Steps**:
1. Register a new user at: `http://localhost:3000/login`
2. Create your bio page at: `http://localhost:3000/dashboard`
3. Add links and customize your page

For issues or questions, refer to the troubleshooting section above or check the MySQL documentation.

Happy building! 🚀

