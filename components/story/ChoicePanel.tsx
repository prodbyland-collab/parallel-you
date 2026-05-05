"use client";

import type { StoryChoice } from "@/lib/story-types";

export function ChoicePanel({ choices, visible, onChoose }: { choices: StoryChoice[]; visible: boolean; onChoose: (choice: StoryChoice) => void }) {
  const visibleChoices = choices.filter((choice) => !choice.auto);
  return (
    <div className={`grid gap-3 transition-all duration-500 ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}>
      {visibleChoices.map((choice, index) => (
        <button
          key={choice.id}
          onClick={() => onChoose(choice)}
          className="story-choice group text-left"
          style={{ transitionDelay: `${index * 90}ms` }}
        >
          <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Option {index + 1}</span>
          <span className="mt-1 block text-lg font-black text-white">{choice.text}</span>
        </button>
      ))}
    </div>
  );
}
