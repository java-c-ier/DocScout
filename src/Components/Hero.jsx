import React, { useState } from "react";
import Doctor from "../assets/Doctor.png"
import "../Styles/Hero.css";
import { Input } from "@material-tailwind/react";
import { TbSearch } from "react-icons/tb";

function Hero() {

  return (
    <div className="section-container">
      <div className="hero-section">
        <div className="text-section">
          <p className="text-headline">❤️ Health comes first</p>
          <h2 className="text-title">Find your Doctor from your phone.</h2>
          <p className="text-descritpion">
            Talk to online doctors and get medical advice, online prescriptions,
            refills and medical notes within minutes. On-demand healthcare
            services at your fingertips.
          </p>
          <div className="search-area w-full flex">
            <div className="search-box w-[60%]">
              <Input
                icon={
                  <button>
                    <TbSearch className="black" />
                  </button>
                }
                label="Enter Location"
                className="bg-white text-[17px]"
                size="lg"
                labelProps={{ className: "text-lg" }}
                color="blue"
              />
            </div>
          </div>
          <div className="text-stats">
            <div className="text-stats-container">
              <p>145k+</p>
              <p>Receive Patients</p>
            </div>

            <div className="text-stats-container">
              <p>50+</p>
              <p>Expert Doctors</p>
            </div>

            <div className="text-stats-container">
              <p>10+</p>
              <p>Years of Experience</p>
            </div>
          </div>
        </div>

        <div className="hero-image-section">
          <img className="hero-image1" src={Doctor} alt="Doctor" />
        </div>
      </div>
    </div>
  );
}

export default Hero;
