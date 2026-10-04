import { useEffect } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { AdminRoute, GuestOnlyRoute, ProtectedRoute } from './components/RouteGuards';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Dashboard from './pages/Dashboard';
import Friends from './pages/Friends';
import Chat from './pages/Chat';
import Community from './pages/Community';
import PostTravelPlan from './pages/travel/PostTravelPlan';
import EditTravelPlan from './pages/travel/EditTravelPlan';
import ViewTravelPlan from './pages/travel/ViewTravelPlan';
import MyPlans from './pages/travel/MyPlans';
import MyJoinedUsers from './pages/travel/MyJoinedUsers';
import PendingRequests from './pages/travel/PendingRequests';
import SentRequests from './pages/travel/SentRequests';
import AdminLayout from './pages/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTravelPlans from './pages/admin/AdminTravelPlans';
import AdminPackages from './pages/admin/AdminPackages';
import AdminCommunity from './pages/admin/AdminCommunity';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function NotFound() {
  return (
    <div className="hero-bg-home min-h-screen flex items-center justify-center text-white px-4">
      <div className="text-center">
        <h1 className="text-6xl font-black gradient-text mb-4">404</h1>
        <p className="text-gray-300 mb-6">This page does not exist.</p>
        <Link to="/" className="bg-violet-600 hover:bg-violet-700 px-6 py-3 rounded-xl font-medium">Go home</Link>
      </div>
    </div>
  );
}

/**
 * URLs are the same as the old Thymeleaf pages, so existing links/bookmarks keep working.
 * Spring Boot serves index.html for all of them (SpaWebConfig).
 */
export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />

        <Route element={<GuestOnlyRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/user/dashboard" element={<Dashboard />} />
          <Route path="/user/profile" element={<Profile />} />
          <Route path="/user/profile/edit" element={<EditProfile />} />
          <Route path="/user/profile/:userId" element={<Profile />} />
          <Route path="/user/friends" element={<Friends />} />
          <Route path="/user/chat" element={<Chat />} />
          <Route path="/user/community" element={<Community />} />
          <Route path="/user/travel/post" element={<PostTravelPlan />} />
          <Route path="/user/travel/myplans" element={<MyPlans />} />
          <Route path="/user/travel/edit/:id" element={<EditTravelPlan />} />
          <Route path="/user/travel/public/view/:id" element={<ViewTravelPlan />} />
          <Route path="/user/travel/my-joined-users" element={<MyJoinedUsers />} />
          <Route path="/user/requests/pending" element={<PendingRequests />} />
          <Route path="/user/requests/sent" element={<SentRequests />} />

          <Route path="/admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="travel-plans" element={<AdminTravelPlans />} />
              <Route path="packages" element={<AdminPackages />} />
              <Route path="community" element={<AdminCommunity />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
