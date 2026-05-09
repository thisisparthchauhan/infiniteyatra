import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { ToastProvider } from './context/ToastContext';
import { RoleProvider } from './context/RoleContext';
import { PackageProvider } from './context/PackageContext';
import { CurrencyProvider } from './context/CurrencyContext.jsx';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/layout/ScrollToTop';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleRoute from './components/auth/RoleRoute';
import EnquiryPopup from './components/booking/EnquiryPopup';
import AIChatbot from './components/ai/AIChatbot';

// Pages (lazy-loaded for initial bundle performance)
const Home = lazy(() => import('./pages/home/Home'));
const DestinationsPage = lazy(() => import('./pages/packages/DestinationsPage'));
const PackageDetail = lazy(() => import('./pages/packages/PackageDetail'));
const TripPlanner = lazy(() => import('./pages/planner/TripPlanner'));
const BlogPage = lazy(() => import('./pages/content/BlogPage'));
const BlogPost = lazy(() => import('./pages/content/BlogPost'));
const Careers = lazy(() => import('./pages/static/Careers'));
const Login = lazy(() => import('./pages/auth/Login'));
const Signup = lazy(() => import('./pages/auth/Signup'));
const BookingPage = lazy(() => import('./pages/packages/BookingPage'));
const MyBookings = lazy(() => import('./pages/user/MyBookings'));
const MyTrips = lazy(() => import('./pages/user/MyTrips'));
const QRLanding = lazy(() => import('./pages/planner/QRLanding'));
const TripDetails = lazy(() => import('./pages/user/TripDetails'));
const SharedPlan = lazy(() => import('./pages/planner/SharedPlan'));
const WishlistPage = lazy(() => import('./pages/user/WishlistPage'));
const ContactNew = lazy(() => import('./pages/static/ContactNew'));
const UserDashboard = lazy(() => import('./pages/user/UserDashboard'));
const StoriesPage = lazy(() => import('./pages/content/StoriesPage'));
const StoryDetail = lazy(() => import('./pages/content/StoryDetail'));
const Profile = lazy(() => import('./pages/user/Profile'));
const Hotels = lazy(() => import('./pages/hotels/Hotels'));
const AllHotels = lazy(() => import('./pages/hotels/AllHotels'));
const HotelDetail = lazy(() => import('./pages/hotels/HotelDetail'));
const HotelBookingPage = lazy(() => import('./pages/hotels/HotelBookingPage'));
const HotelBookingSuccess = lazy(() => import('./pages/hotels/HotelBookingSuccess'));
const HotelBookingConfirmation = lazy(() => import('./pages/hotels/HotelBookingConfirmation'));
const HotelPartnerOnboarding = lazy(() => import('./pages/hotels/HotelPartnerOnboarding'));
const MyHotelBookings = lazy(() => import('./pages/hotels/MyHotelBookings'));
const HotelCompare = lazy(() => import('./pages/hotels/HotelCompare'));

// Private Aviation
const PrivateJets = lazy(() => import('./pages/aviation/PrivateJets'));
const PrivateJetDetail = lazy(() => import('./pages/aviation/PrivateJetDetail'));

// Vendor Pages
import VendorLogin from './pages/vendor/VendorLogin';
import VendorDashboard from './pages/vendor/VendorDashboard';

// Transport Pages
import TransportListings from './pages/transport/TransportListings';
import TransportDetails from './pages/transport/TransportDetails';
import MyTransportBookings from './pages/transport/MyTransportBookings';

import AdminDashboard from './pages/admin/AdminDashboard';
import BookingSuccess from './pages/packages/BookingSuccess';

import MigrateData from './pages/internal/MigrateData';

import TermsConditions from './pages/static/TermsConditions';

import Future from './pages/internal/Future';
import Passport from './pages/user/Passport';
import TeamGuide from './pages/internal/TeamGuide';
import CityHotels from './pages/hotels/CityHotels';

import TransportationHub from './pages/transport/TransportationHub';
import VehicleDetail from './pages/transport/VehicleDetail';
import CruisePage from './pages/transport/CruisePage';
import CyclesPage from './pages/transport/CyclesPage';
import SplashScreen from './components/layout/SplashScreen';

const Layout = ({ children }) => {
  const location = useLocation();
  const isConnectPage = location.pathname === '/connect';
  const isAdminPage = location.pathname.startsWith('/admin');
  const isFuturePage = location.pathname === '/future';
  const shouldHideLayout = isConnectPage || isAdminPage || isFuturePage;

  return (
    <>

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
                        <Route path="/team-guide" element={<TeamGuide />} />
                        <Route path="/passport" element={<ProtectedRoute><Passport /></ProtectedRoute>} />

                        {/* NEW: IY Hotels Vertical */}
                        <Route path="/hotels" element={<Hotels />} />
                        <Route path="/hotels/city/:citySlug" element={<CityHotels />} />
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

                        {/* IY Private Aviation */}
                        <Route path="/private-aviation" element={<PrivateJets />} />
                        <Route path="/private-aviation/:jetId" element={<PrivateJetDetail />} />
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
