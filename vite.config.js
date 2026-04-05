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
            // Only match core React packages by exact folder name
            if (id.includes('/node_modules/react-dom/') || id.includes('/node_modules/react-router-dom/') || id.includes('/node_modules/react-router/') || id.includes('/node_modules/react-helmet-async/')) {
              return 'vendor-react';
            }
            // Match react core last (exact path to avoid matching react-hot-toast etc.)
            if (id.match(/\/node_modules\/react\//)) {
              return 'vendor-react';
            }
            if (id.includes('/node_modules/firebase/')) {
              return 'vendor-firebase';
            }
            if (id.includes('/node_modules/recharts/') || id.includes('/node_modules/framer-motion/') || id.includes('/node_modules/lucide-react/') || id.includes('/node_modules/html2canvas/') || id.includes('/node_modules/jspdf/')) {
              return 'vendor-ui';
            }
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
