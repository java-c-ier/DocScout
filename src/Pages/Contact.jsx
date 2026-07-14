import React, { useRef, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import customer from "../assets/customer.png";

const inputClass =
  "w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";
const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

export function Contact() {
  const formRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const data = new FormData(formRef.current);
    try {
      const res = await fetch("/.netlify/functions/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.get("first-name"),
          lastName: data.get("last-name"),
          email: data.get("email"),
          phone: data.get("phone"),
          message: data.get("message"),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Message sent successfully.");
      e.target.reset();
    } catch {
      toast.error("Error! Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-16 md:py-24" id="contact">
      <div className="mx-auto max-w-7xl px-4 md:px-8">

        {/* Header */}
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <span className="text-sm font-semibold text-[#1a8efd] md:text-base tracking-wide uppercase">
            Contact us
          </span>
          <h2 className="mt-3 text-3xl font-bold text-gray-900 md:text-5xl" style={{ fontFamily: "Poppins, sans-serif" }}>
            Get in touch
          </h2>
          <p className="mt-4 text-lg text-gray-500 md:mt-6 md:text-xl" style={{ fontFamily: "Rubik, sans-serif" }}>
            We'd love to hear from you. Please fill out this form.
          </p>
        </div>

        {/* Image + Form */}
        <div className="mx-auto mt-12 md:mt-16 grid grid-cols-1 lg:grid-cols-[5fr_4fr] gap-24 items-center">
          <img
            src={customer}
            alt="Contact"
            className="w-full max-h-[860px] object-contain rounded-xl hidden lg:block"
            loading="lazy"
            decoding="async"
          />

          <form
            ref={formRef}
            onSubmit={onSubmit}
            className="flex flex-col gap-5"
          >
            {/* First + Last name */}
            <div className="flex flex-col gap-5 sm:flex-row">
              <div className="flex-1">
                <label className={labelClass}>First name <span className="text-red-500">*</span></label>
                <input required name="first-name" type="text" placeholder="First name" className={inputClass} />
              </div>
              <div className="flex-1">
                <label className={labelClass}>Last name <span className="text-red-500">*</span></label>
                <input required name="last-name" type="text" placeholder="Last name" className={inputClass} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className={labelClass}>Email <span className="text-red-500">*</span></label>
              <input required name="email" type="email" placeholder="you@company.com" className={inputClass} />
            </div>

            {/* Phone */}
            <div>
              <label className={labelClass}>Phone number</label>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition bg-white">
                <span className="flex items-center px-3 py-3 text-sm text-gray-700 bg-gray-50 border-r border-gray-300 whitespace-nowrap">
                  🇮🇳 +91
                </span>
                <input
                  type="tel"
                  name="phone"
                  placeholder="00000 00000"
                  className="flex-1 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className={labelClass}>Message <span className="text-red-500">*</span></label>
              <textarea
                required
                name="message"
                placeholder="Leave us a message..."
                rows={5}
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#1a8efd] hover:bg-blue-600 disabled:opacity-60 text-white py-3.5 rounded-lg text-base font-semibold transition"
              style={{ fontFamily: "Rubik, sans-serif" }}
            >
              {submitting ? "Sending..." : "Send message"}
            </button>
          </form>
        </div>
      </div>

    </section>
  );
}

export default Contact;
