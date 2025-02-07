import React, { useState } from "react";
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { app } from './../Firebase';

import { Typography, Input, Button } from "@material-tailwind/react";
import { EyeSlashIcon, EyeIcon } from "@heroicons/react/24/solid";
import { NavLink, useNavigate } from "react-router";

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordShown, setPasswordShown] = useState(false);

  const navigate = useNavigate();

  const togglePasswordVisiblity = () => setPasswordShown((cur) => !cur);

  const signInUser = (event) => {
    event.preventDefault();

    if (password.length < 6) {
      alert("Password must be at least 6 characters long");
      return; 
    }

    signInWithEmailAndPassword(auth, email, password)
      .then((value) => {
        navigate("/");
      })
      .catch((error) => {
        alert("Error logging user: " + error.message);
      });
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      navigate("/");
    } catch (error) {
      console.error("Google Sign-In Error:", error);
    }
  };

  return (
    <section className="grid text-center items-center p-6 pt-[85px]">
      <div>
        <Typography variant="h3" color="blue" className="mb-2">
          Sign In
        </Typography>
        <Typography className="mb-10 text-gray-900 font-semibold text-[18px]">
          Enter your credentials
        </Typography>
        <form onSubmit={signInUser} className="mx-auto max-w-[24rem] text-left">
          <div className="mb-6">
            <label htmlFor="email">
              <Typography
                variant="h6"
                className="mb-2 block font-semibold text-gray-900"
              >
                Email
              </Typography>
            </label>
            <Input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              id="email"
              color="black"
              size="lg"
              type="email"
              name="email"
              placeholder="Email"
              className="w-full placeholder:opacity-100 focus:border-black border-t-gray-900"
              labelProps={{
                className: "hidden",
              }}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password">
              <Typography
                variant="h6"
                className="mb-2 block font-semibold text-gray-900"
              >
                Password
              </Typography>
            </label>
            <Input
              onChange={(p) => setPassword(p.target.value)}
              value={password}
              color="black"
              size="lg"
              placeholder="Password"
              labelProps={{
                className: "hidden",
              }}
              className="w-full placeholder:opacity-100 focus:border-black border-t-gray-900"
              type={passwordShown ? "text" : "password"}
              icon={
                <i onClick={togglePasswordVisiblity}>
                  {passwordShown ? (
                    <EyeIcon className="h-5 w-5" />
                  ) : (
                    <EyeSlashIcon className="h-5 w-5" />
                  )}
                </i>
              }
            />
          </div>
          <Button
            type="submit"
            color="blue"
            size="lg"
            className="mt-8"
            fullWidth
          >
            sign in
          </Button>
          <div className="!mt-4 flex justify-end">
            <Typography
              as="a"
              href="#"
              color="blue-gray"
              variant="small"
              className="font-medium"
            >
              Forgot password
            </Typography>
          </div>
          <Button
            onClick={signInWithGoogle} // Trigger Google Sign-In
            variant="outlined"
            size="lg"
            className="mt-6 flex h-12 items-center justify-center gap-2"
            fullWidth
          >
            <img
              src={`https://www.material-tailwind.com/logos/logo-google.png`}
              alt="google"
              className="h-6 w-6"
            />{" "}
            sign in with google
          </Button>
          <Typography
            variant="small"
            color="gray"
            className="mt-4 text-center font-normal text-gray-900"
          >
            Not registered?{" "}
            <NavLink
              href="#"
              className="font-medium text-blue-700"
              to="/signup"
            >
              Create a new account
            </NavLink>
          </Typography>
        </form>
      </div>
    </section>
  );
}

export default SignIn;
