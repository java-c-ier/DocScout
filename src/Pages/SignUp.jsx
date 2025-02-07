import React, { useState } from "react";
import { Typography, Input, Button } from "@material-tailwind/react";
import { EyeSlashIcon, EyeIcon } from "@heroicons/react/24/solid";
import { NavLink, useNavigate } from "react-router";
import { app } from "../Firebase";
import {
  getAuth,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordShown, setPasswordShown] = useState(false);

  const navigate = useNavigate();

  const togglePasswordVisibility = () => setPasswordShown((cur) => !cur);

  const createUser = (event) => {
    event.preventDefault();

    if (password.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }
    createUserWithEmailAndPassword(auth, email, password)
      .then((value) => {
        navigate("/");
      })
      .catch((error) => {
        alert("Error creating user: " + error.message);
      });
  };

  const signUpWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/");
    } catch (error) {
      console.error("Google sign-in error:", error);
    }
  };

  return (
    <section className="grid text-center items-center p-4 pt-[85px]">
      <div>
        <Typography variant="h3" color="blue" className="mb-2">
          Sign Up
        </Typography>
        <Typography className="mb-10 text-gray-900 font-semibold text-[18px]">
          Create your account
        </Typography>
        <form onSubmit={createUser} className="mx-auto max-w-[24rem] text-left">
          <div className="mb-6">
            <label htmlFor="full-name">
              <Typography
                variant="h6"
                className="mb-2 block font-semibold text-gray-900"
              >
                Full Name
              </Typography>
            </label>
            <Input
              required
              id="full-name"
              color="gray"
              size="lg"
              type="text"
              name="fullName"
              placeholder="Full Name"
              className="w-full placeholder:opacity-100 focus:border-t-primary border-t-blue-gray-200"
              labelProps={{
                className: "hidden",
              }}
            />
          </div>
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
              id="email"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              required
              color="gray"
              size="lg"
              type="email"
              name="email"
              placeholder="Email"
              className="w-full placeholder:opacity-100 focus:border-t-primary border-t-blue-gray-200"
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
              required
              size="lg"
              placeholder="Password"
              labelProps={{
                className: "hidden",
              }}
              className="w-full placeholder:opacity-100 focus:border-t-primary border-t-blue-gray-200"
              type={passwordShown ? "text" : "password"}
              icon={
                <i onClick={togglePasswordVisibility}>
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
            className="mt-2"
            fullWidth
          >
            Sign Up
          </Button>
          <Button
            onClick={signUpWithGoogle}
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
            sign up with google
          </Button>
          <Typography
            variant="small"
            color="gray"
            className="mt-4 text-center font-normal text-gray-900"
          >
            Already have an account?{" "}
            <NavLink className="font-medium text-blue-700" to="/signin">
              Sign in
            </NavLink>
          </Typography>
        </form>
      </div>
    </section>
  );
}

export default SignUp;
