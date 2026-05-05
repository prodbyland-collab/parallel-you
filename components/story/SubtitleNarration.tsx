"use client";

import { useEffect, useState } from "react";

export function SubtitleNarration({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [visibleText, setVisibleText] = useState("");

  useEffect(() => {
    setVisibleText("");
    let index = 0;
    const interval = window.setInterval(() => {
      index += 2;
      setVisibleText(text.slice(0, index));
      if (index >= text.length) {
        window.clearInterval(interval);
        window.setTimeout(() => onComplete?.(), 260);
      }
    }, 24);
    return () => window.clearInterval(interval);
  }, [onComplete, text]);

  return (
    <p className="cinema-subtitle min-h-[5rem] rounded-3xl border border-white/10 bg-black/55 px-5 py-4 text-base leading-7 text-slate-100 shadow-glow backdrop-blur-xl md:text-lg">
      {visibleText}
      <span className="ml-1 inline-block h-5 w-2 translate-y-1 animate-pulse bg-cyan-200" />
    </p>
  );
}
