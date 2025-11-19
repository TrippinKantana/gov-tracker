# Troubleshooting Guide

Common issues and solutions for the Government Asset Tracking Platform.

## 🔴 Git Errors

### GitHub 500 Internal Server Error

**Error:**
```
remote: Internal Server Error
fatal: unable to access 'https://github.com/...': The requested URL returned error: 500
```

**Solutions:**

1. **Wait and Retry** (Most Common Fix)
   - GitHub servers sometimes have temporary issues
   - Wait 5-10 minutes and try again:
   ```bash
   git pull origin main
   ```

2. **Check GitHub Status**
   - Visit [status.github.com](https://www.githubstatus.com/)
   - Check if GitHub is experiencing issues
   - Wait for GitHub to resolve the issue

3. **Try Different Protocol**
   ```bash
   # If using HTTPS, try SSH (if you have SSH keys set up)
   git remote set-url origin git@github.com:TrippinKantana/gov-tracker.git
   git pull origin main
   
   # Or switch back to HTTPS
   git remote set-url origin https://github.com/TrippinKantana/gov-tracker.git
   ```

4. **Clear Git Credentials Cache**
   ```bash
   # Windows
   git credential-manager-core erase
   
   # Mac/Linux
   git credential-cache exit
   ```

5. **Use Git Credential Manager**
   - If on Windows, ensure Git Credential Manager is installed
   - It handles authentication automatically

6. **Check Your Internet Connection**
   - Ensure you have stable internet
   - Try accessing github.com in a browser

7. **Retry with Verbose Output**
   ```bash
   git pull -v origin main
   ```
   This shows more details about what's failing

**Most Likely Cause:** Temporary GitHub server issue. Wait a few minutes and retry.

---

## 🟡 Other Common Issues

### Authentication Errors

**Error:** `fatal: Authentication failed`

**Solution:**
1. Use a Personal Access Token instead of password
2. Go to GitHub → Settings → Developer settings → Personal access tokens
3. Generate a new token with `repo` permissions
4. Use the token as your password when Git prompts

### Merge Conflicts

**Error:** `Automatic merge failed; fix conflicts and then commit`

**Solution:**
```bash
# See which files have conflicts
git status

# Edit the conflicted files and resolve conflicts
# Then:
git add .
git commit -m "Resolve merge conflicts"
git push origin main
```

### Large File Issues

**Error:** `remote: error: File is too large`

**Solution:**
- Remove large files from Git history
- Use Git LFS for large files
- Add large files to `.gitignore`

---

## 🔵 Deployment Issues

### Railway Deployment Fails

**Check:**
1. Railway logs for error messages
2. Environment variables are set correctly
3. Root directory is set to `backend`
4. Database connection string is valid

### Netlify Build Fails

**Check:**
1. Build logs in Netlify dashboard
2. Environment variables start with `VITE_`
3. Node version matches (should be 18)
4. All dependencies are in `package.json`

---

## 🟢 Need More Help?

- Check the specific deployment guide:
  - [Railway Deployment](./RAILWAY_DEPLOYMENT_GUIDE.md)
  - [Netlify Deployment](./NETLIFY_DEPLOYMENT_GUIDE.md)
  - [Database Migration](./../DATABASE_MIGRATION_GUIDE.md)

