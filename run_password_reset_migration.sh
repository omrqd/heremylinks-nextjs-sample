#!/bin/bash

# Password Reset Migration Script
# Run this to create the password_reset_tokens table

echo "🔐 Creating password_reset_tokens table..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local not found"
    exit 1
fi

# Get database credentials from .env.local
DB_HOST=$(grep DATABASE_HOST .env.local | cut -d '=' -f2)
DB_USER=$(grep DATABASE_USER .env.local | cut -d '=' -f2)
DB_PASS=$(grep DATABASE_PASSWORD .env.local | cut -d '=' -f2)
DB_NAME=$(grep DATABASE_NAME .env.local | cut -d '=' -f2)

if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_NAME" ]; then
    echo "❌ Error: Database credentials not found in .env.local"
    exit 1
fi

# Run migration
if [ -z "$DB_PASS" ]; then
    mysql -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" < database/password_reset_tokens.sql
else
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < database/password_reset_tokens.sql
fi

if [ $? -eq 0 ]; then
    echo "✅ Password reset tokens table created successfully!"
    echo ""
    echo "You can now use the forgot password feature:"
    echo "1. Go to http://localhost:3000/login"
    echo "2. Click 'Forgot password?'"
    echo "3. Enter your email"
    echo "4. Check your email for the reset link"
else
    echo "❌ Migration failed. Please check your database credentials."
    exit 1
fi
