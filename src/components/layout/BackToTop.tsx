"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-sky-500/90 text-white shadow-2xl shadow-sky-500/20 backdrop-blur-md transition-colors hover:bg-sky-400 sm:bottom-8 sm:right-8"
      aria-label="Voltar ao início da página"
    >
      <ChevronUp className="h-6 w-6" aria-hidden="true" />
    </button>
  );
}
