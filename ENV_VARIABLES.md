# 🔒 Environment Variables - Security Configuration

## 🛡️ CRITICAL VARIABLES (Set these immediately)

### OAuth2 Configuration
```env
# Google OAuth2
GOOGLE_OAUTH_CLIENT_ID=your_client_id_from_google_cloud_console
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret
GOOGLE_OAUTH_REDIRECT_URI=https://infiniteyatra.com/auth/callback
```

### JWT & Session Configuration
```env
# JWT Secret (use: openssl rand -base64 32)
JWT_SECRET=your_random_jwt_secret_here
JWT_ALGORITHM=HS256
JWT_EXPIRATION=24h
```

### Firebase Configuration
```env
# From firebase.json / Firebase Console
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Payment Gateway
```env
# Razorpay
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### Email Configuration
```env
# SMTP
SMTP_EMAIL=your_email@example.com
SMTP_PASSWORD=your_smtp_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

### AI Services
```env
# Google Gemini
VITE_GEMINI_API_KEY=your_gemini_api_key

# OpenAI (optional)
VITE_OPENAI_API_KEY=your_openai_key

# Groq (optional)
VITE_GROQ_API_KEY=your_groq_key
```

### WhatsApp Integration
```env
# WhatsApp Business API
WHATSAPP_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_ID=your_phone_id
```

### EmailJS Integration
```env
VITE_EMAILJS_PUBLIC_KEY=your_public_key
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID_USER=your_user_template
VITE_EMAILJS_TEMPLATE_ID_ADMIN=your_admin_template
```

## 🔐 HOW TO GENERATE SECURE VALUES

### Generate JWT Secret
```bash
# macOS/Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### Generate API Keys
- **Google Cloud Console**: https://console.cloud.google.com
- **Firebase Console**: https://console.firebase.google.com
- **Razorpay Dashboard**: https://dashboard.razorpay.com
- **Google Gemini**: https://ai.google.dev/
- **Vite Config**: https://vitejs.dev/

## 📝 FILE STRUCTURE

```
root/
├── .env                    ← Local development (NEVER commit!)
├── .env.example            ← Template for developers
├── .env.production         ← Production environment
└── .env.staging            ← Staging environment
```

## ✅ SETUP INSTRUCTIONS

### Step 1: Create .env file
```bash
cp .env.example .env
```

### Step 2: Fill in all values
```bash
nano .env  # or open in your editor
```

### Step 3: Secure the file
```bash
chmod 600 .env  # Only owner can read
```

### Step 4: Verify values
```bash
# Do NOT output sensitive values - just verify they exist
if [ -f .env ]; then echo ".env file exists"; fi
```

## 🚀 DEPLOYMENT

### Firebase Functions
```bash
# Deploy with environment variables
firebase deploy --only functions
```

### Netlify
Set environment variables in Netlify UI:
1. Site settings → Build & deploy → Environment
2. Add all `VITE_*` variables

### GitHub Actions
Set secrets in GitHub UI:
1. Settings → Secrets and variables → Actions
2. Add all critical variables as secrets

## ⚠️ SECURITY CHECKLIST

- [ ] All values are strong/random (not defaults)
- [ ] `.env` file is in `.gitignore`
- [ ] No `.env` file committed to git
- [ ] Secrets updated for each environment
- [ ] OAuth credentials are specific to domain
- [ ] JWT secret is unique and strong
- [ ] API keys are rotated monthly
- [ ] No credentials in code comments
- [ ] All team members use separate keys

## 🔄 ROTATION SCHEDULE

### Monthly (High Priority)
- [ ] JWT_SECRET
- [ ] RAZORPAY_KEY_SECRET
- [ ] Google OAuth secrets

### Quarterly (Medium Priority)
- [ ] Firebase API keys
- [ ] Email/SMTP passwords

### Annually (Low Priority)
- [ ] Review all access patterns
- [ ] Update security policies
- [ ] Audit active API keys

## 📞 EMERGENCY PROCEDURES

### If credentials are exposed:
1. **Immediately** revoke the exposed key
2. Generate new credentials
3. Update all environments
4. Check logs for unauthorized access
5. Notify security team
6. Update .env in all deployed services

### Commands to revoke:
```bash
# Firebase keys
firebase auth:delete_tenant <tenant-id>

# Google OAuth
# Visit: https://myaccount.google.com/permissions

# Razorpay
# Visit: https://dashboard.razorpay.com/app/settings/api-keys
```

## 🧪 TESTING ENVIRONMENT VARIABLES

```bash
# Verify Firebase config
node -e "console.log(process.env.VITE_FIREBASE_PROJECT_ID)"

# Test OAuth endpoint
curl -X GET "https://accounts.google.com/o/oauth2/v2/auth?client_id=$GOOGLE_OAUTH_CLIENT_ID"

# Test email service
npm run test:email

# Test payment gateway
npm run test:payment
```

## 📚 REFERENCE LINKS

- [Firebase Environment Setup](https://firebase.google.com/docs/functions/config-env)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Razorpay API Keys](https://razorpay.com/docs/api/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Node.js dotenv](https://www.npmjs.com/package/dotenv)

---

**Last Updated**: March 27, 2026
**Security Level**: Enterprise 🏢
