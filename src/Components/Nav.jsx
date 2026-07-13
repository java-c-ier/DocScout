import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../Firebase";
import "../Styles/Nav.css";

export function Nav() {
  const [openNav, setOpenNav] = useState(false);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const navRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = location.pathname === "/signin" || location.pathname === "/signup";
  const isProfilePage = location.pathname === "/profile";

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await user.reload();
        setUser({ ...user });
      } else {
        setUser(null);
      }
      setAuthReady(true);
    });

    const handleProfileUpdated = () => {
      if (auth.currentUser) setUser({ ...auth.currentUser });
    };
    window.addEventListener("profileUpdated", handleProfileUpdated);
    return () => {
      unsubscribe();
      window.removeEventListener("profileUpdated", handleProfileUpdated);
    };
  }, []);

  const handleSignOut = () => {
    if (!auth) return;
    document.body.style.transition = "opacity 0.25s ease";
    document.body.style.opacity = "0";
    setTimeout(() => {
      signOut(auth).then(() => {
        setUser(null);
        setOpenNav(false);
        navigate("/");
        setTimeout(() => {
          document.body.style.opacity = "1";
        }, 50);
      });
    }, 250);
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setOpenNav(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 800) setOpenNav(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const closeNav = () => setOpenNav(false);

  const getOffset = () => (window.innerWidth > 900 ? 40 : 50);

  const handleScroll = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (!element) return;
    const offset = getOffset();
    const elementPosition = element.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: elementPosition, behavior: "smooth" });
    closeNav();
  };

  const navLinks = (
    <ul className="mt-2 mb-4 flex flex-col gap-2 lg:mb-0 lg:mt-0 lg:flex-row lg:items-center lg:gap-6">
      {[
        { label: "Home", id: "home" },
        { label: "About", id: "about" },
        { label: "Testimonials", id: "testimonial" },
        { label: "Contact", id: "contact" },
      ].map(({ label, id }) => (
        <li key={id} className="p-1 font-normal text-blue-gray-700">
          <a
            className="hover-links flex items-center"
            href={`#${id}`}
            onClick={(e) => handleScroll(e, id)}
          >
            {label}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="w-full" ref={navRef}>
      <nav className="fixed top-0 left-0 right-0 z-10 bg-white shadow-sm px-4 py-2 lg:px-12 lg:py-3 rounded-lg">
        <div className="flex justify-between items-center text-blue-500">
          <span className="mr-16 cursor-pointer py-1.5 lg:font-bold font-black text-[135%]">
            DocScout
          </span>
          {!isProfilePage && <div className="mr-20 hidden lg:block">{navLinks}</div>}
          <div className="flex items-center gap-x-4">
            {!authReady ? null : user ? (
              <div className="relative hidden lg:block" ref={profileDropdownRef}>
                <button
                  onClick={() => setProfileDropdown((v) => !v)}
                  className="flex items-center gap-2 focus:outline-none"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-400" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-blue-400">
                      {(user.displayName || user.email?.split("@")[0] || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                  )}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className={`absolute right-0 mt-3 w-68 bg-white rounded-xl shadow-xl border border-gray-200 z-50 transition-all duration-200 origin-top-right overflow-hidden ${profileDropdown ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`} style={{ width: "272px" }}>
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt="avatar" className="w-10 h-10 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#1a8efd] flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {(user.displayName || user.email?.split("@")[0] || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-base font-bold text-gray-900 truncate">{user.displayName || user.email?.split("@")[0] || "User"}</p>
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                          <span className={`inline-flex items-center gap-1 mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${user.providerData?.[0]?.providerId === "google.com" ? "bg-blue-50 text-blue-600 border border-blue-600" : "bg-gray-100 text-gray-600 border border-gray-400"}`}>
                            {user.providerData?.[0]?.providerId === "google.com" ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-3 w-3 shrink-0">
                                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" />
                                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.7-3.4-11.3-8l-6.5 5C9.8 39.7 16.4 44 24 44z" />
                                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.8l6.2 5.2C41.4 36 44 30.4 44 24c0-1.2-.1-2.4-.4-3.5z" />
                                </svg>
                                Google Account
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Email &amp; Password
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="py-1">
                      <button
                        onClick={() => { setProfileDropdown(false); navigate("/profile"); }}
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-base text-gray-700 hover:bg-gray-50 transition"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                        </svg>
                        My Profile
                      </button>
                      <div className="mx-4 border-t border-gray-100 my-1" />
                      <button
                        onClick={() => { setProfileDropdown(false); handleSignOut(); }}
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-base text-red-500 hover:bg-red-50 transition"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
              </div>
            ) : !isAuthPage ? (
              <NavLink to="/signin">
                <button className="sign-in hidden lg:inline-flex items-center bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-md hover:bg-white hover:text-blue-500 hover:border hover:border-blue-500 border border-transparent transition-all duration-200">
                  Sign In
                </button>
              </NavLink>
            ) : null}
          </div>
          <button
            className={`ml-auto h-6 w-6 text-gray-700 lg:hidden ${isProfilePage ? "hidden" : ""}`}
            onClick={() => setOpenNav(!openNav)}
          >
            {openNav ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" className="h-6 w-6" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile nav */}
        <div
          className="lg:hidden overflow-hidden transition-all duration-300 ease-in-out"
          style={{ display: "grid", gridTemplateRows: openNav ? "1fr" : "0fr" }}
        >
        <div style={{ minHeight: 0 }}>
          {navLinks}
          <div className="flex items-center justify-center gap-x-4 pb-2">
            {user ? (
              <div className="flex flex-col gap-2 w-full">
                <NavLink to="/profile" className="w-full" onClick={closeNav}>
                  <button className="w-full bg-blue-50 text-blue-600 border border-blue-200 py-2 rounded flex items-center justify-center h-10 font-medium text-sm">
                    My Profile
                  </button>
                </NavLink>
                <button
                  className="sign-out-mobile w-full bg-red-500 text-white py-2 rounded flex items-center justify-center h-10"
                  onClick={handleSignOut}
                >
                  Sign Out
                </button>
              </div>
            ) : !isAuthPage ? (
              <NavLink to="/signin" className="w-full">
                <button
                  className="sign-in-mobile w-full bg-blue-500 text-white py-2 rounded flex items-center justify-center h-10"
                  onClick={closeNav}
                >
                  Sign In
                </button>
              </NavLink>
            ) : null}
          </div>
        </div>
        </div>
      </nav>
    </div>
  );
}

export default Nav;
