import React, { Suspense, lazy } from "react";
import { Route, Routes, useLocation } from "react-router";
import Home from "../Pages/Home";
import Nav from "../Components/Nav";
import CSVUpload from "../Components/CSVUpload";
import CSVUploadDoctors from "../Components/CSVUploadDoctors";
import ProtectedRoute from "../Components/ProtectedRoute";

const SignIn = lazy(() => import("../Pages/SignIn"));
const SignUp = lazy(() => import("../Pages/SignUp"));
const Profile = lazy(() => import("../Pages/Profile"));
const Admin = lazy(() => import("../Pages/Admin"));

function Routing() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/signin" || location.pathname === "/signup";

  return (
    <div>
      {!isAuthPage && <Nav />}
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<CSVUpload />} />
          <Route path="/uploadDoctors" element={<CSVUploadDoctors />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
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
