"use client";
import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { Content } from "@/lib/types";
export function Review({ pages }: { pages: Content["review"] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const filtered = pages
    .map((p, index) => ({ ...p, index }))
    .filter((p) =>
      (p.title + " " + p.body + " " + JSON.stringify(p.table))
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
  const selected = filtered.find((p) => p.index === page) ?? filtered[0];
  return (
    <>
      <div className="page-kicker">THE EVIDENCE ROOM / SOURCE DOCUMENT</div>
      <h1 className="page-title">The annual review.</h1>
      <p className="muted">
        Persepolis Foods Group · 2025 performance & 2026 planning outlook
      </p>
      <div className="alert">
        Supplied fictional teaching case. All figures are invented educational
        data. See the reconciliation supplement for calculation assumptions and
        source inconsistencies.
      </div>
      <label className="search">
        <Search size={18} />
        <input
          placeholder="Search strategy, figures or KPI definitions…"
          aria-label="Search annual review"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="review-layout">
        <nav className="review-nav" aria-label="Annual review sections">
          {filtered.map((p) => (
            <button
              key={p.index}
              className={selected?.index === p.index ? "active" : ""}
              onClick={() => setPage(p.index)}
            >
              <FileText size={15} />
              {p.title}
            </button>
          ))}
        </nav>
        <article className="document panel">
          {selected ? (
            <>
              <div className="eyebrow gold">
                ANNUAL REVIEW / SECTION {selected.index + 1} OF {pages.length}
              </div>
              <h2>{selected.title}</h2>
              <div className="document-text">
                {selected.body
                  .split("\n\n")
                  .filter(Boolean)
                  .map((t, i) => (
                    <p key={i}>{t}</p>
                  ))}
              </div>
              {selected.table && (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        {selected.table[0].map((t, i) => (
                          <th key={i}>{t}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selected.table.slice(1).map((row, i) => (
                        <tr key={i}>
                          {row.map((t, j) => (
                            <td key={j}>{t}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="document-pagination">
                <Button
                  variant="outline"
                  disabled={filtered.indexOf(selected) === 0}
                  onClick={() =>
                    setPage(filtered[filtered.indexOf(selected) - 1].index)
                  }
                >
                  <ChevronLeft size={15} /> Previous
                </Button>
                <span>
                  {filtered.indexOf(selected) + 1} / {filtered.length}
                </span>
                <Button
                  variant="outline"
                  disabled={filtered.indexOf(selected) === filtered.length - 1}
                  onClick={() =>
                    setPage(filtered[filtered.indexOf(selected) + 1].index)
                  }
                >
                  Next <ChevronRight size={15} />
                </Button>
              </div>
            </>
          ) : (
            <p role="status">No matching evidence. Try another search.</p>
          )}
        </article>
      </div>
    </>
  );
}
