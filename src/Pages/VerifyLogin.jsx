import { useState } from "react";
import { useSearchParams } from "react-router";
import PageTransition from "../Components/PageTransition";
import { supabase } from "../supabase";

function VerifyLogin() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [status, setStatus] = useState(token && email ? "ready" : "invalid");

  const handleVerify = () => {
    setStatus("loading");

    supabase.auth.verifyOtp({ token_hash: token, type: 'email' })
      .then(({ error }) => {
        if (error) {
          if (error.message?.toLowerCase().includes('expired') || error.message?.toLowerCase().includes('invalid')) {
            setStatus("expired");
          } else {
            setStatus("invalid");
          }
        } else {
          setStatus("success");
        }
      })
      .catch(() => setStatus("invalid"));
  };

  if (status === "ready") {
    return (
      <PageTransition>
        <section className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#1a8efd]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to DocScout</h2>
            {email && <p className="text-[#1a8efd] font-semibold text-sm mb-3">{email}</p>}
            <p className="text-gray-500 text-sm mb-6">Click below to complete your one-click sign-in.</p>
            <button
              type="button"
              onClick={handleVerify}
              className="w-full bg-[#1a8efd] hover:bg-[#0077e6] text-white py-2.5 rounded-lg text-sm font-semibold transition"
            >
              Sign me in
            </button>
          </div>
        </section>
      </PageTransition>
    );
  }

  if (status === "loading") {
    return (
      <PageTransition>
        <section className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#1a8efd] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Signing you in...</p>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Signed in!</h2>
            {email && <p className="text-[#1a8efd] font-semibold text-sm mb-3">{email}</p>}
            <p className="text-gray-500 text-sm">
              You're now signed in. You can close this window — the other tab is ready.
            </p>
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
            <p className="text-gray-500 text-sm">This sign-in link has expired (links are valid for 1 hour). Please go back and request a new one.</p>
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
          <p className="text-gray-500 text-sm">This sign-in link is invalid or has already been used. Please request a new one.</p>
        </div>
      </section>
    </PageTransition>
  );
}

export default VerifyLogin;
