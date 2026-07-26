import React, { Suspense, lazy } from "react";
import { Route, Routes, useLocation } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Home from "../Pages/Home";
import Nav from "../Components/Nav";
import CSVUpload from "../Components/CSVUpload";
import CSVUploadDoctors from "../Components/CSVUploadDoctors";
import ProtectedRoute from "../Components/ProtectedRoute";

const SignIn = lazy(() => import("../Pages/SignIn"));
const SignUp = lazy(() => import("../Pages/SignUp"));
const Profile = lazy(() => import("../Pages/Profile"));
const Admin = lazy(() => import("../Pages/Admin"));
const VerifyEmail = lazy(() => import("../Pages/VerifyEmail"));
const VerifyLogin = lazy(() => import("../Pages/VerifyLogin"));

function Routing() {
  const location = useLocation();
  const isAuthPage = ["/signin", "/signup", "/verify-email", "/verify-login"].includes(location.pathname);

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} newestOnTop closeOnClick pauseOnHover draggable theme="colored" />
      {!isAuthPage && <Nav />}
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<CSVUpload />} />
          <Route path="/uploadDoctors" element={<CSVUploadDoctors />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignIn />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify-login" element={<VerifyLogin />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <Admin />
            </ProtectedRoute>
          } />
        </Routes>
      </Suspense>
    </div>
  );
}

export default Routing;
