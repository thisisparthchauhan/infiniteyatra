import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001/infiniteyatra-iy/us-central1/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom') || id.includes('react-helmet-async')) {
              return 'vendor-react';
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('recharts') || id.includes('framer-motion') || id.includes('lucide-react') || id.includes('html2canvas') || id.includes('jspdf')) {
              return 'vendor-ui';
            }
            if (id.includes('tailwindcss') || id.includes('clsx') || id.includes('date-fns')) {
              return 'vendor-ui-helpers';
            }
            return 'vendor';
          }

          if (id.includes('/src/pages/AdminDashboard') || id.includes('/src/pages/admin/AdminDashboard')) {
            return 'chunk-admin-dashboard';
          }

          if (id.includes('/src/pages/UserDashboard')) {
            return 'chunk-user-dashboard';
          }

          if (id.includes('/src/pages/TripPlanner')) {
            return 'chunk-tripplanner';
          }

          if (id.includes('/src/pages/Hotels') || id.includes('/src/pages/HotelDetail') || id.includes('/src/pages/HotelCompare')) {
            return 'chunk-hotels';
          }

          if (id.includes('/src/pages/')) {
            return 'chunk-pages';
          }

          if (id.includes('/src/components/admin/')) {
            return 'chunk-admin';
          }

          if (id.includes('/src/components/') || id.includes('/src/context/')) {
            return 'chunk-ui';
          }

          return null;
        }
      }
    }
  }
})
