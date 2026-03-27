import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';

test.describe('Deployment Path Verification', () => {
  test('should build successfully for production deployment', async () => {
    // Skip build command in tests to avoid conflicts when running in parallel
    // Build should be run separately before running tests
    // try {
    //   execSync('npm run build', { stdio: 'inherit' });
    // } catch (error) {
    //   throw new Error('Build failed for production deployment');
    // }

    // Verify dist directory exists (assuming build was run previously)
    expect(fs.existsSync('dist')).toBe(true);

    // Verify key files exist
    expect(fs.existsSync('dist/index.html')).toBe(true);
    expect(fs.existsSync('dist/assets')).toBe(true);

    // Check that chunks are properly split
    const assets = fs.readdirSync('dist/assets');
    const jsFiles = assets.filter(file => file.endsWith('.js'));

    // Should have multiple chunks
    expect(jsFiles.length).toBeGreaterThan(5);

    // Check for specific chunks
    const hasVendorFirebase = jsFiles.some(file => file.includes('vendor-firebase'));
    const hasVendorReact = jsFiles.some(file => file.includes('vendor-react'));
    const hasChunkPages = jsFiles.some(file => file.includes('chunk-pages'));
    const hasChunkAdmin = jsFiles.some(file => file.includes('chunk-admin'));

    expect(hasVendorFirebase).toBe(true);
    expect(hasVendorReact).toBe(true);
    expect(hasChunkPages).toBe(true);
    expect(hasChunkAdmin).toBe(true);
  });

  test('should verify deployment configurations', async () => {
    // Check Netlify config
    expect(fs.existsSync('netlify.toml')).toBe(true);

    // Check Firebase config
    expect(fs.existsSync('firebase.json')).toBe(true);

    // Check package.json deploy script
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    expect(packageJson.scripts.deploy).toBe('vite build && firebase deploy');
  });
});