"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";

const introLines = [
  "This is not a game.",
  "This is a version of your life.",
  "Pay attention to the small choices."
];

export default function Home() {
  const [lineIndex, setLineIndex] = useState(0);
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    if (lineIndex >= introLines.length - 1) {
      const finalTimer = window.setTimeout(() => setIntroDone(true), 1800);
      return () => window.clearTimeout(finalTimer);
    }
    const timer = window.setTimeout(() => setLineIndex((current) => current + 1), 1800);
    return () => window.clearTimeout(timer);
  }, [lineIndex]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <section className={`opening-black ${introDone ? "opacity-0" : "opacity-100"}`}>
        <p key={lineIndex} className="opening-line">{introLines[lineIndex]}</p>
      </section>

      <section className={`relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-5 py-20 transition-opacity duration-1000 sm:px-8 ${introDone ? "opacity-100" : "opacity-0"}`}>
        <div className="ambient-dust" />
        <p className="cinema-kicker">Direct Your Life</p>
        <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.92] text-white sm:text-7xl">
          A short interactive life experience.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          Write a few real things about yourself. Then move through small moments that remember what you said and what you chose.
        </p>
        <Link href="/start" className="mt-8 inline-flex w-fit items-center justify-center gap-3 rounded-full bg-white px-7 py-4 text-base font-black text-void transition hover:bg-slate-200">
          <Play size={19} fill="currentColor" /> Begin
        </Link>
      </section>
    </main>
  );
}
