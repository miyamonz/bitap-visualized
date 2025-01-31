import { atom, useAtom, useAtomValue } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { useEffect, useState } from "react";
import { Asearch, toBitArray } from "./asearch";
import { HighlightText } from "./HighlightText";

function App() {
  const [query] = useAtom(queryAtom);
  const [ambiguity] = useAtom(ambiguityAtom);

  const gridSize = "150px";
  return (
    <div>
      <h1>asearchの視覚化</h1>
      <Query />
      <Ambiguity />
      <Target />

      <Step />
      <Result />
      <State />
      <div
        style={{
          display: "grid",
          placeContent: "center",
          placeItems: "center",

          gridTemplateAreas: `
          ${Array.from({ length: ambiguity + 1 })

            .map((_, y) => {
              return Array.from({ length: query.length + 1 })
                .map((_, x) => `c${x}-${y}`)
                .join(" ");
            })
            .map((x) => `"${x}"`)
            .toReversed()
            .join(" ")}
          `,
          gridTemplateColumns: `repeat(${query.length + 1}, ${gridSize})`,
          gridTemplateRows: `repeat(${ambiguity + 1}, ${gridSize})`,
          gap: 10,
        }}
      >
        {productFromLen(query.length + 1, ambiguity + 1).map(([x, y]) => (
          <div
            key={`${x}-${y}`}
            style={{
              gridArea: `c${x}-${y}`,
            }}
          >
            <Cell x={x} y={y} />
          </div>
        ))}
        {/* draw arrow */}
        <Arrows />
      </div>
    </div>
  );
}
function Cell({ x, y }: { x: number; y: number }) {
  const result = useAtomValue(resultAtom);

  return (
    <div
      data-x={x}
      data-y={y}
      style={{
        width: 30,
        height: 30,
        border: "solid 1px",
        borderRadius: "100%",
        background: result.bits[y][x] ? "pink" : "white",
      }}
    >
      {`${x}-${y}`}
    </div>
  );
}

const queryRawAtom = atomWithStorage("query", "");
const queryAtom = atom((get) => get(queryRawAtom).replaceAll(" ", ""));
const queryLengthAtom = atom((get) => get(queryAtom).length);
function Query() {
  const [query, setQuery] = useAtom(queryRawAtom);
  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      query
    </div>
  );
}
const ambiguityAtom = atomWithStorage("ambiguity", 0);
function Ambiguity() {
  const [ambiguity, setAmbiguity] = useAtom(ambiguityAtom);
  return (
    <div>
      <input
        type="number"
        value={ambiguity}
        onChange={(e) => setAmbiguity(Number(e.target.value))}
      />
      ambiguity
    </div>
  );
}

const initStateAtom = atom((get) => {
  const ambig = get(ambiguityAtom);
  return Array.from({ length: ambig + 1 }, () => 0);
});

const actions = [{}];

function State() {
  // const [state, setState] = useAtom(stateAtom);
  return (
    <div>
      {[].map((n, i) => (
        <div key={i}>
          {i}:{" "}
          {toBitArray(n)
            .map((b) => (b ? "1" : "0"))
            .join("")}
        </div>
      ))}
    </div>
  );
}

const targetAtom = atomWithStorage("target", "");
function Target() {
  const [target, setTarget] = useAtom(targetAtom);
  const query = useAtomValue(queryRawAtom);
  return (
    <div>
      <input
        type="text"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
      />
      target
      <HighlightText query={query}>{target}</HighlightText>
    </div>
  );
}

const resultAtom = atom((get) => {
  const query = get(queryAtom);
  const ambiguity = get(ambiguityAtom);
  const target = get(targetAtom);
  const match = Asearch(query);
  return match(target, ambiguity);
});
function Result() {
  const result = useAtomValue(resultAtom);
  return (
    <div>
      <div>result: {result.matched ? "matched" : "not matched"}</div>
      <div>
        {result.bits.map((bits, i) => (
          <div key={i}>
            {i}: {bits.map((b) => (b ? "1" : "0")).join("")}
          </div>
        ))}
      </div>
    </div>
  );
}

const stepAtom = atom(0);
function Step() {
  const [step, setStep] = useAtom(stepAtom);
  return (
    <div>
      <button onClick={() => setStep(step - 1)}>←</button>
      {step}
      <button onClick={() => setStep(step + 1)}>→</button>
    </div>
  );
}

function Arrows() {
  const query = useAtomValue(queryAtom);
  const ambiguity = useAtomValue(ambiguityAtom);
  return (
    <div>
      {/* 右 */}
      {productFromLen(query.length, ambiguity + 1).map(([x, y]) => {
        return (
          <div
            data-arrow={`${x}-${y}`}
            key={`${x}-${y}`}
            style={{ overflow: "visible" }}
          >
            <Arrow from={{ x, y }} to={{ x: x + 1, y }}>
              {query[x]}
            </Arrow>
          </div>
        );
      })}
      {/* ななめ */}
      {productFromLen(query.length, ambiguity).map(([x, y]) => {
        return (
          <div
            data-arrow={`${x}-${y}`}
            key={`${x}-${y}`}
            style={{ overflow: "visible" }}
          >
            <Arrow from={{ x, y }} to={{ x: x + 1, y: y + 1 }}>
              ε *
            </Arrow>
          </div>
        );
      })}
      {/* 上 */}
      {productFromLen(query.length + 1, ambiguity).map(([x, y]) => {
        return (
          <div
            data-arrow={`${x}-${y}`}
            key={`${x}-${y}`}
            style={{ overflow: "visible" }}
          >
            <Arrow from={{ x, y }} to={{ x: x, y: y + 1 }}>
              *
            </Arrow>
          </div>
        );
      })}
    </div>
  );
}

type Pos = { x: number; y: number };
function Arrow({
  from,
  to,
  children,
}: {
  from: Pos;
  to: Pos;
  children: React.ReactNode;
}) {
  const length = useAtomValue(queryLengthAtom);
  const ambiguity = useAtomValue(ambiguityAtom);
  const [leftPos, setLeftPos] = useState({ x: 0, y: 0 });
  const [rightPos, setRightPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const node = getNode(from);
    const nextNode = getNode(to);

    if (!node || !nextNode) return;
    const nodeRect = node.getBoundingClientRect();
    const nextNodeRect = nextNode.getBoundingClientRect();
    setLeftPos({
      x: nodeRect.left + nodeRect.width / 2 + window.scrollX,
      y: nodeRect.top + nodeRect.height / 2 + window.scrollY,
    });
    setRightPos({
      x: nextNodeRect.left + nextNodeRect.width / 2 + window.scrollX,
      y: nextNodeRect.top + nextNodeRect.height / 2 + window.scrollY,
    });
  }, [length, ambiguity]);
  if (leftPos.x == 0 && leftPos.y == 0 && rightPos.x == 0 && rightPos.y == 0)
    return null;

  const o = 16;
  const offsetW = o;
  const offsetH = o;

  const vec = { x: rightPos.x - leftPos.x, y: rightPos.y - leftPos.y };
  const left = Math.min(leftPos.x, rightPos.x);
  const top = Math.min(leftPos.y, rightPos.y);
  const w = Math.abs(vec.x);
  const h = Math.abs(vec.y);
  const center = {
    x: (leftPos.x + rightPos.x) / 2,
    y: (leftPos.y + rightPos.y) / 2,
  };
  const t = 0.2;
  return (
    <svg
      style={{
        // outline: "1px solid",
        pointerEvents: "none",
        position: "absolute",
        left: left - offsetW,
        top: top - offsetH,
      }}
      width={w + offsetW * 2}
      height={h + offsetH * 2}
      viewBox={`${left - offsetW} ${top - offsetH} ${w + offsetW * 2} ${
        h + offsetH * 2
      }`}
    >
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
      </defs>
      {/* <circle cx={leftPos.x} cy={leftPos.y} r="10" fill="red" />
      <circle cx={rightPos.x} cy={rightPos.y} r="10" fill="green" /> */}
      <line
        x1={leftPos.x + vec.x * t}
        y1={leftPos.y + vec.y * t}
        x2={leftPos.x + vec.x * (1 - t)}
        y2={leftPos.y + vec.y * (1 - t)}
        stroke="black"
        strokeWidth="2"
        markerEnd="url(#arrow)"
      />
      <circle cx={center.x} cy={center.y} r="20" fill="white" />
      <text
        x={center.x}
        y={center.y}
        dominantBaseline="middle"
        textAnchor="middle"
      >
        {children}
      </text>
    </svg>
  );
}

function getNode({ x, y }: { x: number; y: number }) {
  return document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
}

export default App;

function productFromLen(n: number, m: number) {
  const result = [];
  for (let j = 0; j < m; j++) {
    for (let i = 0; i < n; i++) {
      result.push([i, j]);
    }
  }
  return result;
}
