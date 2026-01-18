# How to Get Supabase Credentials

## Quick Method (Recommended)

Run the interactive setup script:

```bash
./setup-env.sh
```

This will guide you through entering your credentials step-by-step.

---

## Manual Method

### Step 1: Open Supabase Dashboard

1. **Open your browser** and go to:
   ```
   https://supabase.com/dashboard/project/lraqrtyalovuykeseaxn/settings/api
   ```

2. **Or navigate manually:**
   - Go to: https://supabase.com/dashboard
   - Select your project: `lraqrtyalovuykeseaxn`
   - Click: **Settings** (⚙️ icon in left sidebar)
   - Click: **API** (under Configuration)

### Step 2: Find Your Credentials

On the API Settings page, you'll see:

#### 📍 **Project URL** (at the top of the page)
```
Project URL: https://lraqrtyalovuykeseaxn.supabase.co
```
- Copy this entire URL
- This goes into: `VITE_SUPABASE_URL` and `SUPABASE_URL`

#### 🔑 **Project API keys** (scroll down)

You'll see a table with API keys:

| Name | Key |
|------|-----|
| **anon** `public` | `eyJhbGc...` (long string) |
| **service_role** `secret` | `eyJhbGc...` (long string) |

**anon public:**
- Click the **eye icon** 👁️ or **copy button** to reveal
- Copy the entire key (starts with `eyJhbGc...`)
- This goes into: `VITE_SUPABASE_ANON_KEY`

**service_role secret:**
- Click the **eye icon** 👁️ or **"Reveal"** button to show it
- Copy the entire key (starts with `eyJhbGc...`)
- This goes into: `SUPABASE_SERVICE_ROLE_KEY`
- ⚠️ **Keep this secret!** Never commit it to git.

### Step 3: Create .env File

**Option A: Use the setup script (easiest)**
```bash
./setup-env.sh
```

**Option B: Manual creation**

1. **Create the file:**
   ```bash
   nano .env
   ```
   Or use any text editor (VS Code, TextEdit, etc.)

2. **Paste this template:**
   ```env
   VITE_SUPABASE_URL=https://lraqrtyalovuykeseaxn.supabase.co
   SUPABASE_URL=https://lraqrtyalovuykeseaxn.supabase.co
   VITE_SUPABASE_ANON_KEY=paste-your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=paste-your-service-role-key-here
   ```

3. **Replace the placeholders:**
   - Replace `https://lraqrtyalovuykeseaxn.supabase.co` with your actual Project URL
   - Replace `paste-your-anon-key-here` with your anon public key
   - Replace `paste-your-service-role-key-here` with your service_role key

4. **Save the file:**
   - `Ctrl+X`, then `Y`, then `Enter` (if using nano)
   - Or `Cmd+S` / `Ctrl+S` in other editors

**Option C: One-liner (replace values first!)**

```bash
cat > .env << 'EOF'
VITE_SUPABASE_URL=https://lraqrtyalovuykeseaxn.supabase.co
SUPABASE_URL=https://lraqrtyalovuykeseaxn.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-paste-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-paste-here
EOF
```

⚠️ **Important:** Replace `your-anon-key-paste-here` and `your-service-role-key-paste-here` with your actual keys before running!

### Step 4: Verify .env File

Check that the file was created:

```bash
cat .env
```

You should see:
```
VITE_SUPABASE_URL=https://lraqrtyalovuykeseaxn.supabase.co
SUPABASE_URL=https://lraqrtyalovuykeseaxn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc... (long string)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (long string)
```

### Step 5: Test It Works

```bash
# Test the connection
npm run test-connection

# If successful, create test users
npm run create-users
```

---

## Visual Guide - Where to Find Each Value

```
┌─────────────────────────────────────────────────────────┐
│  Supabase Dashboard → Settings → API                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Project URL                                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │ https://lraqrtyalovuykeseaxn.supabase.co        │   │
│  │              ↑ Copy this                         │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Project API keys                                        │
│  ┌──────────────────┬────────────────────────────────┐  │
│  │ Name             │ Key                            │  │
│  ├──────────────────┼────────────────────────────────┤  │
│  │ anon public      │ eyJhbGc... (click 👁️ to show) │  │
│  │                  │      ↑ Copy this               │  │
│  ├──────────────────┼────────────────────────────────┤  │
│  │ service_role     │ [Reveal] ← Click to show       │  │
│  │                  │ eyJhbGc... (copy after reveal) │  │
│  │                  │      ↑ Copy this               │  │
│  └──────────────────┴────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### "Cannot find .env file"
- Make sure you're in the project root directory (`/Users/cliffsumalpong/Documents/School`)
- The `.env` file should be in the same directory as `package.json`

### "Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required"
- Check that your `.env` file has all 4 variables
- Make sure there are no extra spaces or quotes around the values
- Verify the file is named exactly `.env` (not `.env.txt`)

### "Invalid API key"
- Double-check you copied the entire key (they're very long)
- Make sure you didn't add extra spaces or line breaks
- For `SUPABASE_SERVICE_ROLE_KEY`, make sure you're using `service_role`, not `anon`

### "Permission denied" when running scripts
- Make the setup script executable: `chmod +x setup-env.sh`

---

## Security Notes

⚠️ **IMPORTANT:**
- The `.env` file is automatically ignored by git (in `.gitignore`)
- Never commit `SUPABASE_SERVICE_ROLE_KEY` to version control
- Never share `SUPABASE_SERVICE_ROLE_KEY` publicly
- The `service_role` key has admin privileges - treat it like a password
