"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, RotateCcw } from "lucide-react";
import { Brand } from "./GameApp";
import { StrategyMapPuzzle } from "./StrategyMapPuzzle";
import { Button } from "./ui/button";
import { designCredit, pageThemes, themeStyle } from "@/lib/page-themes";
import { STRATEGY_MAP_IMAGE } from "@/lib/strategy-map-image";
import type { Action } from "@/lib/types";
export function InstructorPuzzlePreview() {
  const [order, setOrder] = useState<number[]>();
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const act = async (action: Action) => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/instructor/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: action.type, order: action.order }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setOrder(data.order);
      setDone(data.correct === true);
      setMessage(data.message);
      if (action.type === "puzzle-start") setAttempt(Date.now());
      return true;
    } catch (error) {
      setError((error as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };
  return (
    <div
      className="instructor-shell"
      data-page="instructor-preview"
      style={themeStyle(pageThemes["room-6"])}
    >
      <header>
        <Brand />
        <Link href="/instructor">
          <ArrowLeft size={16} /> Instructor workspace
        </Link>
      </header>
      <main>
        <div className="page-kicker">
          INSTRUCTOR PREVIEW / STRATEGY MAP VAULT
        </div>
        <h1 className="page-title">Test the puzzle directly.</h1>
        <p className="alert">
          Instructor preview only. This uses a separate test board: it does not
          change student progress, unlock mission rooms, award points or issue
          certificates.
        </p>
        {error && (
          <div role="alert" className="alert error">
            {error}
          </div>
        )}
        {message && (
          <div role="status" className="alert">
            {message}
          </div>
        )}
        <div className="puzzle-actions">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => act({ type: "puzzle-start" })}
          >
            <RotateCcw size={16} /> Shuffle and restart preview
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              act({
                type: "puzzle-submit",
                order: Array.from({ length: 16 }, (_, i) => i),
              })
            }
          >
            <Eye size={16} /> Reveal completed map (preview)
          </Button>
        </div>
        <StrategyMapPuzzle
          key={attempt}
          image={STRATEGY_MAP_IMAGE}
          saved={order}
          done={done}
          busy={busy}
          act={act}
          storageKey={`pf-instructor-preview-strategy-map:${attempt}`}
          preview
        />
        <p className="designer-credit footer-credit">{designCredit}</p>
      </main>
    </div>
  );
}
