"use client";
import { useState } from "react";
import { useLocalDraft } from "@/lib/use-local-draft";
import {
  DndContext,
  pointerWithin,
  rectIntersection,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  GripVertical,
  LockKeyhole,
  Plus,
  X,
  Calculator,
  ArrowRight,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Action,
  RoomState,
  components,
  Component,
  perspectives,
} from "@/lib/types";
import type { PublicContent } from "./GameApp";
type Card = PublicContent["options"][number];
const labels = { O: "Objective", M: "Measure", T: "Target", I: "Initiative" };
function DraggableCard({
  card,
  used,
  inRow,
  disabled,
  select,
}: {
  card: Card;
  used: number;
  inRow: boolean;
  disabled: boolean;
  select: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: card.id,
      disabled: disabled || !!used,
      data: { component: card.component },
    });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
      }}
      className={`option-card ${used ? "used" : ""} ${inRow ? "in-row" : ""}`}
    >
      <button
        type="button"
        className="drag-handle"
        disabled={disabled || !!used}
        aria-label={`Drag ${card.text}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
      <button
        className="option-select"
        disabled={disabled || !!used}
        onClick={select}
      >
        <span>{card.text}</span>
        <small>
          {used
            ? `USED IN ROW ${used}`
            : inRow
              ? "IN ACTIVE ROW · CLICK TO REPLACE"
              : card.calculationId
                ? "BASELINE CALCULATION REQUIRED"
                : "CLICK TO SELECT OR DRAG"}
        </small>
      </button>
      {used ? <LockKeyhole size={13} /> : <Plus size={14} />}
    </div>
  );
}
function DropZone({
  type,
  id,
  card,
  readOnly,
  remove,
}: {
  type: Component;
  id: string;
  card?: Card;
  readOnly: boolean;
  remove: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    disabled: readOnly,
    data: { component: type },
  });
  return (
    <div
      ref={setNodeRef}
      className={`drop-zone ${isOver ? "over" : ""} ${readOnly ? "secured" : ""}`}
    >
      <div className="drop-label">
        {labels[type]} {readOnly && <LockKeyhole size={12} />}
      </div>
      {card ? (
        <>
          <p>{card.text}</p>
          {!readOnly && (
            <button
              className="remove-card"
              aria-label={`Remove ${labels[type]}`}
              onClick={remove}
            >
              <X size={13} />
            </button>
          )}
        </>
      ) : (
        <span className="drop-placeholder">
          <Plus size={20} /> Drop {labels[type].toLowerCase()} here
          <br />
          <small>or choose from the bank below</small>
        </span>
      )}
    </div>
  );
}
export function StrategyBoard({
  storageKey,
  room,
  state,
  content,
  done,
  busy,
  act,
}: {
  storageKey: string;
  room: number;
  state: RoomState;
  content: PublicContent;
  done: boolean;
  busy: boolean;
  act: (a: Action) => Promise<boolean>;
}) {
  const [active, setActive] = useLocalDraft<Record<string, string>>(
    storageKey,
    {},
  );
  const [tab, setTab] = useState<Component>("O");
  const [values, setValues] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );
  const cards = content.options.filter(
    (o) => o.perspective === perspectives[room - 2],
  );
  const used = state.rows.flat();
  const place = (id: string, type: Component) => {
    const card = cards.find((c) => c.id === id);
    if (done || busy || !card || card.component !== type || used.includes(id)) {
      setNotice(
        "Each slot accepts its own component type. Used cards stay locked.",
      );
      return;
    }
    setActive((a) => ({ ...a, [type]: id }));
    setNotice(
      `${labels[type]} selected. This edit does not count as a mistake.`,
    );
  };
  const onDragEnd = (e: DragEndEvent) => {
    if (e.over) place(String(e.active.id), e.over.data.current?.component);
  };
  const rows = [
    ...state.rows,
    ...(!done && state.rows.length < 3
      ? [components.map((t) => active[t] || "")]
      : []),
  ];
  const activeTarget = cards.find((c) => c.id === active.T);
  const calc = content.calculations.find(
    (c) => c.id === activeTarget?.calculationId,
  );
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={(args) => {
        const hits = pointerWithin(args);
        return hits.length ? hits : rectIntersection(args);
      }}
      onDragEnd={onDragEnd}
    >
      <section className="strategy-workspace">
        <div className="section-heading">
          <div>
            <div className="eyebrow gold">
              RECONSTRUCT THE BALANCED SCORECARD
            </div>
            <h2>Build a chain. Unlock the next.</h2>
          </div>
          <span className="chain-progress">
            {state.rows.length}
            <span> / 3 CHAINS SECURED</span>
          </span>
        </div>
        <p className="muted">
          Align one objective, measure, target and initiative. Complete the
          three chains in any order.
        </p>
        <div className="strategy-rows">
          {rows.map((row, i) => (
            <div
              className={`strategy-row ${i < state.rows.length ? "locked-row" : "active-row"}`}
              key={i}
            >
              <div className="row-title">
                <span>
                  {i < state.rows.length ? (
                    <LockKeyhole size={13} />
                  ) : (
                    <span className="pulse" />
                  )}{" "}
                  STRATEGIC CHAIN 0{i + 1}
                </span>
                <span>
                  {i < state.rows.length ? "SECURED · READ ONLY" : "ACTIVE ROW"}
                </span>
              </div>
              <div className="drop-grid">
                {components.map((t, j) => (
                  <DropZone
                    key={t}
                    type={t}
                    id={`${i}-${t}`}
                    card={cards.find((c) => c.id === row[j])}
                    readOnly={i < state.rows.length || done || busy}
                    remove={() => setActive((a) => ({ ...a, [t]: "" }))}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        {calc && !done && (
          <div className="calculation panel">
            <div className="eyebrow gold">
              <Calculator size={15} /> LINKED CALCULATION / {calc.title}
            </div>
            <p className="formula">{calc.formula}</p>
            <div className="calc-inputs">
              {Object.entries(calc.inputs).map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value.toLocaleString("en-GB")}</strong>
                </div>
              ))}
            </div>
            <p className="data-note">
              {calc.id !== "C-baseline"
                ? "Figures from the supplied fictional annual review or revised instructor matrix."
                : "Supplementary instructor-key exercise. These inputs are separate from the review’s 2025 financial statements."}
            </p>
            {calc.id in state.calculations ? (
              <p className="confirmed">
                <Check size={16} /> Confirmed: {state.calculations[calc.id]}{" "}
                {calc.unit}
              </p>
            ) : (
              <div className="inline-form">
                <label>
                  Your result ({calc.unit})
                  <input
                    type="number"
                    step="any"
                    value={values[calc.id] ?? ""}
                    onChange={(e) =>
                      setValues({ ...values, [calc.id]: e.target.value })
                    }
                  />
                </label>
                <Button
                  variant="outline"
                  disabled={busy || !values[calc.id]?.trim()}
                  onClick={() =>
                    act({
                      type: "calculate",
                      room,
                      calculationId: calc.id,
                      value: Number(values[calc.id]),
                    })
                  }
                >
                  Check Answer
                </Button>
              </div>
            )}
          </div>
        )}
        {!done && state.rows.length < 3 && (
          <div className="validate-bar">
            <span>
              Only a submitted, complete chain can count as a mistake.
            </span>
            <Button
              disabled={busy || components.some((t) => !active[t])}
              onClick={async () => {
                const count = state.rows.length;
                if (
                  await act({
                    type: "chain",
                    room,
                    ids: components.map((t) => active[t]),
                  })
                ) {
                  setNotice(
                    "Submission evaluated. Check the room feedback above.",
                  ); // server state determines locking
                  if (count < 3) setActive({});
                }
              }}
            >
              VALIDATE STRATEGIC CHAIN <ArrowRight size={16} />
            </Button>
          </div>
        )}
        {!done && state.rows.length < 3 && (
          <section className="option-bank panel">
            <div className="section-heading">
              <div>
                <div className="eyebrow gold">YOUR EVIDENCE BANK</div>
                <h3>Choose with purpose.</h3>
              </div>
              <span className="muted">8 options per component</span>
            </div>
            <div role="tablist" aria-label="Option banks" className="bank-tabs">
              {components.map((t) => (
                <button
                  role="tab"
                  aria-selected={tab === t}
                  aria-controls={`bank-${t}`}
                  id={`tab-${t}`}
                  key={t}
                  onClick={() => setTab(t)}
                  className={tab === t ? "active" : ""}
                >
                  {labels[t]}s <span>08</span>
                </button>
              ))}
            </div>
            <p role="status" className="selection-notice">
              {notice ||
                "Drag by the grip, or click a card to place it in the matching slot. Keyboard drag: Space to lift, arrows to move, Space to drop."}
            </p>
            <div
              role="tabpanel"
              id={`bank-${tab}`}
              aria-labelledby={`tab-${tab}`}
              className="option-grid"
            >
              {cards
                .filter((c) => c.component === tab)
                .map((card) => (
                  <DraggableCard
                    key={card.id}
                    card={card}
                    disabled={busy}
                    used={
                      used.includes(card.id)
                        ? state.rows.findIndex((r) => r.includes(card.id)) + 1
                        : 0
                    }
                    inRow={Object.values(active).includes(card.id)}
                    select={() => place(card.id, card.component)}
                  />
                ))}
            </div>
          </section>
        )}
      </section>
    </DndContext>
  );
}
