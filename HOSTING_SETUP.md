# 🚀 Hosting Setup - DigitalOcean Server

## ⚠️ Important: D1 Migration Cancelled

**You are hosting on DigitalOcean, NOT Cloudflare!**

- ❌ Cloudflare D1 is **NOT compatible** with DigitalOcean hosting
- ✅ Your app uses **MySQL** database (correct for your setup)
- ✅ Continue using your existing `.env.local` configuration

---

## 📊 Your Current Setup

| Component | Technology | Location |
|-----------|-----------|----------|
| **Hosting** | DigitalOcean | heremylinks.com |
| **Database** | MySQL | DigitalOcean server |
| **File Storage** | Cloudflare R2 | Can use with any host |
| **Domain** | heremylinks.com | Your domain |

---

## 🔧 Environment Variables

Your `.env.local` should have these variables:

```env
# MySQL Database (REQUIRED for DigitalOcean)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=your_mysql_user
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=heremylinks

# NextAuth
NEXTAUTH_URL=https://heremylinks.com
NEXTAUTH_SECRET=pJaR4AIYypuXsxsz8Io0bKXuzQasNFrPPXjYsvutG7k=

# Google OAuth
GOOGLE_CLIENT_ID=518272672777-gtnguuk6laulid57v96lndl7f7td32in.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Apple OAuth
APPLE_ID=com.heremylinks.web
APPLE_SECRET=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjZDOVM4MzRLN1MifQ...

# Cloudflare R2 Storage (Works with DigitalOcean!)
R2_ACCOUNT_ID=0f07561727fad56842b7f940c9880512
R2_ACCESS_KEY_ID=bf3fff920df19a8171938db124202ed8
R2_SECRET_ACCESS_KEY=b3f12ba1d82c465b61b14cba5a5d4ae09149074c2806807adee34bd452ece131
R2_BUCKET_NAME=heremylinks
R2_ENDPOINT=https://0f07561727fad56842b7f940c9880512.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://cdn.heremylinks.com

# Email (Resend)
RESEND_API_KEY=re_SAHKDQRm_EYNDV6o31PZwXyMtkFYkR5GD
RESEND_FROM_EMAIL=noreply@heremylinks.com
```

---

## 🚀 Development Commands

```bash
# Start local development
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

---

## 📦 Deployment to DigitalOcean

### Step 1: Prepare Your Server

```bash
# SSH into your DigitalOcean server
ssh root@your-server-ip

# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Install MySQL (if not already installed)
sudo apt-get install mysql-server
```

### Step 2: Setup MySQL Database

```bash
# Login to MySQL
sudo mysql -u root -p

# Create database and user
CREATE DATABASE heremylinks;
CREATE USER 'heremylinks_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON heremylinks.* TO 'heremylinks_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 3: Import Database Schema

```bash
# Import your schema
mysql -u heremylinks_user -p heremylinks < database/schema.sql
```

### Step 4: Deploy Your App

```bash
# Clone or upload your code
git clone your-repo-url /var/www/heremylinks
cd /var/www/heremylinks

# Install dependencies
npm install

# Create .env.local file
nano .env.local
# (paste your environment variables)

# Build the app
npm run build

# Start with PM2
pm2 start npm --name "heremylinks" -- start
pm2 save
pm2 startup
```

### Step 5: Setup Nginx (Reverse Proxy)

```bash
# Install Nginx
sudo apt-get install nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/heremylinks.com
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name heremylinks.com www.heremylinks.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/heremylinks.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d heremylinks.com -d www.heremylinks.com

# Auto-renewal is set up automatically
```

---

## 🔄 Updates & Redeployment

```bash
# SSH into server
ssh root@your-server-ip

# Navigate to app directory
cd /var/www/heremylinks

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Rebuild
npm run build

# Restart the app
pm2 restart heremylinks
```

---

## 🔍 Monitoring & Logs

```bash
# View app logs
pm2 logs heremylinks

# View app status
pm2 status

# Monitor resources
pm2 monit

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🛠️ Troubleshooting

### App won't start
```bash
# Check PM2 logs
pm2 logs heremylinks --lines 100

# Check if port 3000 is in use
sudo lsof -i :3000

# Restart
pm2 restart heremylinks
```

### Database connection error
```bash
# Test MySQL connection
mysql -u heremylinks_user -p heremylinks

# Check MySQL status
sudo systemctl status mysql

# Restart MySQL
sudo systemctl restart mysql
```

### Nginx errors
```bash
# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# View error logs
sudo tail -f /var/log/nginx/error.log
```

---

## 📚 Quick Reference

| Task | Command |
|------|---------|
| Start dev server | `npm run dev` |
| Build for production | `npm run build` |
| Start production | `npm start` |
| View logs | `pm2 logs heremylinks` |
| Restart app | `pm2 restart heremylinks` |
| Update app | `git pull && npm install && npm run build && pm2 restart heremylinks` |

---

## ⚠️ Important Notes

1. **Do NOT use Cloudflare D1** - It only works on Cloudflare infrastructure
2. **Use MySQL** for your DigitalOcean server
3. **Cloudflare R2 works fine** - R2 is S3-compatible and works from any server
4. **Keep `.env.local`** with your MySQL credentials
5. **Always backup your MySQL database** before major updates

---

## 🎯 Your Setup is Perfect For:

✅ Full control over your server  
✅ Custom configurations  
✅ Direct database access  
✅ Traditional hosting  
✅ Existing infrastructure  

You made the right choice staying with DigitalOcean! 🚀

