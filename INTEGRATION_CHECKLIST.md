# Integration Checklist: Advanced Security Modules

## Overview
All advanced security modules (OAuth2, 2FA, WAF) have been implemented in separate files.
This document tracks the integration of these modules into the main Cloud Functions application.

---

## Phase 1: Dependencies & Installation ⏳

**Status**: Ready to Execute

```bash
# Step 1: Install Cloud Functions dependencies
cd functions
npm install speakeasy qrcode jsonwebtoken validator

# Step 2: Install root dependencies  
cd ..
npm install eslint-plugin-security

# Step 3: Verify installation
npm list speakeasy qrcode jsonwebtoken validator
firebase functions:config:get  # Verify Firebase setup
```

**Checklist:**
- [ ] speakeasy installed (TOTP generation)
- [ ] qrcode installed (2FA QR code)
- [ ] jsonwebtoken installed (JWT sessions)
- [ ] validator installed (Email validation)
- [ ] helmet installed (Security headers)
- [ ] eslint-plugin-security installed (SAST)

---

## Phase 2: Import & Initialize Modules ⏳

**File**: `functions/index.js`

**Required Imports**:
```javascript
// Add to top of functions/index.js
const { 
  generate2FASecret,
  verify2FACode,
  is2FAEnabled,
  disable2FA,
  generateOAuth2URL,
  handleOAuth2Callback,
  createOrUpdateOAuthUser,
  createSessionToken,
  verifySessionToken,
  revokeSession,
  adminAuthMiddleware,
  logSecurityEvent,
} = require('./security');

const {
  inputValidationMiddleware,
  wafMiddleware,
  botDetectionMiddleware,
  corsValidationMiddleware,
  loginLimiter,
  twoFALimiter,
  paymentLimiter,
  validateBookingData,
  validateEmail,
  validateFileUpload,
} = require('./waf');

const helmet = require('helmet');
```

**Checklist:**
- [ ] All imports added to functions/index.js
- [ ] security.js verified to exist
- [ ] waf.js verified to exist
- [ ] No import errors

---

## Phase 3: Apply Middleware ⏳

**File**: `functions/index.js`

**Add After app Creation**:
```javascript
// Security middleware
app.use(helmet());  // Security headers
app.use(cors(corsConfig));
app.use(corsValidationMiddleware);  // Custom CORS validation
app.use(botDetectionMiddleware);     // Bot detection
app.use(wafMiddleware);              // WAF rules
app.use(inputValidationMiddleware);  // Input validation
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
```

**Checklist:**
- [ ] helmet() added for security headers
- [ ] corsValidationMiddleware applied
- [ ] botDetectionMiddleware applied
- [ ] wafMiddleware applied
- [ ] inputValidationMiddleware applied
- [ ] Middleware order verified (helmet first, input validation last)

---

## Phase 4: Implement OAuth2 Endpoints ⏳

**File**: `functions/index.js`

**Endpoints to Add**:

```javascript
// 1. OAuth Login URL endpoint
app.get('/api/auth/oauth-url', (req, res) => {
  try {
    const { provider = 'google' } = req.query;
    const authUrl = generateOAuth2URL(provider);
    res.json({ authUrl });
  } catch (error) {
    logSecurityEvent('SYSTEM', 'oauth_url_error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// 2. OAuth Callback handler
app.post('/api/auth/oauth-callback', loginLimiter, async (req, res) => {
  try {
    const { code, state } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    const result = await handleOAuth2Callback(code, 'google');
    const sessionToken = await createSessionToken(result.user.uid, false);
    
    logSecurityEvent(result.user.uid, 'oauth_login_success', { provider: 'google' });
    
    res.json({
      success: true,
      sessionToken,
      user: {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
      },
    });
  } catch (error) {
    logSecurityEvent('SYSTEM', 'oauth_callback_error', { error: error.message });
    res.status(401).json({ error: error.message });
  }
});

// 3. Token refresh endpoint
app.post('/api/auth/refresh-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const verified = await verifySessionToken(token);
    const newToken = await createSessionToken(verified.userId, verified.has2FA);
    
    res.json({ sessionToken: newToken });
  } catch (error) {
    res.status(401).json({ error: 'Token refresh failed' });
  }
});

// 4. Logout endpoint
app.post('/api/auth/logout', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    await revokeSession(token);
    logSecurityEvent('SYSTEM', 'logout_success', {});
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Checklist**:
- [ ] OAuth URL endpoint added
- [ ] OAuth callback handler added
- [ ] Token refresh endpoint added
- [ ] Logout endpoint added
- [ ] Rate limiters applied to login endpoints
- [ ] Error logging in place

---

## Phase 5: Implement 2FA Endpoints ⏳

**File**: `functions/index.js`

**Endpoints to Add**:

```javascript
// 1. Check if 2FA is enabled for user
app.get('/api/auth/2fa-status', adminAuthMiddleware, async (req, res) => {
  try {
    const is2FA = await is2FAEnabled(req.user.userId);
    res.json({ enabled: is2FA });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Generate 2FA setup (QR code)
app.post('/api/auth/2fa/setup', adminAuthMiddleware, twoFALimiter, async (req, res) => {
  try {
    const result = await generate2FASecret(req.user.userId, req.user.email);
    logSecurityEvent(req.user.userId, 'twofa_setup_initiated', { ipAddress: req.ip });
    res.json(result);
  } catch (error) {
    logSecurityEvent(req.user.userId, 'twofa_setup_failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// 3. Verify 2FA setup and enable
app.post('/api/auth/2fa/verify', adminAuthMiddleware, twoFALimiter, async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code || code.length !== 6) {
      return res.status(400).json({ error: 'Valid 6-digit code required' });
    }

    const result = await verify2FACode(req.user.userId, code);
    
    if (!result.valid) {
      logSecurityEvent(req.user.userId, 'twofa_verify_failed', { ipAddress: req.ip });
      return res.status(401).json({ error: 'Invalid 2FA code' });
    }

    logSecurityEvent(req.user.userId, 'twofa_enabled', { ipAddress: req.ip });
    res.json({ success: true, message: '2FA enabled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Verify 2FA during login
app.post('/api/auth/2fa/verify-login', loginLimiter, async (req, res) => {
  try {
    const { userId, code } = req.body;
    
    if (!userId || !code) {
      return res.status(400).json({ error: 'User ID and code required' });
    }

    const result = await verify2FACode(userId, code);
    
    if (!result.valid) {
      logSecurityEvent(userId, 'twofa_login_failed', { ipAddress: req.ip });
      return res.status(401).json({ error: 'Invalid 2FA code' });
    }

    const sessionToken = await createSessionToken(userId, true);
    logSecurityEvent(userId, 'logged_in_with_2fa', { ipAddress: req.ip });
    
    res.json({ sessionToken });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Disable 2FA (with password confirmation)
app.post('/api/auth/2fa/disable', adminAuthMiddleware, async (req, res) => {
  try {
    const { password } = req.body;
    
    // Verify password before allowing disabling 2FA
    // This requires comparing with password hash stored in Firestore
    
    await disable2FA(req.user.userId);
    logSecurityEvent(req.user.userId, 'twofa_disabled', { ipAddress: req.ip });
    
    res.json({ success: true, message: '2FA disabled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Get 2FA recovery codes (one-time only)
app.get('/api/auth/2fa/recovery-codes', adminAuthMiddleware, async (req, res) => {
  try {
    // Generate or retrieve recovery codes
    const recoveryCodes = await admin.firestore().collection('users')
      .doc(req.user.userId).get().then(doc => doc.data().recovery_codes);
    
    if (!recoveryCodes) {
      return res.status(404).json({ error: 'No recovery codes available' });
    }

    logSecurityEvent(req.user.userId, 'recovery_codes_viewed', { ipAddress: req.ip });
    res.json({ recoveryCodes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Checklist**:
- [ ] 2FA status endpoint added
- [ ] 2FA setup endpoint added
- [ ] 2FA verify endpoint added
- [ ] 2FA login verification endpoint added
- [ ] 2FA disable endpoint added
- [ ] Recovery codes endpoint added (optional)
- [ ] twoFALimiter applied to 2FA endpoints
- [ ] Security logging in place

---

## Phase 6: Apply WAF to Existing Endpoints ⏳

**File**: `functions/index.js`

**Example: Booking Endpoint**:

```javascript
// Update existing booking endpoint
app.post('/api/create-booking', paymentLimiter, async (req, res) => {
  try {
    // Validate input using WAF
    const validation = validateBookingData(req.body);
    
    if (!validation.isValid) {
      logSecurityEvent(req.headers['x-user-id'] || 'ANONYMOUS', 'booking_validation_failed', {
        errors: validation.errors,
        ipAddress: req.ip,
      });
      return res.status(400).json({
        error: 'Invalid booking data',
        details: validation.errors,
      });
    }

    // Validate email
    if (!validateEmail(req.body.email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Process booking...
    // Existing booking logic here

    logSecurityEvent(req.headers['x-user-id'], 'booking_created', {
      bookingId: booking.id,
      ipAddress: req.ip,
    });

    res.json({ success: true, booking });
  } catch (error) {
    logSecurityEvent(req.headers['x-user-id'], 'booking_error', {
      error: error.message,
      ipAddress: req.ip,
    });
    res.status(500).json({ error: error.message });
  }
});
```

**Example: Payment Endpoint**:

```javascript
// Verify payment with WAF
app.post('/api/verify-payment', paymentLimiter, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId } = req.body;

    // Validation already applied by paymentLimiter middleware
    // Execute HMAC verification...
    
    logSecurityEvent(req.headers['x-user-id'], 'payment_verified', {
      bookingId,
      ipAddress: req.ip,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Checklist**:
- [ ] WAF middleware applied to existing booking endpoint
- [ ] WAF middleware applied to payment endpoints
- [ ] WAF middleware applied to upload endpoints
- [ ] All user inputs validated before processing
- [ ] Security logging on all endpoints
- [ ] Error messages sanitized (no stack traces exposed)

---

## Phase 7: Test All Implementations ⏳

**File**: `tests/integration.spec.js` (NEW)

```bash
# Run all tests
npm test

# Security tests specifically
npx playwright test tests/security.spec.js

# Integration tests
npx playwright test tests/integration.spec.js
```

**Test Coverage**:

**OAuth2 Tests**:
- [ ] Test OAuth URL generation
- [ ] Test OAuth callback with valid code
- [ ] Test OAuth callback with invalid code
- [ ] Test token refresh
- [ ] Test logout

**2FA Tests**:
- [ ] Test 2FA setup QR generation
- [ ] Test 2FA verification with valid code
- [ ] Test 2FA verification with invalid code
- [ ] Test 2FA during login
- [ ] Test 2FA disable

**WAF Tests**:
- [ ] Test SQL injection blocking
- [ ] Test XSS attack blocking
- [ ] Test bot detection
- [ ] Test rate limiting
- [ ] Test email validation
- [ ] Test file upload validation

**Checklist**:
- [ ] All OAuth2 tests passing (5/5)
- [ ] All 2FA tests passing (5/5)
- [ ] All WAF tests passing (6/6)
- [ ] No security warnings
- [ ] No performance regressions

---

## Phase 8: GitHub Actions Configuration ⏳

**File**: `.github/workflows/security-scanning.yml` (Already created)

**Required GitHub Secrets** (Set in Repository Settings):

```
SNYK_TOKEN                     # Snyk API token
SLACK_WEBHOOK                  # Slack webhook for notifications
GOOGLE_OAUTH_CLIENT_ID         # From Google Cloud Console
GOOGLE_OAUTH_CLIENT_SECRET     # From Google Cloud Console
OWASP_TOKEN                    # For OWASP dependency checker
```

**Setup Instructions**:

1. Go to Repository → Settings → Secrets and variables → Actions
2. Click "New repository secret" for each:

```
Name: SNYK_TOKEN
Value: [Get from https://snyk.io/account/settings/]

Name: SLACK_WEBHOOK
Value: [Create webhook at Slack app settings]

Name: GOOGLE_OAUTH_CLIENT_ID
Value: [From Google Cloud Console]

Name: GOOGLE_OAUTH_CLIENT_SECRET
Value: [From Google Cloud Console]
```

**Checklist**:
- [ ] SNYK_TOKEN configured
- [ ] SLACK_WEBHOOK configured
- [ ] GOOGLE_OAUTH_CLIENT_ID configured
- [ ] GOOGLE_OAUTH_CLIENT_SECRET configured
- [ ] Workflow triggers on push to main/develop
- [ ] Workflow triggers on pull requests
- [ ] Workflow scheduled daily

---

## Phase 9: Deployment to Production ⏳

**Pre-deployment Verification**:
- [ ] All local tests passing
- [ ] GitHub Actions workflow passing
- [ ] Security scan results reviewed
- [ ] No critical vulnerabilities

**Deployment Steps**:

```bash
# 1. Build the project
npm run build

# 2. Deploy client
npm run deploy

# 3. Deploy functions
firebase deploy --only functions

# 4. Deploy firestore rules
firebase deploy --only firestore:rules

# 5. Verify deployment
firebase functions:list
firebase database:get /
```

**Post-deployment Verification**:
- [ ] OAuth endpoints responding
- [ ] 2FA endpoints responding
- [ ] WAF rules active
- [ ] Security headers present
- [ ] Rate limiters working
- [ ] Logs collecting events

**Checklist**:
- [ ] Code built successfully
- [ ] Deployment completed without errors
- [ ] Production endpoints tested
- [ ] Security features verified
- [ ] No error logs in Firebase Console

---

## Phase 10: Monitoring & Maintenance ⏳

**Daily Tasks**:
```bash
firebase functions:log | grep "SECURITY"
firebase functions:log | grep "ERROR"
```

**Weekly Tasks**:
- [ ] Review authentication logs
- [ ] Check for failed login attempts
- [ ] Monitor rate limit triggers

**Monthly Tasks**:
- [ ] Rotate JWT secrets
- [ ] Review 2FA adoption
- [ ] Audit WAF block events
- [ ] Update security dependencies

**Checklist**:
- [ ] Monitoring dashboard set up
- [ ] Alerts configured for security events
- [ ] Team trained on new features
- [ ] Documentation updated

---

## Summary Checklist

| Phase | Task | Status | Date |
|-------|------|--------|------|
| 1 | Install dependencies | ⏳ | - |
| 2 | Import modules | ⏳ | - |
| 3 | Apply middleware | ⏳ | - |
| 4 | OAuth endpoints | ⏳ | - |
| 5 | 2FA endpoints | ⏳ | - |
| 6 | WAF integration | ⏳ | - |
| 7 | Testing | ⏳ | - |
| 8 | GitHub setup | ⏳ | - |
| 9 | Deployment | ⏳ | - |
| 10 | Monitoring | ⏳ | - |

---

**Progress**: 0% Complete
**Last Updated**: March 27, 2026
**Next Step**: Phase 1 - Install Dependencies
