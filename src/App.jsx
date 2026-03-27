import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { ToastProvider } from './context/ToastContext';
import { RoleProvider } from './context/RoleContext';
import { PackageProvider } from './context/PackageContext';
import { CurrencyProvider } from './context/CurrencyContext.jsx';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import EnquiryPopup from './components/EnquiryPopup';
import AIChatbot from './components/AIChatbot';
import MaintenanceBanner from './components/MaintenanceBanner';

// Pages (lazy-loaded for initial bundle performance)
const Home = lazy(() => import('./pages/Home'));
const DestinationsPage = lazy(() => import('./pages/DestinationsPage'));
const PackageDetail = lazy(() => import('./pages/PackageDetail'));
const TripPlanner = lazy(() => import('./pages/TripPlanner'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const Careers = lazy(() => import('./pages/Careers'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const MyBookings = lazy(() => import('./pages/MyBookings'));
const MyTrips = lazy(() => import('./pages/MyTrips'));
const QRLanding = lazy(() => import('./pages/QRLanding'));
const TripDetails = lazy(() => import('./pages/TripDetails'));
const SharedPlan = lazy(() => import('./pages/SharedPlan'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const ContactNew = lazy(() => import('./pages/ContactNew'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const StoriesPage = lazy(() => import('./pages/StoriesPage'));
const StoryDetail = lazy(() => import('./pages/StoryDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const Hotels = lazy(() => import('./pages/Hotels'));
const AllHotels = lazy(() => import('./pages/AllHotels'));
const HotelDetail = lazy(() => import('./pages/HotelDetail'));
const HotelBookingPage = lazy(() => import('./pages/HotelBookingPage'));
const HotelBookingSuccess = lazy(() => import('./pages/HotelBookingSuccess'));
const HotelBookingConfirmation = lazy(() => import('./pages/HotelBookingConfirmation'));
const HotelPartnerOnboarding = lazy(() => import('./pages/HotelPartnerOnboarding'));
const MyHotelBookings = lazy(() => import('./pages/MyHotelBookings'));
const HotelCompare = lazy(() => import('./pages/HotelCompare'));

// Vendor Pages
import VendorLogin from './pages/vendor/VendorLogin';
import VendorDashboard from './pages/vendor/VendorDashboard';

// Transport Pages
import TransportListings from './pages/transport/TransportListings';
import TransportDetails from './pages/transport/TransportDetails';
import MyTransportBookings from './pages/transport/MyTransportBookings';

import AdminDashboard from './pages/AdminDashboard';
import BookingSuccess from './pages/BookingSuccess';

import MigrateData from './pages/MigrateData';

import TermsConditions from './pages/TermsConditions';

import Future from './pages/Future';
import Passport from './pages/Passport';

import TransportationHub from './pages/TransportationHub';
import VehicleDetail from './pages/VehicleDetail';
import CruisePage from './pages/CruisePage';
import CyclesPage from './pages/CyclesPage';
import SplashScreen from './components/SplashScreen';

const Layout = ({ children }) => {
  const location = useLocation();
  const isConnectPage = location.pathname === '/connect';
  const isAdminPage = location.pathname.startsWith('/admin');
  const isFuturePage = location.pathname === '/future';
  const shouldHideLayout = isConnectPage || isAdminPage || isFuturePage;

  return (
    <>
      {!isAdminPage && <MaintenanceBanner />}
      <ScrollToTop />
      {!shouldHideLayout && <Navbar />}
      <main>
        {children}
      </main>
      {!shouldHideLayout && (
        <>
          <Footer />
          <EnquiryPopup />
          <AIChatbot />
        </>
      )}
    </>
  );
};

function App() {
  console.log('App component rendering');
  return (
    <>
      <SplashScreen />
      <HelmetProvider>
      <ToastProvider>
        <RoleProvider>
          <AuthProvider>
            <WishlistProvider>
              <CurrencyProvider>
                <PackageProvider>
                  <Router>
                    <Layout>
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/destinations" element={<DestinationsPage />} />
                        <Route path="/trip-planner" element={<TripPlanner />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/package/:id" element={<PackageDetail />} />
                        <Route path="/wishlist" element={<WishlistPage />} />
                        <Route
                          path="/dashboard"
                          element={
                            <ProtectedRoute>
                              <UserDashboard />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/profile"
                          element={
                            <ProtectedRoute>
                              <Profile />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/profile/transport-bookings"
                          element={
                            <ProtectedRoute>
                              <MyTransportBookings />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="/blog" element={<BlogPage />} />
                        <Route path="/blog/:id" element={<BlogPost />} />
                        <Route path="/stories" element={<StoriesPage />} />
                        <Route path="/story/:id" element={<StoryDetail />} />
                        <Route path="/contact" element={<ContactNew />} />
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
                        <Route path="/plan/:shareId" element={<SharedPlan />} />
                        <Route
                          path="/admin"
                          element={
                            <RoleRoute allowedRoles={['admin', 'ops', 'finance']}>
                              <AdminDashboard />
                            </RoleRoute>
                          }
                        />
                        <Route path="/connect" element={<QRLanding />} />
                        <Route path="/booking-success" element={<BookingSuccess />} />
                        <Route path="/terms" element={<TermsConditions />} />
                        <Route path="/migrate-packages-fix" element={<MigrateData />} />
                        <Route path="/future" element={<Future />} />
                        <Route path="/passport" element={<ProtectedRoute><Passport /></ProtectedRoute>} />

                        {/* NEW: IY Hotels Vertical */}
                        <Route path="/hotels" element={<Hotels />} />
                        <Route path="/hotels/all" element={<AllHotels />} />
                        <Route path="/hotels/booking-confirmation" element={<HotelBookingConfirmation />} />
                        <Route path="/hotels/compare" element={<HotelCompare />} />
                        <Route path="/hotels/:id" element={<HotelDetail />} />
                        <Route path="/hotels/book/:id" element={<HotelBookingPage />} />
                        <Route path="/hotels/success" element={<HotelBookingSuccess />} />
                        <Route path="/my-hotel-bookings" element={<ProtectedRoute><MyHotelBookings /></ProtectedRoute>} />
                        <Route path="/partner/hotel-onboarding" element={<HotelPartnerOnboarding />} />

                        {/* Vendor Portal */}
                        <Route path="/vendor/login" element={<VendorLogin />} />
                        <Route path="/vendor/dashboard" element={<VendorDashboard />} />

                        {/* IY Transport Vertical */}
                        <Route path="/transport/search" element={<TransportListings />} />
                        <Route path="/transport/book/:id" element={<TransportDetails />} />
                        <Route path="/transportation" element={<TransportationHub />} />
                        <Route path="/transportation/:vehicleId" element={<VehicleDetail />} />
                        <Route path="/cruise" element={<CruisePage />} />
                        <Route path="/cycles" element={<CyclesPage />} />
                      </Routes>
                    </Suspense>
                    </Layout>
                  </Router>
                </PackageProvider>
              </CurrencyProvider>
            </WishlistProvider>
          </AuthProvider>
        </RoleProvider>
      </ToastProvider>
    </HelmetProvider>
    </>
  );
}

export default App;
