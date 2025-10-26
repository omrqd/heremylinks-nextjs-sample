# MySQL Quick Reference for HereMyLinks

Quick reference for common MySQL operations you'll need while developing.

## 🔌 Connection

### Connect to MySQL
```bash
mysql -u heremylinks_user -p heremylinks
```

### Connect as root
```bash
mysql -u root -p
```

---

## 📊 Database Operations

### View all databases
```sql
SHOW DATABASES;
```

### Create database
```sql
CREATE DATABASE heremylinks CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Use database
```sql
USE heremylinks;
```

### Drop database (⚠️ CAUTION)
```sql
DROP DATABASE heremylinks;
```

---

## 📋 Table Operations

### View all tables
```sql
SHOW TABLES;
```

### Describe table structure
```sql
DESCRIBE users;
-- or
SHOW COLUMNS FROM users;
```

### View table creation SQL
```sql
SHOW CREATE TABLE users;
```

### Drop table (⚠️ CAUTION)
```sql
DROP TABLE table_name;
```

---

## 👤 User Management

### View all users
```sql
SELECT User, Host FROM mysql.user;
```

### Create user
```sql
CREATE USER 'username'@'localhost' IDENTIFIED BY 'password';
```

### Grant privileges
```sql
GRANT ALL PRIVILEGES ON heremylinks.* TO 'heremylinks_user'@'localhost';
FLUSH PRIVILEGES;
```

### Change user password
```sql
ALTER USER 'heremylinks_user'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

### Delete user
```sql
DROP USER 'username'@'localhost';
```

---

## 🔍 Query Data

### View all users
```sql
SELECT id, email, username, name, created_at FROM users;
```

### View user by email
```sql
SELECT * FROM users WHERE email = 'user@example.com';
```

### Count users
```sql
SELECT COUNT(*) as total_users FROM users;
```

### View recent users (last 10)
```sql
SELECT id, email, username, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;
```

### View user's bio links
```sql
SELECT title, url, layout, `order` 
FROM bio_links 
WHERE user_id = 'user_id_here' 
ORDER BY `order` ASC;
```

### View users with published pages
```sql
SELECT email, username, is_published 
FROM users 
WHERE is_published = TRUE;
```

### Search users by username
```sql
SELECT id, username, email 
FROM users 
WHERE username LIKE '%search_term%';
```

---

## ✏️ Modify Data

### Update user's name
```sql
UPDATE users 
SET name = 'New Name' 
WHERE email = 'user@example.com';
```

### Update user's bio
```sql
UPDATE users 
SET bio = 'My awesome bio' 
WHERE id = 'user_id_here';
```

### Publish user's page
```sql
UPDATE users 
SET is_published = TRUE 
WHERE email = 'user@example.com';
```

### Update link title
```sql
UPDATE bio_links 
SET title = 'New Title' 
WHERE id = 'link_id_here';
```

### Reorder links
```sql
UPDATE bio_links 
SET `order` = 1 
WHERE id = 'link_id_here';
```

---

## 🗑️ Delete Data

### Delete a user (⚠️ cascades to all related data)
```sql
DELETE FROM users WHERE email = 'user@example.com';
```

### Delete a specific link
```sql
DELETE FROM bio_links WHERE id = 'link_id_here';
```

### Delete all links for a user
```sql
DELETE FROM bio_links WHERE user_id = 'user_id_here';
```

### Clear a table (⚠️ CAUTION)
```sql
TRUNCATE TABLE table_name;
```

---

## 📈 Analytics Queries

### Count total page views
```sql
SELECT COUNT(*) as total_views FROM page_views;
```

### Page views per user
```sql
SELECT u.username, COUNT(pv.id) as views
FROM users u
LEFT JOIN page_views pv ON u.id = pv.user_id
GROUP BY u.id, u.username
ORDER BY views DESC;
```

### Most clicked links
```sql
SELECT bl.title, bl.url, COUNT(lc.id) as clicks
FROM bio_links bl
LEFT JOIN link_clicks lc ON bl.id = lc.link_id
GROUP BY bl.id, bl.title, bl.url
ORDER BY clicks DESC
LIMIT 10;
```

### Links with click count
```sql
SELECT title, url, click_count 
FROM bio_links 
WHERE user_id = 'user_id_here' 
ORDER BY click_count DESC;
```

### Recent page views (last 24 hours)
```sql
SELECT u.username, pv.viewed_at, pv.country, pv.referrer
FROM page_views pv
JOIN users u ON pv.user_id = u.id
WHERE pv.viewed_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY pv.viewed_at DESC;
```

---

## 💾 Backup & Restore

### Backup entire database
```bash
mysqldump -u heremylinks_user -p heremylinks > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Backup specific tables
```bash
mysqldump -u heremylinks_user -p heremylinks users bio_links > backup_users_links.sql
```

### Backup with compression
```bash
mysqldump -u heremylinks_user -p heremylinks | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restore from backup
```bash
mysql -u heremylinks_user -p heremylinks < backup_20250126.sql
```

### Restore compressed backup
```bash
gunzip < backup_20250126.sql.gz | mysql -u heremylinks_user -p heremylinks
```

---

## 🔧 Maintenance

### Check table status
```sql
SHOW TABLE STATUS FROM heremylinks;
```

### Optimize tables
```sql
OPTIMIZE TABLE users;
OPTIMIZE TABLE bio_links;
```

### Check table for errors
```sql
CHECK TABLE users;
```

### Repair table (if needed)
```sql
REPAIR TABLE users;
```

### View database size
```sql
SELECT 
  table_schema AS 'Database',
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'heremylinks'
GROUP BY table_schema;
```

### View table sizes
```sql
SELECT 
  table_name AS 'Table',
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'heremylinks'
ORDER BY (data_length + index_length) DESC;
```

---

## 📊 Indexes

### View indexes on a table
```sql
SHOW INDEX FROM users;
```

### Create index
```sql
CREATE INDEX idx_username ON users(username);
```

### Drop index
```sql
DROP INDEX idx_username ON users;
```

---

## 🔍 Advanced Queries

### Find users without any links
```sql
SELECT u.id, u.username, u.email
FROM users u
LEFT JOIN bio_links bl ON u.id = bl.user_id
WHERE bl.id IS NULL;
```

### Users with most links
```sql
SELECT u.username, COUNT(bl.id) as link_count
FROM users u
LEFT JOIN bio_links bl ON u.id = bl.user_id
GROUP BY u.id, u.username
ORDER BY link_count DESC
LIMIT 10;
```

### Find duplicate emails (shouldn't happen)
```sql
SELECT email, COUNT(*) as count
FROM users
GROUP BY email
HAVING count > 1;
```

### Users registered today
```sql
SELECT id, username, email, created_at
FROM users
WHERE DATE(created_at) = CURDATE();
```

### Links created in last 7 days
```sql
SELECT u.username, bl.title, bl.created_at
FROM bio_links bl
JOIN users u ON bl.user_id = u.id
WHERE bl.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY bl.created_at DESC;
```

---

## 🧹 Development Helpers

### Reset a user's password (bcrypt hash for "password123")
```sql
UPDATE users 
SET password = '$2a$10$JZqKLYGWHwFMhSzIYQjHKuzZLqGk1X2nNPLq4xQ4dKwQOCKgJrCLS'
WHERE email = 'user@example.com';
```

### Make all users published (for testing)
```sql
UPDATE users SET is_published = TRUE;
```

### Clear all analytics data
```sql
TRUNCATE TABLE page_views;
TRUNCATE TABLE link_clicks;
```

### Reset link click counts
```sql
UPDATE bio_links SET click_count = 0;
```

### Find OAuth users
```sql
SELECT u.email, u.username, u.provider
FROM users u
WHERE u.provider IN ('google', 'apple');
```

---

## 🚨 Emergency Commands

### Kill long-running queries
```sql
-- View running queries
SHOW PROCESSLIST;

-- Kill a specific query
KILL query_id;
```

### Reset root password (if locked out)
```bash
# Stop MySQL
sudo systemctl stop mysql

# Start in safe mode
sudo mysqld_safe --skip-grant-tables &

# Login without password
mysql -u root

# Reset password
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
exit;

# Restart MySQL normally
sudo systemctl start mysql
```

---

## 📱 Useful Shell Commands

### Check MySQL status
```bash
# macOS
brew services list | grep mysql

# Ubuntu
sudo systemctl status mysql
```

### Start/Stop MySQL
```bash
# macOS
brew services start mysql
brew services stop mysql

# Ubuntu
sudo systemctl start mysql
sudo systemctl stop mysql
```

### View MySQL logs
```bash
# macOS
tail -f /usr/local/var/mysql/*.err

# Ubuntu
sudo tail -f /var/log/mysql/error.log
```

### MySQL client history
```bash
cat ~/.mysql_history
```

---

## 💡 Pro Tips

1. **Always backup before major changes**
   ```bash
   mysqldump -u heremylinks_user -p heremylinks > backup_before_changes.sql
   ```

2. **Use transactions for multiple updates**
   ```sql
   START TRANSACTION;
   -- your queries here
   COMMIT;  -- or ROLLBACK; if something went wrong
   ```

3. **Test queries with LIMIT first**
   ```sql
   SELECT * FROM users LIMIT 5;  -- test first
   -- UPDATE users SET ...;       -- run this after confirming
   ```

4. **Use EXPLAIN to optimize queries**
   ```sql
   EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';
   ```

5. **Create a read-only user for analytics**
   ```sql
   CREATE USER 'analytics_user'@'localhost' IDENTIFIED BY 'password';
   GRANT SELECT ON heremylinks.* TO 'analytics_user'@'localhost';
   ```

---

## 📚 Additional Resources

- [MySQL Documentation](https://dev.mysql.com/doc/)
- [MySQL Workbench](https://www.mysql.com/products/workbench/) - GUI tool
- [phpMyAdmin](https://www.phpmyadmin.net/) - Web-based interface
- [Sequel Pro](https://www.sequelpro.com/) - macOS GUI (free)
- [TablePlus](https://tableplus.com/) - Modern GUI (free tier)

---

**Tip**: Save commonly used queries in a `.sql` file for easy access!

```bash
# Create a queries file
touch my_queries.sql

# Run queries from file
mysql -u heremylinks_user -p heremylinks < my_queries.sql
```

