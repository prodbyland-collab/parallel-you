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
import { generateAdaptiveEnding } from "@/lib/ai-ending-generator";
import { generateAdaptiveScene } from "@/lib/ai-scene-generator";
import { directNextStep, type DirectorDecision } from "@/lib/ai-story-director";
import { generateConsequenceWithAI } from "@/lib/ai-writer";
import { getEndingHistory, isEndingTooSimilar, regenerateEndingVariant, saveEndingHistory } from "@/lib/ending-history";
import { applyGeneratedConsequence, collectMemoryObject, completeMiniGame, getAllScenes, getScene, triggerChaosEvent } from "@/lib/story-engine";
import { createStoryMemory } from "@/lib/story-memory";
import { processChoice } from "@/lib/process-choice";
import { toStoryState } from "@/lib/story-state";
import { getStoryTextHistory, hasSimilarStorySignature, loadStoryState, saveEnding, saveStorySignature, saveStoryState, saveStoryTextHistory } from "@/lib/story-storage";
import type { MemoryObject, StoryChoice, StoryRunState, StoryScene } from "@/lib/story-types";

const HARD_SCENE_TIMEOUT_MS = 24000;

function withTimeout<T>(promise: Promise<T>, fallback: T, ms = HARD_SCENE_TIMEOUT_MS): Promise<T> {
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => resolve(fallback), ms);
    promise.then((value) => resolve(value)).catch(() => resolve(fallback)).finally(() => window.clearTimeout(timeout));
  });
}

export default function StoryPage() {
  const router = useRouter();
  const [state, setState] = useState<StoryRunState | null>(null);
  const [generatedScene, setGeneratedScene] = useState<StoryScene | null>(null);
  const [consequenceLines, setConsequenceLines] = useState<string[]>([]);
  const [directorDecision, setDirectorDecision] = useState<DirectorDecision | null>(null);
  const [sceneLoading, setSceneLoading] = useState(false);
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

  const baseScene = useMemo(() => state ? getScene(state) : null, [state]);
  const scene = generatedScene ?? (sceneLoading ? null : baseScene);
  const allScenes = useMemo(() => state ? getAllScenes(state) : [], [state]);
  const progressIndex = state ? Math.max(0, allScenes.findIndex((item) => item.id === state.currentSceneId)) : 0;

  useEffect(() => {
    if (!state || !baseScene) return;
    let cancelled = false;
    setGeneratedScene(null);
    setConsequenceLines([]);
    setChoicesVisible(false);
    setTransitioning(false);
    setSceneLoading(true);

    const adaptiveState = toStoryState(state, getStoryTextHistory());
    const loadScene = async () => {
      const decisionFallback: DirectorDecision = {
        action: "continue_story",
        reason: "Fallback scene direction.",
        nextScenePurpose: "Continue from the last choice with a grounded real-life moment.",
        emotionalTarget: "quiet",
        shouldUseFirstPersonCut: false,
        shouldUseNoChoiceMoment: false,
        shouldIntroduceRelationshipMoment: false,
        endingReadinessScore: adaptiveState.endingReadinessScore,
        avoid: adaptiveState.avoid
      };
      const decision = await withTimeout(directNextStep(adaptiveState), decisionFallback);
      if (cancelled) return;
      setDirectorDecision(decision);
      const nextScene = await withTimeout(generateAdaptiveScene(adaptiveState, decision), baseScene);
      if (cancelled) return;
      setGeneratedScene(nextScene);
      saveStoryTextHistory([nextScene.title, nextScene.narration, ...nextScene.choices.map((choice) => choice.text)]);
      setSceneLoading(false);
    };

    loadScene().catch((error) => {
      console.error("Scene loading failed", error);
      if (cancelled) return;
      setGeneratedScene(baseScene);
      setSceneLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [baseScene?.id, state?.storySignature]);

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
    if (!state || !scene || transitioning) return;
    setChoicesVisible(false);
    setTransitioning(true);
    window.setTimeout(async () => {
      try {
        const memory = createStoryMemory(state, scene, allScenes, getEndingHistory(), choice, getStoryTextHistory());
        const fallbackConsequence = {
          consequenceLines: choice.consequenceHint ? [choice.consequenceHint] : ["You choose it.", "The room changes a little."],
          updatedMood: scene.mood,
          memoryCallback: choice.consequenceHint,
          delayedFlag: choice.flags?.[0]
        };
        const consequence = await withTimeout(generateConsequenceWithAI(choice, memory), fallbackConsequence);
        setConsequenceLines(consequence.consequenceLines);
        saveStoryTextHistory([choice.text, ...consequence.consequenceLines]);
        const processed = processChoice(choice, state, scene);
        const next = applyGeneratedConsequence(processed, consequence.consequenceLines, consequence.delayedFlag);
        const adaptiveState = toStoryState(next, getStoryTextHistory());
        const decisionFallback: DirectorDecision = {
          action: adaptiveState.endingReadinessScore >= 88 || next.sceneHistory.length >= 25 ? "move_to_ending" : "continue_story",
          reason: "Fallback after choice.",
          nextScenePurpose: "Continue from the user's last choice.",
          emotionalTarget: "quiet",
          shouldUseFirstPersonCut: false,
          shouldUseNoChoiceMoment: false,
          shouldIntroduceRelationshipMoment: false,
          endingReadinessScore: adaptiveState.endingReadinessScore,
          avoid: adaptiveState.avoid
        };
        const decision = await withTimeout(directNextStep(adaptiveState), decisionFallback);
        const shouldEnd = decision.action === "move_to_ending" || decision.endingReadinessScore >= 88 || next.sceneHistory.length >= 25;
        if (shouldEnd) {
          const finalState = { ...next, replayCount: hasSimilarStorySignature(next.storySignature) ? next.replayCount + 1 : next.replayCount };
          const history = getEndingHistory();
          const draftEnding = await generateAdaptiveEnding(toStoryState(finalState, getStoryTextHistory()), finalState, history);
          const ending = isEndingTooSimilar(draftEnding, history) ? regenerateEndingVariant(draftEnding, finalState.profile, finalState) : draftEnding;
          saveStoryState(finalState);
          saveEnding(ending);
          saveEndingHistory(ending);
          saveStoryTextHistory([ending.title, ending.identity, ending.reflection, ending.finalLine]);
          saveStorySignature(ending.signature);
          router.push("/ending");
          return;
        }
        setDirectorDecision(decision);
        updateRunState(next);
      } catch (error) {
        console.error("Choice processing failed", error);
      } finally {
        setTransitioning(false);
      }
    }, 900);
  }, [allScenes, router, scene, state, transitioning, updateRunState]);

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
        {sceneLoading ? "Writing the next scene..." : "Loading your story..."}
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
            {consequenceLines.length > 0 && (
              <div className="event-pop mb-3 max-w-2xl rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3 text-sm leading-6 text-slate-100 backdrop-blur-xl">
                {consequenceLines.map((line) => <span key={line} className="block">{line}</span>)}
              </div>
            )}
            {directorDecision?.reason && (
              <div className="sr-only" aria-live="polite">
                Next scene direction: {directorDecision.reason}
              </div>
            )}
            <SubtitleNarration key={`${scene.id}-${scene.title}-${scene.narration}`} text={scene.narration} onComplete={handleNarrationComplete} />
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
