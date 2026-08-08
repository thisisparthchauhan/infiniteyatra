import dotenv from 'dotenv';

dotenv.config();

const required = ['MONGODB_URI', 'JWT_SECRET'];

export const env = {
    port: Number(process.env.PORT) || 8080,
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    mongoUri: process.env.MONGODB_URI || '',
    jwtSecret: process.env.JWT_SECRET || '',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    adminEmails: (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
};

// Warn loudly (rather than crash) so the server can still boot for a health
// check during setup — the DB/auth routes will fail clearly if these are unset.
export function reportMissingEnv() {
    const missing = required.filter((k) => !process.env[k]);
    if (missing.length) {
        console.warn(`⚠️  Missing env vars: ${missing.join(', ')} — see server/.env.example`);
    }
    return missing;
}
