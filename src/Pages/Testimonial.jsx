import React, { useState, useEffect } from "react";
import Marquee from "react-fast-marquee";

import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Avatar,
} from "@material-tailwind/react";

function StarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5 text-yellow-700"
    >
      <path
        fillRule="evenodd"
        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function Testimonial() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    // Cleanup event listener on unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isLargeScreen = windowWidth > 900;

  return (
    <div className="pb-10 pt-[70px]" id="testimonial">
      <Marquee
        pauseOnClick
        gradient={isLargeScreen}
        gradientWidth={80}
        className="flex gap-32"
        speed={60}
        autoFill
      >
        <div className="flex gap-32">
          <Card color="brown" className="w-full max-w-[25rem] px-4">
            <CardHeader
              color="transparent"
              floated={false}
              shadow={false}
              className="mx-0 flex items-center gap-4 pt-0 pb-8"
            >
              <Avatar
                size="lg"
                variant="circular"
                src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1480&q=80"
                alt="tania andrew"
              />
              <div className="flex w-full flex-col gap-0.5">
                <div className="flex items-center justify-between">
                  <Typography variant="h5" color="blue-gray">
                    Tania Andrew
                  </Typography>
                  <div className="5 flex items-center gap-0">
                    <StarIcon />
                    <StarIcon />
                    <StarIcon />
                    <StarIcon />
                    <StarIcon />
                  </div>
                </div>
                <Typography color="blue-gray">
                  Frontend Lead @ Google
                </Typography>
              </div>
            </CardHeader>
            <CardBody className="mb-6 p-0">
              <Typography>
                &quot;I found solution to all my design needs from Creative Tim.
                I use them as a freelancer in my hobby projects for fun! And its
                really affordable, very humble guys !!!&quot;
              </Typography>
            </CardBody>
          </Card>
          <Card color="green" className="w-full max-w-[25rem] px-4">
            <CardHeader
              color="transparent"
              floated={false}
              shadow={false}
              className="mx-0 flex items-center gap-4 pt-0 pb-8"
            >
              <Avatar
                size="lg"
                variant="circular"
                src="https://images.unsplash.com/photo-1485178575877-1a13bf489dfe?q=80&w=2001&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="tania andrew"
              />
              <div className="flex w-full flex-col gap-0.5">
                <div className="flex items-center justify-between">
                  <Typography variant="h5" color="blue-gray">
                    Tania Andrew
                  </Typography>
                  <div className="5 flex items-center gap-0">
                    <StarIcon />
                    <StarIcon />
                    <StarIcon />
                    <StarIcon />
                    <StarIcon />
                  </div>
                </div>
                <Typography color="blue-gray">
                  Frontend Lead @ Google
                </Typography>
              </div>
            </CardHeader>
            <CardBody className="mb-6 p-0">
              <Typography>
                &quot;Tailwind has streamlined my workflow! As a freelance
                designer, I love its utility-first approach. Super customizable,
                efficient, and perfect for quick projects!&quot;
              </Typography>
            </CardBody>
          </Card>
          <Card color="yellow" className="w-full max-w-[25rem] px-4">
            <CardHeader
              color="transparent"
              floated={false}
              shadow={false}
              className="mx-0 flex items-center gap-4 pt-0 pb-8"
            >
              <Avatar
                size="lg"
                variant="circular"
                src="https://images.unsplash.com/photo-1532170579297-281918c8ae72?q=80&w=1784&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              />
              <div className="flex w-full flex-col gap-0.5">
                <div className="flex items-center justify-between">
                  <Typography variant="h5" color="blue-gray">
                    Tania Andrew
                  </Typography>
                  <div className="5 flex items-center gap-0">
                    <StarIcon />
                    <StarIcon />
                    <StarIcon />
                    <StarIcon />
                    <StarIcon />
                  </div>
                </div>
                <Typography color="blue-gray">
                  Frontend Lead @ Google
                </Typography>
              </div>
            </CardHeader>
            <CardBody className="mb-6 p-0">
              <Typography>
                &quot;Figma is my go-to design tool! It’s intuitive,
                collaborative, and works seamlessly across devices. It’s made my
                freelance work much more efficient!&quot;
              </Typography>
            </CardBody>
          </Card>
          <Card color="red" className="w-full max-w-[25rem] px-4">
            <CardHeader
              color="transparent"
              floated={false}
              shadow={false}
              className="mx-0 flex items-center gap-4 pt-0 pb-8"
            >
              <Avatar
                size="lg"
                variant="circular"
                src="https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="tania andrew"
              />
              <div className="flex w-full flex-col gap-0.5">
                <div className="flex items-center justify-between">
                  <Typography variant="h5" color="blue-gray">
                    Tania Andrew
                  </Typography>
                  <div className="5 flex items-center gap-0">
                    <StarIcon />
                    <StarIcon />
                    <StarIcon />
                    <StarIcon />
                    <StarIcon />
                  </div>
                </div>
                <Typography color="blue-gray">
                  Frontend Lead @ Google
                </Typography>
              </div>
            </CardHeader>
            <CardBody className="mb-6 p-0">
              <Typography>
                &quot;CodeSandbox is amazing for quick prototyping. I use it for
                small side projects, and it’s fast, responsive, and easy to
                share with clients!&quot;
              </Typography>
            </CardBody>
          </Card>
          <Card color="blue" className="w-full max-w-[25rem] px-4">
            <CardHeader
              color="transparent"
              floated={false}
              shadow={false}
              className="mx-0 flex items-center gap-4 pt-0 pb-8"
            >
              <Avatar
                size="lg"
                variant="circular"
                src="https://images.unsplash.com/photo-1699899662121-882a20f9bea6?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="tania andrew"
              />
              <div className="flex w-full flex-col gap-0.5">
                <div className="flex items-center justify-between">
                  <Typography variant="h5" color="blue-gray">
                    Tania Andrew
                  </Typography>
                  <div className="5 flex items-center gap-0">
                    <StarIcon />
                    <StarIcon />
                    <StarIcon />
                    <StarIcon />
                    <StarIcon />
                  </div>
                </div>
                <Typography color="blue-gray">
                  Frontend Lead @ Google
                </Typography>
              </div>
            </CardHeader>
            <CardBody className="mb-6 p-0">
              <Typography>
                &quot;As a web designer, Webflow has revolutionized how I build
                websites. It's perfect for hobby projects, and their support
                team is awesome!&quot;
              </Typography>
            </CardBody>
          </Card>
        </div>
      </Marquee>
    </div>
  );
}

export default Testimonial;
