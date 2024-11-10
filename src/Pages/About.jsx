import React from "react";
import Doctor from "../assets/Doctors.png";
import "../Styles/About.css";
import SolutionStep from "../Components/SolutionStep";

function About() {
  return (
    <div className="about-section" id="about">
      <div className="about-image-content">
        <img src={Doctor} alt="Doctor Group" className="about-image1" />
      </div>

      <div className="about-text-content">
        <h3 className="about-title">
          <span>About Us</span>
        </h3>
        <p className="about-description">
          Welcome to DocScout, your trusted platform for finding top hospitals
          tailored to your location. Simply enter your location to access a
          curated list of hospitals and healthcare facilities nearby. Join us in building a
          community focused on accessible, reliable, and personalized healthcare
          for all.
        </p>

        <h4 className="about-text-title">Your Solutions</h4>

        <SolutionStep
          title="Choose a Hospital"
          description="Find top hospitals near you by entering the location with DocScout. Read reviews, choose with confidence, and prioritize your health."
        />

        <SolutionStep
          title="Get its location"
          description="Get the link to your hospital's location from Google Maps and get its route from your location when redirected to Google Maps."
        />

        {/* <SolutionStep
          title="Get Your Solutions"
          description="Our experienced doctors and specialists are here to provide expert advice and personalized treatment plans, helping you achieve your best possible health."
        /> */}
      </div>
    </div>
  );
}

export default About;
