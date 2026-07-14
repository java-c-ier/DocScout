import React, { useState, useEffect } from "react";
import PageTransition from "../Components/PageTransition";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
} from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, where, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./../Firebase";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../AuthContext";

const ADMIN_EMAIL = "jimutksahoo99@gmail.com";
const MSG_NOT_FOUND = "No account found for the entered email. Please create an account for login.";
const MSG_INACTIVE = "Your account is inactive. Please contact your admin or fill the contact form.";

const EyeIcon = ({ open }) =>
  open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.7-3.4-11.3-8l-6.5 5C9.8 39.7 16.4 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.8l6.2 5.2C41.4 36 44 30.4 44 24c0-1.2-.1-2.4-.4-3.5z" />
  </svg>
);

function SignIn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") === "signup" ? "signup" : "login");
  const { blockedError, clearBlockedError } = useAuth();

  useEffect(() => {
    if (blockedError) {
      setError(blockedError);
      clearBlockedError();
    }
  }, [blockedError]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Email verification screen
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationSource, setVerificationSource] = useState("signup"); // "signup" | "login"
  const [verificationEmail, setVerificationEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Forgot password modal
  const [showForgotPw, setShowForgotPw] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const googleProvider = new GoogleAuthProvider();

  const navigateHome = () => {
    document.body.style.transition = "opacity 0.25s ease";
    document.body.style.opacity = "0";
    setTimeout(() => {
      navigate("/");
      setTimeout(() => { document.body.style.opacity = "1"; }, 50);
    }, 250);
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((v) => {
        if (v <= 1) { clearInterval(interval); return 0; }
        return v - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      if (tab === "login") {
        const userQ = query(collection(db, "users"), where("email", "==", email));
        const userSnap = await getDocs(userQ);
        if (userSnap.empty) { setError(MSG_NOT_FOUND); return; }
        if (userSnap.docs[0].data().blocked) { setError(MSG_INACTIVE); return; }
        const cred = await signInWithEmailAndPassword(auth, email, password);
        if (!cred.user.emailVerified) {
          await sendEmailVerification(cred.user);
          await signOut(auth);
          setVerificationEmail(email);
          setVerificationSource("login");
          setVerificationSent(true);
          startResendCooldown();
          return;
        }
        navigateHome();
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const name = fullName.trim();
        if (name) await updateProfile(cred.user, { displayName: name });
        await setDoc(doc(db, "users", cred.user.uid), {
          email: cred.user.email,
          displayName: name || "",
          role: cred.user.email === ADMIN_EMAIL ? "admin" : "user",
          provider: "password",
          createdAt: serverTimestamp(),
        });
        await sendEmailVerification(cred.user);
        await signOut(auth);
        setVerificationEmail(email);
        setVerificationSource("signup");
        setVerificationSent(true);
        startResendCooldown();
      }
    } catch (err) {
      if (err.code === "auth/email-already-in-use" && tab === "signup") {
        const q = query(collection(db, "users"), where("email", "==", email), where("blocked", "==", true));
        const snap = await getDocs(q);
        if (!snap.empty) { setError(MSG_INACTIVE); return; }
      }
      const code = err.code || "";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        setError("Invalid email or password.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many failed attempts. Try again later or reset your password.");
      } else if (code === "auth/user-disabled") {
        setError(MSG_INACTIVE);
      } else {
        setError(err.message.replace("Firebase: ", "").replace(/\(auth\/.*\)\.?/, "").trim() || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    setResending(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(cred.user);
      await signOut(auth);
      startResendCooldown();
    } catch {
      // ignore
    } finally {
      setResending(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigateHome();
    } catch (err) {
      const code = err.code || "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
      setError(err.message.replace("Firebase: ", "").replace(/\(auth\/.*\)\.?/, "").trim() || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      setForgotSent(true);
    } catch (err) {
      const msg = err.message.replace("Firebase: ", "").replace(/\(auth\/.*\)\.?/, "").trim();
      setError(msg);
      setShowForgotPw(false);
    } finally {
      setForgotLoading(false);
    }
  };

  const switchTab = (t) => {
    setTab(t);
    setError("");
    setEmail("");
    setPassword("");
    setFullName("");
  };

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a8efd] focus:border-transparent transition";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  // --- Email verification screen ---
  if (verificationSent) {
    const isLoginBlock = verificationSource === "login";
    return (
      <PageTransition>
      <section className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${isLoginBlock ? "bg-amber-50" : "bg-blue-50"}`}>
            {isLoginBlock ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#1a8efd]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            )}
          </div>

          {isLoginBlock ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email not verified</h2>
              <p className="text-gray-500 text-sm mb-1">Your email address is not verified yet.</p>
              <p className="text-[#1a8efd] font-semibold text-sm mb-4">{verificationEmail}</p>
              <p className="text-gray-400 text-xs mb-8">
                Please check your inbox for the verification email, verify your email address and then try logging in again.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your inbox</h2>
              <p className="text-gray-500 text-sm mb-1">We sent a verification email to</p>
              <p className="text-[#1a8efd] font-semibold text-sm mb-4">{verificationEmail}</p>
              <p className="text-gray-400 text-xs mb-8">
                Click the link in the email to verify your account. After verifying, come back and log in.
              </p>
            </>
          )}

          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resending || resendCooldown > 0}
            className="w-full border border-[#1a8efd] text-[#1a8efd] hover:bg-blue-50 disabled:opacity-50 py-2.5 rounded-lg text-sm font-semibold transition mb-3"
          >
            {resending ? "Sending..." : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend verification email"}
          </button>
          <button
            type="button"
            onClick={() => { setVerificationSent(false); switchTab("login"); }}
            className="w-full text-gray-500 hover:text-gray-700 text-sm font-medium transition"
          >
            Back to Log in
          </button>
        </div>
      </section>
      </PageTransition>
    );
  }

  const formBody = (isLogin) => (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5"
    >
      {!isLogin && (
        <div>
          <label className={labelClass}>Full name <span className="text-red-500">*</span></label>
          <input
            required={tab === "signup"}
            type="text"
            placeholder="Your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClass}
            tabIndex={tab === "signup" ? 0 : -1}
          />
        </div>
      )}

      <div>
        <label className={labelClass}>Email <span className="text-red-500">*</span></label>
        <input
          required
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          tabIndex={isLogin === (tab === "login") ? 0 : -1}
        />
      </div>

      <div>
        <label className={labelClass}>Password <span className="text-red-500">*</span></label>
        <div className="relative">
          <input
            required
            type={showPw ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClass} pr-10`}
            tabIndex={isLogin === (tab === "login") ? 0 : -1}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={isLogin === (tab === "login") ? 0 : -1}
          >
            <EyeIcon open={showPw} />
          </button>
        </div>
      </div>

      {isLogin && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => { setForgotEmail(email); setShowForgotPw(true); setForgotSent(false); }}
            className="text-sm font-medium text-[#1a8efd] hover:underline"
            tabIndex={tab === "login" ? 0 : -1}
          >
            Forgot password?
          </button>
        </div>
      )}

      {error && isLogin === (tab === "login") && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#1a8efd] hover:bg-[#0077e6] disabled:opacity-60 text-white py-3 rounded-lg text-base font-semibold transition"
        tabIndex={isLogin === (tab === "login") ? 0 : -1}
      >
        {loading ? "Please wait..." : isLogin ? "Sign in" : "Create account"}
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">OR</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <button
        type="button"
        onClick={isLogin === (tab === "login") ? handleGoogle : undefined}
        className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        tabIndex={isLogin === (tab === "login") ? 0 : -1}
      >
        <GoogleIcon />
        {isLogin ? "Sign in with Google" : "Sign up with Google"}
      </button>
    </form>
  );

  return (
    <PageTransition>
    <section className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">

        <div className="flex flex-col items-center mb-8 gap-2">
          <h1 className="text-3xl font-bold text-[#1a8efd] tracking-tight">DocScout</h1>
          <p className="text-gray-500 text-sm">
            {tab === "login" ? "Welcome back! Please log in." : "Create your account to get started."}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">

          <div className="flex rounded-xl bg-gray-100 p-1 mb-7">
            {[{ key: "login", label: "Log in" }, { key: "signup", label: "Sign up" }].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => switchTab(key)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  tab === key
                    ? "bg-white text-[#1a8efd] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ display: "grid" }}>
            <div style={{ gridArea: "1/1", visibility: tab === "signup" ? "visible" : "hidden", pointerEvents: tab === "signup" ? "auto" : "none" }}>{formBody(false)}</div>
            <div style={{ gridArea: "1/1", visibility: tab === "login" ? "visible" : "hidden", pointerEvents: tab === "login" ? "auto" : "none" }}>{formBody(true)}</div>
          </div>

        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
            {forgotSent ? (
              <div className="text-center">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Email sent</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Password reset link sent to <span className="font-medium text-gray-700">{forgotEmail}</span>. Check your inbox.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotPw(false)}
                  className="w-full bg-[#1a8efd] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#0077e6] transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Forgot password?</h3>
                <p className="text-sm text-gray-500 mb-5">Enter your email and we'll send you a reset link.</p>
                <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                  <div>
                    <label className={labelClass}>Email</label>
                    <input
                      required
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowForgotPw(false)}
                      className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 py-2.5 rounded-lg text-sm font-semibold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 bg-[#1a8efd] hover:bg-[#0077e6] disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-semibold transition"
                    >
                      {forgotLoading ? "Sending..." : "Send link"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </section>
    </PageTransition>
  );
}

export default SignIn;
