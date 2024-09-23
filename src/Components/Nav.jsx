import React, { useState, useEffect } from "react";
import {
  Navbar,
  MobileNav,
  Typography,
  Button,
  IconButton,
} from "@material-tailwind/react";
import { NavLink } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth"; // Import Firebase auth methods
import "../Styles/Nav.css";

export function Nav() {
  const [openNav, setOpenNav] = useState(false);
  const [user, setUser] = useState(null); // State to hold user info

  const auth = getAuth();

  useEffect(() => {
    // Listener for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user); // Set user info when logged in
      } else {
        setUser(null); // Set user as null when logged out
      }
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, [auth]);

  const handleSignOut = () => {
    signOut(auth).then(() => {
      setUser(null); // Reset user state after signing out
    });
  };

  useEffect(() => {
    window.addEventListener(
      "resize",
      () => window.innerWidth >= 800 && setOpenNav(false)
    );
  }, []);

  const getFirstName = (displayName) => {
    if (displayName) {
      return displayName.split(" ")[0]; // Get the first part of the name
    }
    return "User"; // Default to "User" if no display name is available
  };

  const navList = (
    <ul className="mt-2 mb-4 flex flex-col gap-2 lg:mb-0 lg:mt-0 lg:flex-row lg:items-center lg:gap-6">
      <Typography as="li" color="blue-gray" className="p-1 font-normal">
        <NavLink className="hover-links flex items-center" to="/">
          Home
        </NavLink>
      </Typography>
      <Typography as="li" color="blue-gray" className="p-1 font-normal">
        <NavLink href="#" className="hover-links flex items-center" to="/about">
          About
        </NavLink>
      </Typography>
      <Typography as="li" color="blue-gray" className="p-1 font-normal">
        <NavLink
          href="#"
          className="hover-links flex items-center"
          to="/testimonials"
        >
          Testimonials
        </NavLink>
      </Typography>
      <Typography as="li" color="blue-gray" className="p-1 font-normal">
        <NavLink
          href="#"
          className="hover-links flex items-center"
          to="/contact"
        >
          Contact
        </NavLink>
      </Typography>
    </ul>
  );

  return (
    <div className="max-h-[768px] w-[calc(100%)]">
      <Navbar className="sticky top-0 z-10 h-max max-w-full rounded-lg px-4 py-2 lg:px-12 lg:py-4">
        <div className="flex justify-between items-center text-blue-500">
          <Typography className="mr-16 cursor-pointer py-1.5 lg:font-bold font-black text-xl">
            HealthCare Finder
          </Typography>
          <div className="mr-15 hidden lg:block">{navList}</div>
          <div className="flex items-center gap-x-4">
            {/* Conditionally render based on whether user is logged in */}
            {user ? (
              <div className="flex items-center gap-2">
                <Typography className="font-semibold text-blue-700 mr-4">
                Welcome, {getFirstName(user.displayName)}
                </Typography>
                <Button
                  variant="filled"
                  size="sm"
                  color="red"
                  className="sign-out hidden lg:inline-block"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <NavLink to="/signin">
                <Button
                  variant="filled"
                  size="sm"
                  color="blue"
                  className="sign-in hidden lg:inline-block hover:bg-white"
                >
                  Sign In
                </Button>
              </NavLink>
            )}
          </div>
          <IconButton
            variant="text"
            className="ml-auto h-6 w-6 text-inherit hover:bg-transparent focus:bg-transparent active:bg-transparent lg:hidden"
            ripple={false}
            onClick={() => setOpenNav(!openNav)}
          >
            {openNav ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                className="h-6 w-6"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </IconButton>
        </div>
        <MobileNav open={openNav}>
          {navList}
          <div className="flex items-center justify-center gap-x-4">
            {/* Conditionally render mobile sign-in or welcome message */}
            {user ? (
              <Button
                fullWidth
                variant="gradient"
                size="lg"
                color="red"
                className="sign-out-mobile flex items-center justify-center h-10"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            ) : (
              <NavLink to="/signin" className="w-full">
                <Button
                  fullWidth
                  variant="gradient"
                  size="lg"
                  color="blue"
                  className="sign-in-mobile flex items-center justify-center h-10"
                >
                  Sign In
                </Button>
              </NavLink>
            )}
          </div>
        </MobileNav>
      </Navbar>
    </div>
  );
}

export default Nav;
