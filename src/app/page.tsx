"use client";

import dynamic from "next/dynamic";

const Navbar = dynamic(() => import("@/components/landing/Navbar").then(m => ({ default: m.Navbar })), { ssr: false });
const LandingPage = dynamic(() => import("@/components/landing/LandingPage").then(m => ({ default: m.LandingPage })), { ssr: false });

export default function HomePage() {
  return (
    <>
      <Navbar />
      <LandingPage />
    </>
  );
}
