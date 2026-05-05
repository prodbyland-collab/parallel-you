"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CinematicStoryScene } from "@/components/story/CinematicStoryScene";
import { ChoicePanel } from "@/components/story/ChoicePanel";
import { FirstPersonCut } from "@/components/story/FirstPersonCut";
import { FunLayer } from "@/components/story/FunLayer";
import { Letterbox } from "@/components/story/Letterbox";
import { SceneProgress } from "@/components/story/SceneProgress";
import { SubtitleNarration } from "@/components/story/SubtitleNarration";
import { generateEnding } from "@/lib/ending-generator";
import { chooseSceneOption, collectMemoryObject, completeMiniGame, getAllScenes, getScene, isEnding, triggerChaosEvent } from "@/lib/story-engine";
import { hasSimilarStorySignature, loadStoryState, saveEnding, saveStorySignature, saveStoryState } from "@/lib/story-storage";
import type { MemoryObject, StoryChoice, StoryRunState } from "@/lib/story-types";

export default function StoryPage() {
  const router = useRouter();
  const [state, setState] = useState<StoryRunState | null>(null);
  const [choicesVisible, setChoicesVisible] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const saved = loadStoryState();
    if (!saved) {
      router.replace("/start");
      return;
    }
    setState(saved);
  }, [router]);

  const scene = state ? getScene(state) : null;
  const allScenes = state ? getAllScenes(state) : [];
  const progressIndex = state ? Math.max(0, allScenes.findIndex((item) => item.id === state.currentSceneId)) : 0;

  const handleNarrationComplete = useCallback(() => {
    window.setTimeout(() => setChoicesVisible(true), 500);
  }, []);

  const wildcard = useMemo(() => state?.wildcardsUsed[state.wildcardsUsed.length - 1], [state]);
  const latestChaos = useMemo(() => state?.chaosEvents[state.chaosEvents.length - 1], [state]);

  const updateRunState = useCallback((next: StoryRunState) => {
    saveStoryState(next);
    setState(next);
  }, []);

  const useChaos = () => {
    if (!state || state.chaosUsed || transitioning) return;
    updateRunState(triggerChaosEvent(state));
  };

  const collectMemory = (memory: MemoryObject) => {
    if (!state || transitioning) return;
    updateRunState(collectMemoryObject(state, memory));
  };

  const markMiniGameComplete = (miniGameId: string) => {
    if (!state || transitioning) return;
    updateRunState(completeMiniGame(state, miniGameId));
  };

  const choose = useCallback((choice: StoryChoice) => {
    if (!state || transitioning) return;
    setChoicesVisible(false);
    setTransitioning(true);
    window.setTimeout(() => {
      const next = chooseSceneOption(state, choice);
      if (isEnding(next)) {
        const finalState = { ...next, replayCount: hasSimilarStorySignature(next.storySignature) ? next.replayCount + 1 : next.replayCount };
        const ending = generateEnding(finalState);
        saveStoryState(finalState);
        saveEnding(ending);
        saveStorySignature(ending.signature);
        router.push("/ending");
        return;
      }
      updateRunState(next);
      setTransitioning(false);
    }, 900);
  }, [router, state, transitioning, updateRunState]);

  useEffect(() => {
    if (!scene || !state || transitioning || !choicesVisible) return;
    const autoChoice = scene.choices.find((choice) => choice.auto);
    if (!autoChoice) return;
    const timer = window.setTimeout(() => choose(autoChoice), 1300);
    return () => window.clearTimeout(timer);
  }, [choose, choicesVisible, scene, state, transitioning]);

  if (!state || !scene) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#03040a] text-slate-200">
        Loading your story...
      </main>
    );
  }

  return (
    <main className="relative h-screen overflow-hidden bg-[#03040a]">
      <CinematicStoryScene scene={scene} traits={state.traits} />
      <FirstPersonCut cut={scene.firstPersonCut} visible={transitioning} />
      <div className={`absolute inset-0 z-20 bg-black transition-opacity duration-700 ${transitioning ? "opacity-80" : "pointer-events-none opacity-0"}`} />
      <Letterbox />

      <section className="pointer-events-none relative z-30 flex h-screen flex-col justify-between px-4 py-8 sm:px-8">
        <header className="pointer-events-auto mx-auto flex w-full max-w-7xl items-start justify-between gap-4 pt-10">
          <div>
            <SceneProgress scene={scene} index={progressIndex} total={allScenes.length} />
            <h1 className="cinema-title mt-3 max-w-4xl text-4xl font-black leading-[0.92] text-white md:text-7xl">{scene.title}</h1>
            <p className="mt-3 text-sm font-bold uppercase tracking-[0.2em] text-slate-400">{scene.year} / Age {state.profile.age + Math.max(0, scene.year - 2026)}</p>
          </div>
          <div className="hidden rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-300 backdrop-blur-xl sm:block">
            CHOOSE YOUR NEXT STEP
          </div>
        </header>

        <div className="pointer-events-auto mx-auto grid w-full max-w-7xl gap-4 pb-12 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            {wildcard && state.choices.length > 5 && (
              <div className="event-pop mb-3 max-w-2xl rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-100 backdrop-blur-xl">
                <b>{wildcard.title}</b>: {wildcard.narration}
              </div>
            )}
            <SubtitleNarration key={scene.id} text={scene.narration} onComplete={handleNarrationComplete} />
          </div>
          <div className="grid gap-3">
            <FunLayer
              memory={scene.memoryObject}
              memories={state.memories}
              chaosUsed={state.chaosUsed}
              latestChaos={latestChaos}
              relationship={scene.relationshipMoment}
              moodShift={scene.moodShift?.line}
              movieMomentTitle={scene.movieMoment?.title}
              miniGame={scene.miniGame}
              sceneId={scene.id}
              choicesVisible={choicesVisible && !transitioning}
              onChaos={useChaos}
              onCollectMemory={collectMemory}
              onMiniGameComplete={markMiniGameComplete}
            />
            <ChoicePanel choices={scene.choices} visible={choicesVisible && !transitioning} onChoose={choose} />
          </div>
        </div>
      </section>
    </main>
  );
}
