process.env.NODE_ENV = 'test';
process.env.DB_HOST = process.env.DB_HOST || '127.0.0.1';
process.env.DB_NAME = process.env.DB_NAME || 'iy_test';
process.env.DB_USER = process.env.DB_USER || 'iy_test';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'iy_test_local_only';
process.env.SESSION_SECRET = 'test-secret-that-is-long-enough-for-checks';
process.env.APP_ORIGIN = 'http://localhost:5173';
process.env.PUBLIC_APP_URL = 'http://localhost:5173';
delete process.env.PRIVATE_STORAGE_DIR;   // storage gated off, as at launch

// Raised so a suite exercising many flows in one process does not trip a
// limiter that is behaving correctly. One dedicated test lowers them again.
process.env.RATE_LIMIT_AUTH_MAX = '10000';
process.env.RATE_LIMIT_STAFF_AUTH_MAX = '10000';
process.env.RATE_LIMIT_BOOKING_MAX = '10000';
process.env.RATE_LIMIT_GLOBAL_MAX = '100000';
