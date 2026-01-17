"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type RevealVariant =
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "zoom-in"
  | "rotate"
  | "stagger";

type RevealProps = {
  children: React.ReactNode;
  variant?: RevealVariant;
  delay?: number;
};

export default function Reveal({
  children,
  variant = "fade-up",
  delay = 0,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    let fromVars: gsap.TweenVars = { opacity: 0 };
    let toVars: gsap.TweenVars = {
      opacity: 1,
      duration: 1,
      delay,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ref.current,
        start: "top 85%",
        toggleActions: "play none none reverse",
      },
    };

    switch (variant) {
      case "fade-down":
        fromVars = { opacity: 0, y: -50 };
        toVars = { ...toVars, y: 0 };
        break;

      case "fade-left":
        fromVars = { opacity: 0, x: -80 };
        toVars = { ...toVars, x: 0 };
        break;

      case "fade-right":
        fromVars = { opacity: 0, x: 80 };
        toVars = { ...toVars, x: 0 };
        break;

      case "zoom-in":
        fromVars = { opacity: 0, scale: 0.85 };
        toVars = { ...toVars, scale: 1 };
        break;

      case "rotate":
        fromVars = { opacity: 0, y: 60, rotateX: 15 };
        toVars = { ...toVars, y: 0, rotateX: 0 };
        break;

      case "stagger":
        gsap.fromTo(
          ref.current.children,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.15,
            scrollTrigger: {
              trigger: ref.current,
              start: "top 85%",
            },
          }
        );
        return;

      default:
        fromVars = { opacity: 0, y: 100 };
        toVars = { ...toVars, y: 0 };
    }

    gsap.fromTo(ref.current, fromVars, toVars);
  }, [variant, delay]);

  return <div ref={ref}>{children}</div>;
}
