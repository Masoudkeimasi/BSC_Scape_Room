"use client";
import { useState, useCallback } from "react";
import { useLocalDraft } from "@/lib/use-local-draft";
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "./ui/button";
import { Action, RoomState } from "@/lib/types";
import { PublicContent } from "./GameApp";
const tiers = [
  ["L", "Learning & Growth"],
  ["P", "Internal Process"],
  ["C", "Customer"],
  ["F", "Financial"],
];
export function StrategyMapBuilder({
  storageKey,
  content,
  saved,
  done,
  busy,
  act,
}: {
  storageKey: string;
  content: PublicContent;
  saved?: RoomState["map"];
  done: boolean;
  busy: boolean;
  act: (a: Action) => Promise<boolean>;
}) {
  const [placements, setPlacements] = useLocalDraft<Record<string, string>>(
    storageKey + ":placements",
    saved?.placements ?? {},
  );
  const [explanation, setExplanation] = useLocalDraft(
    storageKey + ":explanation",
    saved?.explanation ?? "",
  );
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [nodes, setNodes] = useLocalDraft<Node[]>(
    storageKey + ":nodes",
    content.objectives.map((o, i) => ({
      id: o.id,
      position: { x: (i % 3) * 300, y: Math.floor(i / 3) * 140 },
      data: { label: o.text },
      style: {
        width: 260,
        background: "#132c38",
        color: "#edf2ed",
        border: "1px solid #53776e",
        fontSize: 12,
        padding: 12,
      },
      sourcePosition: "top" as Node["sourcePosition"],
      targetPosition: "bottom" as Node["targetPosition"],
    })),
  );
  const [edges, setEdges] = useLocalDraft<Edge[]>(
    storageKey + ":edges",
    (saved?.links ?? []).map((l) => ({
      id: l,
      source: l.split(">")[0],
      target: l.split(">")[1],
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: "#6fc6a8" },
    })),
  );
  const connect = useCallback(
    (c: Connection) => {
      if (done) return;
      setEdges((es) =>
        addEdge(
          {
            ...c,
            id: `${c.source}>${c.target}`,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: "#6fc6a8" },
          },
          es,
        ),
      );
    },
    [done],
  );
  const place = (id: string, p: string) => {
    setPlacements((a) => ({ ...a, [id]: p }));
    const tier = tiers.findIndex((t) => t[0] === p);
    setNodes((a) =>
      a.map((n) =>
        n.id === id
          ? {
              ...n,
              position: {
                x: (a.findIndex((n) => n.id === id) % 3) * 300,
                y: (3 - tier) * 160,
              },
            }
          : n,
      ),
    );
  };
  return (
    <section className="panel map-panel">
      <div className="eyebrow gold">THE FINAL CONNECTION / STRATEGY MAP</div>
      <h2>Connect the whole picture.</h2>
      <p className="muted">
        Classify all twelve objectives, then connect Learning & Growth →
        Internal Process → Customer → Financial. Cover every objective with at
        least nine defensible links. Multiple connections are possible. Arrows
        represent strategic hypotheses, not proven effects.
      </p>
      <div className="map-classifications">
        {content.objectives.map((o) => (
          <label key={o.id}>
            <span>{o.text}</span>
            <select
              disabled={done}
              aria-label={`Perspective for ${o.text}`}
              value={placements[o.id] ?? ""}
              onChange={(e) => place(o.id, e.target.value)}
            >
              <option value="">Choose perspective</option>
              {tiers.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <div
        className="map-canvas"
        aria-label="Interactive twelve-objective strategy map"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={(changes: NodeChange[]) => {
            if (!done) setNodes((ns) => applyNodeChanges(changes, ns));
          }}
          onEdgesChange={(changes: EdgeChange[]) => {
            if (!done) setEdges((es) => applyEdgeChanges(changes, es));
          }}
          onConnect={connect}
          nodesDraggable={!done}
          nodesConnectable={!done}
          elementsSelectable={!done}
          fitView
          colorMode="dark"
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
      <p className="data-note">
        Drag nodes to arrange them. Connect handles, or use the accessible
        connection controls below. The same controls provide a text alternative
        to the diagram.
      </p>
      {!done && (
        <div className="map-link-controls">
          <label>
            From objective
            <select
              aria-label="From objective"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              <option value="">Choose source</option>
              {content.objectives.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.text}
                </option>
              ))}
            </select>
          </label>
          <label>
            To objective
            <select
              aria-label="To objective"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="">Choose destination</option>
              {content.objectives.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.text}
                </option>
              ))}
            </select>
          </label>
          <Button
            variant="outline"
            disabled={!source || !target || source === target}
            onClick={() =>
              connect({
                source,
                target,
                sourceHandle: null,
                targetHandle: null,
              })
            }
          >
            Add causal link
          </Button>
        </div>
      )}
      <ul className="link-list">
        {edges.map((e) => (
          <li key={e.id}>
            {content.objectives.find((o) => o.id === e.source)?.text} →{" "}
            {content.objectives.find((o) => o.id === e.target)?.text}
            {!done && (
              <button
                onClick={() =>
                  setEdges((es) => es.filter((x) => x.id !== e.id))
                }
                aria-label={`Remove link from ${e.source} to ${e.target}`}
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
      <label>
        Explain one causal hypothesis (at least 12 words)
        <textarea
          disabled={done}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Describe how a capability could improve a process, and what evidence would test that relationship…"
        />
      </label>
      {!done && (
        <Button
          disabled={busy}
          onClick={() =>
            act({
              type: "map",
              room: 5,
              placements,
              links: edges.map((e) => `${e.source}>${e.target}`),
              explanation,
            })
          }
        >
          Validate Strategy Map
        </Button>
      )}
    </section>
  );
}
