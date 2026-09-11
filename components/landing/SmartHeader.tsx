"use client";

import { useEffect, useState } from "react";
import { Header } from "./Header";

export function SmartHeader() {
  const [overHero, setOverHero] = useState(true);

  useEffect(() => {
    function onScroll() {
      setOverHero(window.scrollY < window.innerHeight * 0.65);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return <Header variant={overHero ? "hero" : "light"} />;
}
