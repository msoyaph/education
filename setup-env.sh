#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 Supabase Environment Variables Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This script will help you create a .env file with your Supabase credentials."
echo ""
echo "📋 STEP 1: Get Your Credentials"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Open this URL in your browser:"
echo "   https://supabase.com/dashboard/project/lraqrtyalovuykeseaxn/settings/api"
echo ""
echo "2. You'll see:"
echo "   • Project URL (under 'Project URL' section)"
echo "   • anon public (under 'Project API keys')"
echo "   • service_role (under 'Project API keys' - click 'Reveal' to see it)"
echo ""
echo "⚠️  IMPORTANT: The service_role key has admin privileges - keep it secret!"
echo ""
read -p "Press Enter when you have the credentials ready..."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 STEP 2: Enter Your Credentials"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get Project URL
read -p "Enter Project URL (e.g., https://lraqrtyalovuykeseaxn.supabase.co): " SUPABASE_URL
if [ -z "$SUPABASE_URL" ]; then
    echo "❌ Project URL is required. Exiting."
    exit 1
fi

# Get Anon Key
read -p "Enter anon public key: " VITE_SUPABASE_ANON_KEY
if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ Anon key is required. Exiting."
    exit 1
fi

# Get Service Role Key
echo ""
echo "⚠️  Enter service_role key (it will be hidden for security):"
read -s SUPABASE_SERVICE_ROLE_KEY
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Service role key is required. Exiting."
    exit 1
fi

echo ""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💾 STEP 3: Creating .env File"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create .env file
cat > .env << EOF
# Supabase Configuration
# Generated on $(date)

VITE_SUPABASE_URL=${SUPABASE_URL}
SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
EOF

echo "✅ .env file created successfully!"
echo ""
echo "📋 Created .env with:"
echo "   • VITE_SUPABASE_URL=${SUPABASE_URL}"
echo "   • SUPABASE_URL=${SUPABASE_URL}"
echo "   • VITE_SUPABASE_ANON_KEY=*** (hidden)"
echo "   • SUPABASE_SERVICE_ROLE_KEY=*** (hidden)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "You can now run:"
echo "  npm run test-connection    # Test the connection"
echo "  npm run create-users       # Create test users"
echo ""
echo "⚠️  Remember: Never commit .env to git - it contains secrets!"
