import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import PageTransition from "../Components/PageTransition";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading"); // loading | success | invalid | expired | used
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }

    fetch("/.netlify/functions/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) { setEmail(data.email || ""); setStatus("success"); }
        else if (data.error === "expired") setStatus("expired");
        else if (data.error === "already_used") setStatus("used");
        else setStatus("invalid");
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  const goToLogin = () => navigate("/signin");

  if (status === "loading") {
    return (
      <PageTransition>
        <section className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#1a8efd] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Verifying your email...</p>
          </div>
        </section>
      </PageTransition>
    );
  }

  if (status === "success") {
    return (
      <PageTransition>
        <section className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email verified!</h2>
            <p className="text-gray-500 text-sm mb-1">Your email address has been verified successfully.</p>
            {email && <p className="text-[#1a8efd] font-semibold text-sm mb-6">{email}</p>}
            <p className="text-gray-400 text-xs mb-8">You can now log in to your DocScout account.</p>
            <button
              onClick={goToLogin}
              className="w-full bg-[#1a8efd] hover:bg-[#0077e6] text-white py-3 rounded-lg text-sm font-semibold transition"
            >
              Go to Login
            </button>
          </div>
        </section>
      </PageTransition>
    );
  }

  if (status === "used") {
    return (
      <PageTransition>
        <section className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#1a8efd]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Already verified</h2>
            <p className="text-gray-500 text-sm mb-8">This verification link has already been used. Your email is verified — go ahead and log in.</p>
            <button onClick={goToLogin} className="w-full bg-[#1a8efd] hover:bg-[#0077e6] text-white py-3 rounded-lg text-sm font-semibold transition">
              Go to Login
            </button>
          </div>
        </section>
      </PageTransition>
    );
  }

  if (status === "expired") {
    return (
      <PageTransition>
        <section className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Link expired</h2>
            <p className="text-gray-500 text-sm mb-8">This verification link has expired (links are valid for 24 hours). Please log in again to receive a new verification email.</p>
            <button onClick={goToLogin} className="w-full bg-[#1a8efd] hover:bg-[#0077e6] text-white py-3 rounded-lg text-sm font-semibold transition">
              Back to Login
            </button>
          </div>
        </section>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <section className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid link</h2>
          <p className="text-gray-500 text-sm mb-8">This verification link is invalid or has already been used. Please log in to request a new one.</p>
          <button onClick={goToLogin} className="w-full bg-[#1a8efd] hover:bg-[#0077e6] text-white py-3 rounded-lg text-sm font-semibold transition">
            Back to Login
          </button>
        </div>
      </section>
    </PageTransition>
  );
}

export default VerifyEmail;
