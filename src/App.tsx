import { atom, useAtom, useAtomValue } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { useEffect, useState } from "react";
import { Asearch } from "./asearch";

function App() {
  const [query] = useAtom(queryAtom);
  const [ambiguity] = useAtom(ambiguityAtom);

  const gridSize = "150px";
  return (
    <>
      <h1>asearchの視覚化</h1>
      <Query />
      <Ambiguity />
      <Target />
      <Step />
      <Result />
      <div
        style={{
          display: "grid",
          placeContent: "center",
          placeItems: "center",

          // gridTemplateAreas: `
          // ${Array.from({ length: ambiguity + 1 })
          //   .map((_, y) => ambiguity - y)
          //   .map((y) => {
          //     return Array.from({ length: query.length + 1 })
          //       .map((_, x) => `c${x}-${y}`)
          //       .join(" ");
          //   })
          //   .map((x) => `"${x}"`)
          //   .join(" ")}
          // `,
          gridTemplateColumns: `repeat(${query.length + 1}, ${gridSize})`,
          gridTemplateRows: `repeat(${ambiguity + 1}, ${gridSize})`,
          gap: 10,
        }}
      >
        {productFromLen(query.length + 1, ambiguity + 1).map(([x, y]) => (
          <div
            key={`${x}-${y}`}
            style={
              {
                // gridArea: `c${x}-${y}`,
                // gridArea: `header`,
                // background: "lightgray",
              }
            }
          >
            <Cell x={x} y={y} />
          </div>
        ))}
        {/* draw arrow */}
        <Arrows />
      </div>
    </>
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
        background: result.bits[y][x] ? "yellow" : "white",
      }}
    >
      {`${x}-${y}`}
    </div>
  );
}

const queryAtom = atomWithStorage("query", "");
const queryLengthAtom = atom((get) => get(queryAtom).length);
function Query() {
  const [query, setQuery] = useAtom(queryAtom);
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

const targetAtom = atomWithStorage("target", "");
function Target() {
  const [target, setTarget] = useAtom(targetAtom);
  return (
    <div>
      <input
        type="text"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
      />
      target
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
      {productFromLen(query.length, ambiguity + 1).map(([x, y]) => {
        return (
          <div
            data-arrow={`${x}-${y}`}
            key={`${x}-${y}`}
            style={{ overflow: "visible" }}
          >
            {/* 右 */}
            <Arrow from={{ x, y }} to={{ x: x + 1, y }}>
              {query[x]}
            </Arrow>
          </div>
        );
      })}
      {productFromLen(query.length, ambiguity).map(([x, y]) => {
        return (
          <div
            data-arrow={`${x}-${y}`}
            key={`${x}-${y}`}
            style={{ overflow: "visible" }}
          >
            {/* 右 */}

            {/* ななめ */}
            <Arrow from={{ x, y }} to={{ x: x + 1, y: y + 1 }}>
              ε *
            </Arrow>
          </div>
        );
      })}
      {productFromLen(query.length + 1, ambiguity).map(([x, y]) => {
        return (
          <div
            data-arrow={`${x}-${y}`}
            key={`${x}-${y}`}
            style={{ overflow: "visible" }}
          >
            {/* 上 */}
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
      x: nodeRect.left + nodeRect.width / 2,
      y: nodeRect.top + nodeRect.height / 2,
    });
    setRightPos({
      x: nextNodeRect.left + nextNodeRect.width / 2,
      y: nextNodeRect.top + nextNodeRect.height / 2,
    });
  }, [length, ambiguity]);
  if (leftPos.x == 0 && leftPos.y == 0 && rightPos.x == 0 && rightPos.y == 0)
    return null;

  console.log(from, to, { leftPos, rightPos });
  const offsetW = 10;
  const offsetH = 10;

  const vec = { x: rightPos.x - leftPos.x, y: rightPos.y - leftPos.y };
  const left = Math.min(leftPos.x, rightPos.x);
  const top = Math.min(leftPos.y, rightPos.y);
  const w = Math.abs(vec.x);
  const h = Math.abs(vec.y);
  return (
    <svg
      style={{
        position: "absolute",
        left: left - offsetW,
        top: top - offsetH,
      }}
      width={w + offsetW * 2}
      height={h + offsetH * 2}
      viewBox={`${-offsetW} ${-offsetH} ${vec.x + offsetW} ${vec.y + offsetH}`}
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
      <line
        x1={vec.x * 0.2}
        y1={vec.y * 0.2}
        x2={vec.x * 0.8}
        y2={vec.y * 0.8}
        stroke="black"
        strokeWidth="2"
        markerEnd="url(#arrow)"
      />
      <circle cx={vec.x / 2} cy={vec.y / 2} r="10" fill="white" />
      <text
        x={vec.x / 2}
        y={vec.y / 2}
        dominantBaseline="middle"
        textAnchor="middle"
      >
        {children}
      </text>
      {/* <foreignObject width="100%" height="100%" x={vec.x / 2} y={vec.y / 2}>
        {children}
      </foreignObject> */}
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
