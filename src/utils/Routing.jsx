import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "../Pages/Home";
import About from "../Pages/About";
import Testimonial from "../Pages/Testimonial";
import Contact from "../Components/Contact";
import SignIn from "../Pages/SignIn";
import SignUp from "../Pages/SignUp";
import Nav from "../Components/Nav";
import CSVUpload from '../Components/CSVUpload';

function Routing() {
  return (
    <div>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/testimonials" element={<Testimonial />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/upload" element={<CSVUpload />} />
      </Routes>
    </div>
  );
}

export default Routing;
