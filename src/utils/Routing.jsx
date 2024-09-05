import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "../Pages/Home";
import About from "../Pages/About";
import Testimonial from "./../Pages/Testimonial";
import Contact from "./../Components/Contact";
import SignIn from "../Pages/SignIn";
import Nav from "../Components/Nav";

function Routing() {
  return (
    <div>
      <Nav></Nav>
      <Routes>
        <Route path="/" element={<Home />}></Route>
        <Route path="/about" element={<About />}></Route>
        <Route path="/testimonials" element={<Testimonial />}></Route>
        <Route path="/contact" element={<Contact />}></Route>
        <Route path="/signin" element={<SignIn />}></Route>
      </Routes>
    </div>
  );
}

export default Routing;
