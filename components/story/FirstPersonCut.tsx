"use client";

import type { FirstPersonCut as FirstPersonCutType } from "@/lib/story-types";

export function FirstPersonCut({ cut, visible }: { cut?: FirstPersonCutType; visible: boolean }) {
  if (!cut) return null;

  return (
    <div className={`first-person-cut first-person-${cut.kind} ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}>
      <div className="first-person-frame">
        <span className="first-person-screen" />
        <span className="first-person-phone" />
        <span className="first-person-rain" />
        <p>{cut.title}</p>
        <small>{cut.detail}</small>
      </div>
    </div>
  );
}
