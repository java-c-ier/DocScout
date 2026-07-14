import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../Firebase";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);
  const [authLoading, setAuthLoading] = useState(!auth.currentUser);

  const [displayName, setDisplayName] = useState(auth.currentUser?.displayName || "");
  const [savingName, setSavingName] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setDisplayName(firebaseUser.displayName || "");
      } else {
        navigate("/");
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-[#1a8efd] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const isGoogleUser = user.providerData?.some((p) => p.providerId === "google.com") ?? false;
  const isEmailUser = user.providerData?.some((p) => p.providerId === "password") ?? false;

  const initials = (user.displayName || user.email || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSaveName = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) { toast.error("Name cannot be empty."); return; }
    setSavingName(true);
    try {
      await updateProfile(user, { displayName: displayName.trim() });
      setUser({ ...auth.currentUser });
      window.dispatchEvent(new Event("profileUpdated"));
      toast.success("Name updated successfully.");
    } catch {
      toast.error("Failed to update name. Try again.");
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPw.length < 6) { toast.error("New password must be at least 6 characters."); return; }
    if (newPw !== confirmPw) { toast.error("Passwords do not match."); return; }
    setSavingPw(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPw);
      toast.success("Password updated successfully.");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        toast.error("Current password is incorrect.");
      } else {
        toast.error("Failed to update password. Try signing out and back in.");
      }
    } finally {
      setSavingPw(false);
    }
  };

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a8efd] focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  const EyeBtn = ({ show, onToggle }) => (
    <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
      {show ? (
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
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="mx-auto max-w-2xl pt-24 px-4">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          {user.photoURL ? (
            <img src={user.photoURL} alt="avatar" className="w-16 h-16 rounded-full object-cover ring-2 ring-[#1a8efd]" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#1a8efd] flex items-center justify-center text-white text-xl font-bold ring-2 ring-[#1a8efd]">
              {initials}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.displayName || "Your Profile"}</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${isGoogleUser ? "bg-blue-50 text-blue-600 border border-blue-600" : "bg-gray-100 text-gray-600 border border-gray-400"}`}>
                {isGoogleUser ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-3.5 w-3.5 shrink-0">
                      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" />
                      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.7-3.4-11.3-8l-6.5 5C9.8 39.7 16.4 44 24 44z" />
                      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.8l6.2 5.2C41.4 36 44 30.4 44 24c0-1.2-.1-2.4-.4-3.5z" />
                    </svg>
                    Google account
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email &amp; Password
                  </>
                )}
              </span>
              {!isGoogleUser && user.emailVerified && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Email Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Edit Name */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Personal Information</h2>
          <form onSubmit={handleSaveName} className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>Full name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => !isGoogleUser && setDisplayName(e.target.value)}
                placeholder="Your full name"
                disabled={isGoogleUser}
                className={inputClass}
              />
              {isGoogleUser && (
                <p className="mt-1 text-xs text-gray-400">Name is managed by your Google account.</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Email address</label>
              <input
                type="email"
                value={user.email}
                disabled
                className={inputClass}
              />
              <p className="mt-1 text-xs text-gray-400">Email cannot be changed.</p>
            </div>
            {!isGoogleUser && (
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingName}
                  className="bg-[#1a8efd] hover:bg-[#0077e6] disabled:opacity-60 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition"
                >
                  {savingName ? "Saving..." : "Save changes"}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Password</h2>
          {isGoogleUser ? (
            <div className="mt-4 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-blue-700">
                Your account uses Google Sign-In. Password cannot be set or changed for Google accounts.
              </p>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="flex flex-col gap-4 mt-4">
              <div>
                <label className={labelClass}>Current password</label>
                <div className="relative">
                  <input
                    required
                    type={showCurrentPw ? "text" : "password"}
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputClass} pr-10`}
                  />
                  <EyeBtn show={showCurrentPw} onToggle={() => setShowCurrentPw((v) => !v)} />
                </div>
              </div>
              <div>
                <label className={labelClass}>New password</label>
                <div className="relative">
                  <input
                    required
                    type={showNewPw ? "text" : "password"}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputClass} pr-10`}
                  />
                  <EyeBtn show={showNewPw} onToggle={() => setShowNewPw((v) => !v)} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Confirm new password</label>
                <input
                  required
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingPw}
                  className="bg-[#1a8efd] hover:bg-[#0077e6] disabled:opacity-60 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition"
                >
                  {savingPw ? "Updating..." : "Update password"}
                </button>
              </div>
            </form>
          )}
        </div>


      <ToastContainer position="top-center" autoClose={4000} hideProgressBar={false} closeOnClick theme="colored" />
    </div>
  );
}

export default Profile;
