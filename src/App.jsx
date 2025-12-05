import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import EnquiryPopup from './components/EnquiryPopup';

// Pages
import Home from './pages/Home';
import DestinationsPage from './pages/DestinationsPage';
import PackageDetail from './pages/PackageDetail';
import TripPlanner from './pages/TripPlanner';
import BlogPage from './pages/BlogPage';
import BlogPost from './pages/BlogPost';
import Careers from './pages/Careers';
import Login from './pages/Login';
import Signup from './pages/Signup';
import BookingPage from './pages/BookingPage';
import MyBookings from './pages/MyBookings';
import MyTrips from './pages/MyTrips';
import TripDetails from './pages/TripDetails';

// Lazy load AdminDashboard to avoid potential circular dependencies or build issues
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <EnquiryPopup />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/destinations" element={<DestinationsPage />} />
                <Route path="/trip-planner" element={<TripPlanner />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/package/:id" element={<PackageDetail />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:id" element={<BlogPost />} />
                <Route path="/careers" element={<Careers />} />
                <Route
                  path="/booking/:id"
                  element={
                    <ProtectedRoute>
                      <BookingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-bookings"
                  element={
                    <ProtectedRoute>
                      <MyBookings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-trips"
                  element={
                    <ProtectedRoute>
                      <MyTrips />
                    </ProtectedRoute>
                  }
                />
                <Route path="/trip/:tripId" element={<TripDetails />} />
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
                        <AdminDashboard />
                      </Suspense>
                    </AdminRoute>
                  }
                />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;

