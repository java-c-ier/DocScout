import React from "react";

function StarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-yellow-400">
      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
  );
}

const testimonials = [
  {
    name: "Evan Stone",
    stars: 5,
    avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1480&q=80",
    text: "I recently moved to a new city, and this site made it incredibly easy to find the best hospitals near me. The search was fast, and the results were reliable, saving me a lot of time and stress!",
  },
  {
    name: "Tania Andrew",
    stars: 4,
    avatar: "https://images.unsplash.com/photo-1485178575877-1a13bf489dfe?q=80&w=2001&auto=format&fit=crop",
    text: "I've always struggled to find quality hospitals for specific needs, but this site made the process effortless. It quickly showed me highly-rated options based on my location. A real time-saver!",
  },
  {
    name: "Maya Lane",
    stars: 4,
    avatar: "https://images.unsplash.com/photo-1532170579297-281918c8ae72?q=80&w=1784&auto=format&fit=crop",
    text: "I was in urgent need of medical care and had no idea where to go. This website provided accurate, top-rated hospitals nearby, which helped me make a quick decision.",
  },
  {
    name: "Liam Ross",
    stars: 5,
    avatar: "https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=2070&auto=format&fit=crop",
    text: "I travel often for work, and this site has been a game-changer. It instantly shows me trusted hospitals nearby. Perfect for anyone needing quick and reliable healthcare options.",
  },
  {
    name: "Ava Brooks",
    stars: 4,
    avatar: "https://images.unsplash.com/photo-1699899662121-882a20f9bea6?q=80&w=2070&auto=format&fit=crop",
    text: "I love how this website doesn't just show nearby hospitals—it also gives detailed reviews and important info. It's my go-to platform for finding the right healthcare providers.",
  },
];

function TestimonialCard({ name, stars, avatar, text }) {
  return (
    <div className="bg-blue-500 text-white w-[25rem] flex-shrink-0 px-4 py-4 rounded-lg mx-4">
      <div className="flex items-center gap-4 pb-4">
        <img src={avatar} alt={name} className="w-14 h-14 rounded-full object-cover" style={{ width: '56px', height: '56px', flexShrink: 0 }} />
        <div className="flex w-full flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <h5 className="font-semibold text-lg">{name}</h5>
            <div className="flex items-center">
              {Array.from({ length: stars }).map((_, i) => <StarIcon key={i} />)}
            </div>
          </div>
        </div>
      </div>
      <p className="mb-6">&quot;{text}&quot;</p>
    </div>
  );
}

function Testimonial() {
  return (
    <div className="pb-10 pt-[55px]" id="testimonial">
      <div className="text-center">
        <h1 className="mb-10 text-3xl lg:text-5xl font-bold text-black">Testimonials</h1>
      </div>

      <div className="overflow-hidden w-full" style={{ maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}>
        <div
          className="flex"
          style={{
            animation: "marquee-scroll 30s linear infinite",
            width: "max-content",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = "paused")}
          onMouseLeave={(e) => (e.currentTarget.style.animationPlayState = "running")}
        >
          {/* Duplicate for seamless loop */}
          {[...testimonials, ...testimonials].map((t, i) => (
            <TestimonialCard key={i} {...t} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

export default Testimonial;
