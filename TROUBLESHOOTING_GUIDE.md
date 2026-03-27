# Troubleshooting Guide: Advanced Security Implementation

## Table of Contents
1. [OAuth2 Issues](#oauth2-issues)
2. [2FA Issues](#2fa-issues)
3. [WAF Issues](#waf-issues)
4. [SAST Issues](#sast-issues)
5. [Environment Variables](#environment-variables)
6. [Deployment Issues](#deployment-issues)
7. [Performance Issues](#performance-issues)

---

## OAuth2 Issues

### Problem: "Redirect URI mismatch" Error

**Symptoms:**
- OAuth callback fails with redirect URI error
- Google OAuth screen shows error message
- Browser redirects to error page

**Solution:**
1. Check exact redirect URI in Google Cloud Console
   ```
   Authorized redirect URIs must match exactly:
   - Development: http://localhost:5173/auth/callback
   - Production: https://infiniteyatra.com/auth/callback
   ```

2. Verify frontend callback URL matches:
   ```javascript
   // src/pages/AuthCallback.jsx
   window.location.href = `/auth/callback?code=${code}`;
   ```

3. Check Environment Variables:
   ```
   VITE_GOOGLE_CLIENT_ID=<correct_id>.apps.googleusercontent.com
   ```

4. Test redirect manually:
   ```bash
   # Should load OAuth page
   curl "https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_ID&redirect_uri=http://localhost:5173/auth/callback&response_type=code"
   ```

---

### Problem: "Invalid client" Error

**Symptoms:**
- 400 error when exchanging authorization code
- "Invalid client" message from Google
- Token endpoint fails

**Solution:**
1. Verify Client ID and Secret:
   ```bash
   echo $GOOGLE_OAUTH_CLIENT_ID
   echo $GOOGLE_OAUTH_CLIENT_SECRET
   ```

2. Check that secrets are **not** exposed in code:
   ```bash
   # Should return no results
   grep -r "GOOGLE_OAUTH_CLIENT_SECRET" src/
   ```

3. Verify secrets are only in Cloud Functions:
   ```bash
   firebase functions:config:get
   ```

4. Regenerate credentials if compromised:
   - Go to Google Cloud Console
   - Delete old credentials
   - Create new OAuth 2.0 Client ID
   - Update environment variables

---

### Problem: Session Token Not Working

**Symptoms:**
- OAuth login succeeds but subsequent API calls fail
- "Invalid token" errors on authenticated endpoints
- Refresh token doesn't work

**Solution:**
1. Verify JWT_SECRET is set:
   ```bash
   firebase functions:config:get | grep JWT_SECRET
   ```

2. Check token expiration:
   ```javascript
   // functions/security.js - verify token expiry
   const decoded = jwt.verify(token, process.env.JWT_SECRET);
   console.log('Token expires:', new Date(decoded.exp * 1000));
   ```

3. Test token creation and verification:
   ```bash
   # Create test token
   node -e "
   const jwt = require('jsonwebtoken');
   const token = jwt.sign({userId: 'test123'}, 'secret', {expiresIn: '24h'});
   console.log(token);
   "
   ```

4. Check Bearer token format in requests:
   ```javascript
   // Must use "Bearer" prefix
   headers: {
     'Authorization': 'Bearer ' + sessionToken
   }
   ```

---

### Problem: CORS Error on OAuth Callback

**Symptoms:**
- Browser console shows CORS error
- XMLHttpRequest to /api/auth/oauth-callback fails
- "No 'Access-Control-Allow-Origin' header"

**Solution:**
1. Verify CORS configuration in functions/index.js:
   ```javascript
   const cors = require('cors');
   const corsConfig = {
     origin: [
       'http://localhost:5173',
       'https://infiniteyatra.com',
       'https://www.infiniteyatra.com',
     ],
     credentials: true,
   };
   app.use(cors(corsConfig));
   ```

2. Check netlify.toml headers:
   ```
   [[headers]]
     for = "/*"
     [headers.values]
       Access-Control-Allow-Origin = "*"
   ```

3. Test with curl:
   ```bash
   curl -I -H "Origin: http://localhost:5173" \
     https://infiniteyatra.com/api/auth/oauth-callback
   ```

---

## 2FA Issues

### Problem: QR Code Not Generating

**Symptoms:**
- /api/auth/2fa/setup returns null or empty qrCode
- QRCode image won't display
- QR code generation fails silently

**Solution:**
1. Verify speakeasy and qrcode are installed:
   ```bash
   cd functions
   npm list speakeasy qrcode
   ```

2. Check if speakeasy generates secret correctly:
   ```javascript
   // functions/security.js
   const speakeasy = require('speakeasy');
   const secret = speakeasy.generateSecret({
     name: 'Infinite Yatra (email@example.com)',
     issuer: 'Infinite Yatra',
   });
   console.log('Secret:', secret.base32); // Should print base32 string
   ```

3. Test QR code generation:
   ```javascript
   // functions/security.js
   const QRCode = require('qrcode');
   const qrCode = await QRCode.toDataURL(secret.otpauth_url);
   console.log('QR Code URL:', qrCode.substring(0, 50) + '...'); // Should start with "data:image"
   ```

4. Reinstall if corrupted:
   ```bash
   rm -rf node_modules/speakeasy node_modules/qrcode
   npm install speakeasy qrcode
   ```

---

### Problem: 2FA Code Always Invalid

**Symptoms:**
- Entering correct code from authenticator app fails
- "Invalid 2FA code" error on verify
- Works with test code but not real authenticator

**Solution:**
1. Check time synchronization:
   ```bash
   # Verify system time is correct
   date
   
   # On macOS, if time is wrong:
   ntpdate -s time.nist.gov
   ```

2. Verify speakeasy accepts time window:
   ```javascript
   // functions/security.js - Check time window setting
   const verified = speakeasy.totp.verify({
     secret: secret,
     encoding: 'base32',
     token: code,
     window: 2, // Allow codes from ±2 time steps
   });
   ```

3. Test with test code:
   ```bash
   # Generate test code
   node -e "
   const speakeasy = require('speakeasy');
   const secret = 'JBSWY3DPEBLW64TMMQ======';
   const code = speakeasy.totp({ secret: secret, encoding: 'base32' });
   console.log('Current code:', code);
   "
   ```

4. Verify authenticator app time:
   - Google Authenticator → Settings → Time correction
   - Should say "Time correction is ON"

---

### Problem: 2FA Backup Codes Not Working

**Symptoms:**
- Can't access account when phone is lost
- Backup codes rejected
- Recovery codes endpoint returns error

**Solution:**
1. Generate backup codes during 2FA setup:
   ```javascript
   // functions/security.js
   const backupCodes = [];
   for (let i = 0; i < 10; i++) {
     backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
   }
   ```

2. Store backup codes securely:
   ```javascript
   // Firestore storage
   await admin.firestore().collection('users').doc(userId).update({
     backup_codes: admin.firestore.FieldValue.serverTimestamp(),
     backup_codes_used: [],
   });
   ```

3. Verify backup codes in Firestore:
   ```bash
   firebase firestore:inspect collections/users/docs/{userId}
   ```

4. Check if backup code is marked as used:
   ```javascript
   // Only allow each backup code once
   if (user.backup_codes_used?.includes(code)) {
     throw new Error('Backup code already used');
   }
   ```

---

### Problem: Admin Access After Enabling 2FA

**Symptoms:**
- Admin can't log in after enabling 2FA
- Getting stuck at 2FA verification screen
- Can't recover access

**Solution:**
1. Temporarily disable 2FA requirement (emergency):
   ```bash
   # In Firestore
   db.collection('users').doc(userId).update({
     two_fa_enabled: false
   })
   ```

2. Provide recovery instructions:
   - Collect user's backup codes
   - Use backup codes to regain access
   - Regenerate authenticator codes

3. Test 2FA flow in development:
   ```bash
   npm test -- --grep "2FA"
   ```

4. Create 2FA recovery dashboard for admins

---

## WAF Issues

### Problem: Legitimate Requests Being Blocked

**Symptoms:**
- Valid bookings rejected with "Validation failed"
- API returns 403 Forbidden unexpectedly
- WAF logging false positives

**Solution:**
1. Check WAF middleware order:
   ```javascript
   // functions/index.js - WAF should be early but after express.json()
   app.use(express.json());
   app.use(wafMiddleware);          // Block obvious attacks
   app.use(inputValidationMiddleware); // Validate specific fields
   ```

2. Review blocked request in logs:
   ```bash
   firebase functions:log | grep "waf_blocked"
   ```

3. Check regex patterns for false positives:
   ```javascript
   // functions/waf.js
   const detectSQLInjection = (input) => {
     const sqlKeywords = /('|"|;|--|\/\*|\*\/|xp_|sp_|exec|execute|script|javascript|onerror)/i;
     // May need to adjust for legitimate use cases
   };
   ```

4. Whitelist specific patterns:
   ```javascript
   // Add to wafMiddleware
   if (userEmail.includes('admin@') && req.path === '/api/admin/special') {
     return next(); // Skip WAF for admin special endpoints
   }
   ```

5. Adjust validation rules:
   ```javascript
   // functions/waf.js - Example: Allow longer emails
   validateEmail: (email) => {
     return validator.isEmail(email) && email.length <= 255;
   }
   ```

---

### Problem: Rate Limiting Too Aggressive

**Symptoms:**
- Users blocked after few legitimate requests
- Rate limit headers show "Retry-After" immediately
- Performance degradation

**Solution:**
1. Check rate limiter settings:
   ```javascript
   // functions/waf.js
   const loginLimiter = rateLimit({
     windowMs: 15 * 60 * 1000,  // 15 minutes
     max: 5,                     // Max 5 requests
     standardHeaders: true,
     legacyHeaders: false,
   });
   ```

2. Adjust for legitimate use:
   ```javascript
   // Increase limits for paying customers
   if (user.isPremium) {
     return next(); // Skip rate limiting for premium
   }
   ```

3. Test rate limiting:
   ```bash
   # Send 6 requests rapidly
   for i in {1..6}; do
     curl -X POST http://localhost:5001/.../api/auth/login \
       -H "Content-Type: application/json" \
       -d '{"email":"test","password":"test"}'
   done
   # After 5th, should get 429
   ```

4. Monitor rate limit metrics:
   ```bash
   firebase functions:log | grep "rate_limit"
   ```

---

### Problem: Bot Detection Blocking Real Users

**Symptoms:**
- Real users marked as bots
- User-Agent checks failing
- Bot detection too sensitive

**Solution:**
1. Check bot detection rules:
   ```javascript
   // functions/waf.js
   const botUserAgents = ['bot', 'crawler', 'spider', 'scraper'];
   // May be too broad
   ```

2. Whitelist legitimate bots:
   ```javascript
   // Allow specific legitimate crawlers
   const allowedBots = ['Googlebot', 'Bingbot', 'Slurp'];
   if (allowedBots.some(bot => userAgent.includes(bot))) {
     return next();
   }
   ```

3. Check IP reputation:
   ```bash
   # Test IP against reputation services
   curl "https://api.abuseipdb.com/api/v2/check?ipAddress=1.2.3.4"
   ```

4. Review bot blocking logs:
   ```bash
   firebase functions:log | grep "bot_detected"
   ```

---

## SAST Issues

### Problem: GitHub Actions Workflow Not Triggering

**Symptoms:**
- Workflow doesn't run on push
- No GitHub Actions tab visible
- Workflow file not recognized

**Solution:**
1. Verify workflow file syntax:
   ```bash
   # Must be valid YAML
   yamlint .github/workflows/security-scanning.yml
   ```

2. Check workflow file location:
   ```
   Must be: .github/workflows/security-scanning.yml
   NOT: .workflows/security-scanning.yml
   ```

3. Verify triggers are correct:
   ```yaml
   on:
     push:
       branches: [ main, develop ]
     pull_request:
       branches: [ main, develop ]
     schedule:
       - cron: '0 2 * * *'
   ```

4. Check GitHub Actions are enabled:
   - Repository Settings → Actions → General
   - "Allow all actions and reusable workflows" should be selected

5. Commit and push file:
   ```bash
   git add .github/workflows/security-scanning.yml
   git commit -m "Add security scanning workflow"
   git push origin main
   ```

---

### Problem: Workflow Fails - Missing Secrets

**Symptoms:**
- Workflow shows "failed" status
- "SNYK_TOKEN is not set" error
- GitHub Actions fails to run Snyk

**Solution:**
1. Set GitHub secrets:
   ```
   Repository Settings → Secrets and variables → Actions
   ```

2. Add required secrets:
   ```
   SNYK_TOKEN              # From https://snyk.io/account/settings/
   SLACK_WEBHOOK           # From Slack app settings
   GOOGLE_OAUTH_CLIENT_ID  # From Google Cloud Console
   GOOGLE_OAUTH_CLIENT_SECRET
   ```

3. Reference secrets correctly in YAML:
   ```yaml
   env:
     SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}  # Correct
     TOKEN: {{ secrets.SNYK_TOKEN }}        # Wrong - missing ${ }
   ```

4. Verify secrets are accessible:
   ```bash
   # In GitHub Actions, secrets can be read but not printed
   - name: Verify secret exists
     run: |
       if [ -z "${{ secrets.SNYK_TOKEN }}" ]; then
         echo "ERROR: SNYK_TOKEN not set"
         exit 1
       else
         echo "✓ SNYK_TOKEN is set"
       fi
   ```

---

### Problem: ESLint Security Plugin Not Finding Issues

**Symptoms:**
- ESLint runs but doesn't detect security issues
- Security plugin not reporting problems
- No warnings for vulnerable code patterns

**Solution:**
1. Verify ESLint plugin installed:
   ```bash
   npm list eslint-plugin-security
   ```

2. Configure .eslintrc.js:
   ```javascript
   module.exports = {
     plugins: ['security'],
     extends: ['eslint:recommended', 'plugin:security/recommended'],
     rules: {
       'security/detect-unsafe-regex': 'error',
       'security/detect-non-literal-regexp': 'warn',
       'security/detect-eval-with-expression': 'error',
     }
   };
   ```

3. Test ESLint security:
   ```bash
   npx eslint src/ --plugin security
   ```

4. Run from workflows:
   ```bash
   npx eslint . --ext .js,.jsx,.ts,.tsx --plugin security
   ```

---

### Problem: Snyk Token Invalid

**Symptoms:**
- "401 Unauthorized" from Snyk
- "Invalid API token" error
- Snyk scan fails

**Solution:**
1. Verify Snyk token:
   ```bash
   # First, get token from https://snyk.io/account/settings/
   # Then set in GitHub secrets
   ```

2. Test token locally:
   ```bash
   snyk auth <token>
   snyk test
   ```

3. Re-authenticate:
   ```bash
   snyk logout
   snyk auth <new_token>
   ```

4. Update GitHub secret:
   - Repository Settings → Secrets
   - Delete old SNYK_TOKEN
   - Create new SNYK_TOKEN with new value

---

## Environment Variables

### Problem: Missing Environment Variables in Production

**Symptoms:**
- Firebase auth fails with "undefined"
- OAuth endpoints return errors
- 2FA not working

**Solution:**
1. Set all required variables:
   ```bash
   firebase functions:config:set \
     oauth.client_id="..." \
     oauth.client_secret="..." \
     jwt.secret="..." \
     email.password="..."
   ```

2. Verify variables are set:
   ```bash
   firebase functions:config:get
   ```

3. Redeploy after setting variables:
   ```bash
   firebase deploy --only functions
   ```

4. Check .env file is NOT committed:
   ```bash
   # Verify in .gitignore
   grep "\.env" .gitignore
   ```

---

### Problem: Environment Variables Different in Dev vs Prod

**Symptoms:**
- Works locally but fails in production
- Different behavior on staging vs production
- Firebase keys don't match

**Solution:**
1. Create multiple .env files:
   ```
   .env.local        (dev)
   .env.staging      (staging)
   .env.production   (production)
   ```

2. Switch environments:
   ```bash
   # Development
   firebase use dev-project

   # Production
   firebase use prod-project

   # Set config
   firebase functions:config:set oauth.client_id="..." 
   ```

3. Verify correct environment:
   ```bash
   firebase projects:list
   firebase use  # Shows current project
   ```

---

## Deployment Issues

### Problem: Build Fails on Deploy

**Symptoms:**
- `npm run build` fails
- Build errors in GitHub Actions
- Webpack compilation errors

**Solution:**
1. Build locally first:
   ```bash
   npm run build
   ```

2. Check for TypeScript errors:
   ```bash
   npx tsc --noEmit
   ```

3. Check for ESLint errors:
   ```bash
   npx eslint src/
   ```

4. Check for module resolution issues:
   ```bash
   npm audit fix
   npm list --depth=0
   ```

---

### Problem: Cloud Functions Deployment Fails

**Symptoms:**
- "Deployment failed"
- Functions exceeded size limit
- Dependencies not installing

**Solution:**
1. Check function size:
   ```bash
   npm run build:functions  # Should be < 100MB
   ```

2. Remove unused dependencies:
   ```bash
   npm prune --production
   ```

3. Check for circular dependencies:
   ```bash
   npm ls --depth=20
   ```

4. Deploy with verbose output:
   ```bash
   firebase deploy --only functions --debug
   ```

---

### Problem: Firestore Rules Deployment Fails

**Symptoms:**
- "Rules validation failed"
- Syntax errors in firestore.rules
- Deploy blocked

**Solution:**
1. Validate rules locally:
   ```bash
   firebase emulators:start --only firestore
   ```

2. Check syntax:
   ```bash
   # Use Firebase Rules Playground
   # Copy rules to: https://firebase.google.com/docs/firestore/security/rules-console
   ```

3. Common errors:
   ```
   Error: 201 - missing ] - Check for unclosed brackets
   Error: Invalid field access - Check field names exist
   ```

---

## Performance Issues

### Problem: Slow OAuth Callback

**Symptoms:**
- OAuth callback takes > 5 seconds
- User sees blank/loading screen
- Timeout errors

**Solution:**
1. Add caching:
   ```javascript
   // Cache OAuth user lookups
   const userCache = new Map();
   ```

2. Profile callback performance:
   ```javascript
   console.time('oauth-callback');
   // ... callback code ...
   console.timeEnd('oauth-callback');
   ```

3. Optimize Firestore queries:
   ```javascript
   // Add indexes if needed
   firebase deploy --only firestore:indexes
   ```

4. Add timeout to callback:
   ```javascript
   const timeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));
   ```

---

### Problem: 2FA Verification Slow

**Symptoms:**
- Takes > 2 seconds to verify code
- Rate limiters trigger before response
- User gets 503 errors

**Solution:**
1. Cache TOTP verifications:
   ```javascript
   const verificationCache = new Map();
   ```

2. Use async/await efficiently:
   ```javascript
   // Parallel operations where possible
   const results = await Promise.all([
     verify2FACode(userId, code),
     getUserFromFirestore(userId),
   ]);
   ```

3. Add monitoring:
   ```javascript
   console.time('2fa-verify');
   const verified = await verify2FACode(userId, code);
   console.timeEnd('2fa-verify');  // Should be < 500ms
   ```

---

## Testing All Fixes

Create a comprehensive test file:

```bash
# tests/troubleshooting.spec.js
npm test -- --grep "troubleshooting"
```

---

**Last Updated**: March 27, 2026
**Status**: Troubleshooting Guide Complete
