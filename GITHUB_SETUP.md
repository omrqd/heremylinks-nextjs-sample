# GitHub Setup Instructions

## Step 1: Create a GitHub Repository

1. Go to [github.com](https://github.com) and log in
2. Click the **"+"** icon (top right) → **"New repository"**
3. Fill in:
   - **Repository name**: `heremylinks-nextjs`
   - **Description**: "HereMyLinks - Modern bio links builder built with Next.js"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README (we already have one)
4. Click **"Create repository"**

## Step 2: Connect Your Local Repository

After creating the repository on GitHub, you'll see a URL like:
```
https://github.com/YOUR_USERNAME/heremylinks-nextjs.git
```

Run these commands (replace `YOUR_USERNAME` with your GitHub username):

```bash
cd /Users/mora/Documents/heremylinks-nextjs-sample

# Add the remote repository
git remote add origin https://github.com/YOUR_USERNAME/heremylinks-nextjs.git

# Push to GitHub
git push -u origin main
```

## Step 3: Authentication

If prompted for credentials, you have two options:

### Option A: Personal Access Token (Recommended)

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name: "HereMyLinks Deployment"
4. Select scopes: `repo` (full control of private repositories)
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)
7. When pushing, use:
   - Username: Your GitHub username
   - Password: Paste the token

### Option B: SSH Key

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "mora@heremylinks.com"

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add to GitHub:
# Settings → SSH and GPG keys → New SSH key → Paste the key

# Change remote to SSH
git remote set-url origin git@github.com:YOUR_USERNAME/heremylinks-nextjs.git

# Push
git push -u origin main
```

## Quick Commands Reference

```bash
# Check remote
git remote -v

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/heremylinks-nextjs.git

# Push to GitHub
git push -u origin main

# For future updates
git add .
git commit -m "Your commit message"
git push
```

## Troubleshooting

**Error: remote origin already exists**
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/heremylinks-nextjs.git
```

**Error: Permission denied (publickey)**
- Use HTTPS instead of SSH, or set up SSH keys

**Error: refusing to merge unrelated histories**
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

