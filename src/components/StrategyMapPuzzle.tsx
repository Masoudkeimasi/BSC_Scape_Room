"use client";
import { useEffect, useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  pointerWithin,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, ArrowUpRight, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { useLocalDraft } from "@/lib/use-local-draft";
import { isPuzzleOrder } from "@/lib/mission";
import type { Action } from "@/lib/types";
const fragmentDescriptions = [
  "Persepolis brand and Financial perspective label",
  "Vision heading and asset-profitability text fragment",
  "Vision statement and sustainable operating-profitability text fragment",
  "Vision statement ending and free-cash-flow text fragment",
  "Customer perspective label and market-share text fragment",
  "Priority-category market-share objective fragment",
  "Consumer trust, brand preference and transparent value fragment",
  "Convenient physical and digital product-access fragment",
  "Internal Process perspective label and manufacturing fragment",
  "Manufacturing productivity, safety and quality fragment",
  "Responsible product innovation and development-time fragment",
  "Operational greenhouse-gas emissions fragment",
  "Learning and Growth perspective label and capability fragment",
  "Organisational learning and external R&D collaboration fragment",
  "Digital and technological food-innovation capability fragment",
  "Accountability, ethics, sustainability and performance-management fragment",
];
function Piece({
  tile,
  index,
  image,
  selected,
  disabled,
  choose,
}: {
  tile: number;
  index: number;
  image: string;
  selected: boolean;
  disabled: boolean;
  choose: () => void;
}) {
  const drag = useDraggable({
    id: `piece-${index}`,
    data: { index },
    disabled,
  });
  const drop = useDroppable({ id: `slot-${index}`, data: { index }, disabled });
  const row = Math.floor(index / 4) + 1,
    col = (index % 4) + 1;
  return (
    <button
      ref={(el) => {
        drag.setNodeRef(el);
        drop.setNodeRef(el);
      }}
      {...drag.attributes}
      {...drag.listeners}
      type="button"
      data-testid={`puzzle-slot-${index}`}
      data-tile={tile}
      onClick={choose}
      aria-label={`${fragmentDescriptions[tile]}. Currently at row ${row}, column ${col}${selected ? ". Selected; choose another piece to swap." : ""}`}
      aria-pressed={selected}
      disabled={disabled}
      className={`puzzle-piece ${selected ? "selected" : ""} ${drop.isOver ? "over" : ""}`}
      style={{
        backgroundImage: `url("${image}")`,
        backgroundSize: "400% 400%",
        backgroundPosition: `${((tile % 4) / 3) * 100}% ${(Math.floor(tile / 4) / 3) * 100}%`,
        transform: CSS.Translate.toString(drag.transform),
        zIndex: drag.isDragging ? 10 : 1,
      }}
    >
      <span className="piece-grip" aria-hidden="true">
        <GripVertical size={14} />
      </span>
    </button>
  );
}
export function StrategyMapPuzzle({
  image,
  saved,
  done,
  busy,
  act,
  storageKey,
  preview = false,
}: {
  image: string | null;
  saved?: number[];
  done: boolean;
  busy: boolean;
  act: (a: Action) => Promise<boolean>;
  storageKey: string;
  preview?: boolean;
}) {
  const [draft, setDraft] = useLocalDraft<number[]>(storageKey, saved ?? []);
  const [selected, setSelected] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [aspect, setAspect] = useState("1672 / 941");
  const [notice, setNotice] = useState("");
  const [enlarged, setEnlarged] = useState(false);
  const order = done
    ? (saved ?? [])
    : isPuzzleOrder(draft)
      ? draft
      : (saved ?? []);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] },
    }),
  );
  useEffect(() => {
    if (!image) return;
    setLoaded(false);
    setImageError(false);
    const photo = new Image();
    photo.onload = () => {
      setAspect(`${photo.naturalWidth} / ${photo.naturalHeight}`);
      setLoaded(true);
    };
    photo.onerror = () => setImageError(true);
    photo.src = image;
    return () => {
      photo.onload = null;
      photo.onerror = null;
    };
  }, [image]);
  const swap = (a: number, b: number) => {
    if (done || busy || a === b) return;
    const next = [...order];
    [next[a], next[b]] = [next[b], next[a]];
    setDraft(next);
    setSelected(null);
    setNotice(
      `Swapped the pieces in row ${Math.floor(a / 4) + 1}, column ${(a % 4) + 1} and row ${Math.floor(b / 4) + 1}, column ${(b % 4) + 1}. Rearranging does not count as a mistake.`,
    );
  };
  const choose = (index: number) => {
    if (selected === null) {
      setSelected(index);
      setNotice(
        "Piece selected. Choose another piece to swap their positions.",
      );
    } else if (selected === index) {
      setSelected(null);
      setNotice("Selection cleared.");
    } else swap(selected, index);
  };
  const dragEnd = (e: DragEndEvent) => {
    const a = e.active.data.current?.index,
      b = e.over?.data.current?.index;
    if (typeof a === "number" && typeof b === "number") swap(a, b);
  };
  return (
    <section className="panel puzzle-panel">
      <div className="eyebrow gold">ROOM 06 / THE STRATEGY MAP VAULT</div>
      <h2>Sixteen pieces. One connected strategy.</h2>
      <p className="muted">
        Rearrange the 4 × 4 picture puzzle to reveal the complete Strategy Map.
        All pieces face the right way: swap their positions without rotating
        them. You do not need to draw any arrows or design the map.
      </p>
      {!image || imageError ? (
        <p role="alert">
          The Strategy Map image could not be loaded. Please refresh or contact
          your instructor.
        </p>
      ) : (
        <>
          {!saved && !done ? (
            <Button
              disabled={busy || !loaded}
              onClick={() => act({ type: "puzzle-start", room: 6 })}
            >
              Begin Strategy Map Puzzle
            </Button>
          ) : (
            <>
              {!loaded && <p role="status">Loading the Strategy Map image…</p>}
              {done ? (
                <>
                  <p className="confirmed">
                    <Check size={18} />{" "}
                    {preview
                      ? "Preview complete. Student progress has not changed."
                      : "Strategy Map reconstructed. The Knowledge Vault is now unlocked."}
                  </p>
                  <img
                    className="completed-strategy-map"
                    src={image}
                    alt="Completed Persepolis Strategy Map. Learning and Growth capabilities support Internal Processes, which support Customer outcomes and Financial results. Arrows show strategic hypotheses, not proven causal relationships."
                  />
                  <Button asChild variant="outline">
                    <a href={image} target="_blank" rel="noreferrer">
                      Open full-size Strategy Map <ArrowUpRight size={16} />
                    </a>
                  </Button>
                </>
              ) : (
                <>
                  <p className="puzzle-instructions">
                    Drag a piece onto another, or select two pieces to swap
                    them. Keyboard: use Tab and Enter for selection, or Space
                    and arrow keys to drag. Your arrangement is saved on this
                    browser.
                  </p>
                  <Button
                    variant="outline"
                    aria-pressed={enlarged}
                    onClick={() => setEnlarged(!enlarged)}
                  >
                    {enlarged
                      ? "Fit puzzle to screen"
                      : "Enlarge puzzle for reading"}
                  </Button>
                  <div
                    className="puzzle-viewport"
                    tabIndex={enlarged ? 0 : -1}
                    aria-label="Scrollable Strategy Map puzzle"
                  >
                    <DndContext
                      sensors={sensors}
                      collisionDetection={(args) => {
                        const filtered = {
                          ...args,
                          droppableContainers: args.droppableContainers.filter(
                            (c) =>
                              c.data.current?.index !==
                              args.active.data.current?.index,
                          ),
                        };
                        return args.pointerCoordinates
                          ? pointerWithin(filtered)
                          : closestCenter(args);
                      }}
                      onDragEnd={dragEnd}
                    >
                      <div
                        className="picture-puzzle"
                        style={{
                          aspectRatio: aspect,
                          minWidth: enlarged ? 800 : undefined,
                        }}
                        role="group"
                        aria-label="Strategy Map picture puzzle: four rows and four columns"
                      >
                        {order.map((tile, index) => (
                          <Piece
                            key={index}
                            tile={tile}
                            index={index}
                            image={image}
                            selected={selected === index}
                            disabled={busy || !loaded}
                            choose={() => choose(index)}
                          />
                        ))}
                      </div>
                    </DndContext>
                  </div>
                  <p role="status" className="selection-notice">
                    {notice ||
                      "Use the picture borders, text fragments and connecting arrows as clues."}
                  </p>
                  <div className="puzzle-actions">
                    <Button
                      disabled={busy || !loaded || !isPuzzleOrder(order)}
                      onClick={() =>
                        act({ type: "puzzle-submit", room: 6, order })
                      }
                    >
                      Check Strategy Map
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy || !saved}
                      onClick={() => {
                        setDraft([...saved!]);
                        setSelected(null);
                        setNotice(
                          "Returned to the last submitted arrangement.",
                        );
                      }}
                    >
                      <RotateCcw size={15} /> Restore arrangement
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
      <p className="data-note">
        The map presents cause-and-effect hypotheses across Financial, Customer,
        Internal Process, and Learning and Growth perspectives. No timer is
        used. The completed image remains available for review.
      </p>
    </section>
  );
}
