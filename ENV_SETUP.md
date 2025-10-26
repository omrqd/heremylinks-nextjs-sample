# Environment Variables Setup

Create a `.env` or `.env.local` file in the root directory with the following variables:

```env
# MySQL Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password_here
MYSQL_DATABASE=heremylinks

# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Google OAuth (Optional - for social login)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Apple OAuth (Optional - for social login)
APPLE_ID=your_apple_id
APPLE_SECRET=your_apple_secret
```

## How to Generate NEXTAUTH_SECRET

Run this command in your terminal:

```bash
openssl rand -base64 32
```

Copy the output and use it as your `NEXTAUTH_SECRET`.

## MySQL Database Setup

1. **Install MySQL** (if not already installed):
   - **macOS**: `brew install mysql`
   - **Ubuntu**: `sudo apt-get install mysql-server`
   - **Windows**: Download from [mysql.com](https://dev.mysql.com/downloads/mysql/)

2. **Start MySQL service**:
   - **macOS**: `brew services start mysql`
   - **Ubuntu**: `sudo systemctl start mysql`
   - **Windows**: Start via Services

3. **Secure MySQL installation** (recommended):
   ```bash
   sudo mysql_secure_installation
   ```

4. **Login to MySQL**:
   ```bash
   mysql -u root -p
   ```

5. **Create database and user**:
   ```sql
   CREATE DATABASE heremylinks CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'heremylinks_user'@'localhost' IDENTIFIED BY 'your_secure_password';
   GRANT ALL PRIVILEGES ON heremylinks.* TO 'heremylinks_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

6. **Import the schema**:
   ```bash
   mysql -u heremylinks_user -p heremylinks < database/schema.sql
   ```

   Or from MySQL prompt:
   ```sql
   USE heremylinks;
   SOURCE /path/to/database/schema.sql;
   ```

7. **Update your .env file** with the credentials:
   ```env
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=heremylinks_user
   MYSQL_PASSWORD=your_secure_password
   MYSQL_DATABASE=heremylinks
   ```

## Verify Connection

After setup, run the development server:

```bash
npm run dev
```

You should see: `✅ MySQL database connected successfully`

If you see an error, check:
- MySQL service is running
- Database credentials in `.env` are correct
- Database and user were created successfully
- Firewall isn't blocking port 3306

## OAuth Setup (Optional)

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to your `.env` file

### Apple OAuth

1. Go to [Apple Developer](https://developer.apple.com/)
2. Create an App ID and Services ID
3. Configure Sign in with Apple
4. Add redirect URI: `http://localhost:3000/api/auth/callback/apple`
5. Generate a private key and configure in `.env`

## Production Environment

For production, use:

```env
NEXTAUTH_URL=https://yourdomain.com
MYSQL_HOST=your_production_mysql_host
# ... other production values
```

Make sure to:
- Use strong passwords
- Enable SSL for MySQL connection in production
- Keep `.env` files out of version control (already in `.gitignore`)

