import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "../Pages/Home";
import SignIn from "../Pages/SignIn";
import SignUp from "../Pages/SignUp";
import Nav from "../Components/Nav";
import CSVUpload from "../Components/CSVUpload";
import CSVUploadDoctors from "../Components/CSVUploadDoctors";

function Routing() {
  return (
    <div>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<CSVUpload />} />
        <Route path="/uploadDoctors" element={<CSVUploadDoctors />} />  
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </div>
  );
}

export default Routing;
