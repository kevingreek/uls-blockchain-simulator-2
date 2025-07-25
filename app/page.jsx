"use client";
import React, { useState, useEffect } from "react";

const PASSWORD = "Bitrezus";

// ==== CANVAS & POSITIONS ====
const CANVAS_W = 1200, CANVAS_H = 700;
const ULS_W = 140, ULS_H = 80, BC_W = 170, BC_H = 110, SRC_W = 160, SRC_H = 70;
const positions = {
  source: { x: CANVAS_W / 2, y: 70 },
  uls1: { x: 120, y: 120 },
  uls2: { x: CANVAS_W - 120, y: 120 },
  uls3: { x: 120, y: CANVAS_H - 120 },
  uls4: { x: CANVAS_W - 120, y: CANVAS_H - 120 },
  blockchain: { x: CANVAS_W / 2, y: CANVAS_H / 2 + 220 },
};
function getSide(pt, width, height, side) {
  const hw = width / 2, hh = height / 2;
  switch (side) {
    case "top": return { x: pt.x, y: pt.y - hh };
    case "bottom": return { x: pt.x, y: pt.y + hh };
    case "left": return { x: pt.x - hw, y: pt.y };
    case "right": return { x: pt.x + hw, y: pt.y };
    default: return pt;
  }
}
function getCorner(pt, width, height, pos) {
  const hw = width / 2, hh = height / 2;
  switch (pos) {
    case "ul": return { x: pt.x - hw, y: pt.y - hh };
    case "ur": return { x: pt.x + hw, y: pt.y - hh };
    case "ll": return { x: pt.x - hw, y: pt.y + hh };
    case "lr": return { x: pt.x + hw, y: pt.y + hh };
    default: return pt;
  }
}
function lerp(a, b, t) { return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }
function bezier(p0, c, p1, t) {
  return {
    x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * c.x + t * t * p1.x,
    y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * c.y + t * t * p1.y
  };
}
function randomHash() { return Math.random().toString(36).substring(2, 10).toUpperCase(); }

// ==== BLOCKS ====
function RectBlock({ x, y, label, color = "#0d9488", bg = "#e6fffa", width = ULS_W, height = ULS_H, borderWidth = 3, labelColor = "#18181b" }) {
  return (
    <div style={{
      position: "absolute", left: x - width / 2, top: y - height / 2, width, height,
      background: bg, border: `${borderWidth}px solid ${color}`,
      borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: "bold", fontSize: 21, color: labelColor, zIndex: 3, userSelect: "none"
    }}>{label}</div>
  );
}
function Blockchain({ x, y }) {
  return <RectBlock x={x} y={y} label="Blockchain" color="#666" bg="#222" width={BC_W} height={BC_H} borderWidth={4} labelColor="#fff" />;
}
function MessageEnvelope({ x, y, state, tag, blink }) {
  let bg = "#2196f3", border = "#2196f3", icon = "✉️", key = null, color = "#fff";
  if (state === "tokenized") { bg = "#21c36b"; border = "#21c36b"; key = "🔑"; }
  if (state === "rejected") { bg = "#ef4444"; border = "#ef4444"; key = "❌"; }
  if (state === "blink") { bg = "#fde047"; border = "#facc15"; color = "#18181b"; }
  return (
    <div style={{
      position: "absolute", left: x - 19, top: y - 19, zIndex: 21, transition: "background 0.14s",
      width: 38, height: 38, borderRadius: 9, border: `3px solid ${border}`,
      background: bg, fontSize: 23, fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 2px 8px #6664", color, animation: blink ? "blink .4s linear infinite alternate" : "none"
    }}>
      {icon}{key ? <span style={{ fontSize: 17, color: state === "tokenized" ? "#21c36b" : "#ef4444", marginLeft: 2 }}>{key}</span> : null}
      <div style={{
        position: "absolute", left: "50%", top: "105%", fontSize: 13, background: "#fff",
        color: "#222", padding: "2px 7px", borderRadius: 6, border: "1px solid #ccc", fontWeight: 600, transform: "translateX(-50%)", zIndex: 99
      }}>{tag}</div>
      <style>{`@keyframes blink { 0%{background:${bg};} 100%{background:#fde047;} }`}</style>
    </div>
  );
}

// ==== LINES & TAGS ====
function getStraightAngle(start, end) { return Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI); }
function LineTag({ start, end, text, color = "#333", t = 0.5, offsetPx = 26 }) {
  const pt = { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t };
  const angle = getStraightAngle(start, end), perpAngle = angle + 90;
  const offsetX = Math.cos((perpAngle * Math.PI) / 180) * offsetPx, offsetY = Math.sin((perpAngle * Math.PI) / 180) * offsetPx;
  let displayAngle = angle; if (displayAngle > 90) displayAngle -= 180; if (displayAngle < -90) displayAngle += 180;
  return (
    <div style={{
      position: "absolute", left: pt.x + offsetX - text.length * 3, top: pt.y + offsetY - 16,
      background: "#fff", color, padding: "2px 8px", fontSize: 14, borderRadius: 8,
      border: `2px solid ${color}`, fontWeight: 600, pointerEvents: "none", zIndex: 11,
      userSelect: "none", transform: `rotate(${displayAngle}deg)`, boxShadow: "0 1px 4px #eee"
    }}>{text}</div>
  );
}
function getQuadraticPoint(start, control, end, t) {
  const x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * control.x + t * t * end.x;
  const y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * control.y + t * t * end.y;
  return { x, y };
}
function getQuadraticTangentAngle(start, control, end, t) {
  const dx = 2 * (1 - t) * (control.x - start.x) + 2 * t * (end.x - control.x);
  const dy = 2 * (1 - t) * (control.y - start.y) + 2 * t * (end.y - control.y);
  return Math.atan2(dy, dx) * (180 / Math.PI);
}
function CurvedLineTag({ start, control, end, text, color = "#333", t = 0.5, offsetPx = 26 }) {
  const pt = getQuadraticPoint(start, control, end, t);
  const angle = getQuadraticTangentAngle(start, control, end, t), perpAngle = angle + 90;
  const offsetX = Math.cos((perpAngle * Math.PI) / 180) * offsetPx, offsetY = Math.sin((perpAngle * Math.PI) / 180) * offsetPx;
  let displayAngle = angle; if (displayAngle > 90) displayAngle -= 180; if (displayAngle < -90) displayAngle += 180;
  return (
    <div style={{
      position: "absolute", left: pt.x + offsetX - text.length * 3, top: pt.y + offsetY - 16,
      background: "#fff", color, padding: "2px 8px", fontSize: 14, borderRadius: 8, border: `2px solid ${color}`,
      fontWeight: 600, pointerEvents: "none", zIndex: 11, userSelect: "none",
      transform: `rotate(${displayAngle}deg)`, boxShadow: "0 1px 4px #eee"
    }}>{text}</div>
  );
}
function CurvedConnections() {
  const { source, uls1, uls2, uls3, uls4, blockchain } = positions;

  // Message Feed (grey, straight)
  const FEED1_START = getSide(source, SRC_W, SRC_H, "left");
  const FEED1_END = getSide(uls1, ULS_W, ULS_H, "right");
  const FEED2_START = getSide(source, SRC_W, SRC_H, "right");
  const FEED2_END = getSide(uls2, ULS_W, ULS_H, "left");

  // Λ-Link (brown, straight)
  const LAMBDA = [
    { from: getSide(uls1, ULS_W, ULS_H, "bottom"), to: getSide(uls3, ULS_W, ULS_H, "top") },
    { from: getSide(uls1, ULS_W, ULS_H, "bottom"), to: getCorner(uls4, ULS_W, ULS_H, "ul") },
    { from: getSide(uls2, ULS_W, ULS_H, "bottom"), to: getCorner(uls3, ULS_W, ULS_H, "ur") },
    { from: getSide(uls2, ULS_W, ULS_H, "bottom"), to: getSide(uls4, ULS_W, ULS_H, "top") }
  ];

  // RPC (purple, 2 curved, 2 straight, all bidirectional, arrows into both ends)
  const rpc1_bc = getCorner(blockchain, BC_W, BC_H, "ul");
  const rpc1_uls = getCorner(uls1, ULS_W, ULS_H, "lr");
  const rpc2_bc = getCorner(blockchain, BC_W, BC_H, "ur");
  const rpc2_uls = getCorner(uls2, ULS_W, ULS_H, "ll");
  const RPC_CURVED = [
    {
      bc: rpc1_bc, uls: rpc1_uls,
      ctrl: {
        x: (rpc1_bc.x + rpc1_uls.x) / 2 - 60,
        y: (rpc1_bc.y + rpc1_uls.y) / 2 - 40
      }
    },
    {
      bc: rpc2_bc, uls: rpc2_uls,
      ctrl: {
        x: (rpc2_bc.x + rpc2_uls.x) / 2 + 60,
        y: (rpc2_bc.y + rpc2_uls.y) / 2 - 40
      }
    }
  ];
  const rpc3_bc = getSide(blockchain, BC_W, BC_H, "left");
  const rpc3_uls = getSide(uls3, ULS_W, ULS_H, "right");
  const rpc4_bc = getSide(blockchain, BC_W, BC_H, "right");
  const rpc4_uls = getSide(uls4, ULS_W, ULS_H, "left");

  return (
    <>
      <svg
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          zIndex: 2,
          pointerEvents: "none",
        }}
        width={CANVAS_W}
        height={CANVAS_H}
      >
        {/* Message Feed (grey, straight, small grey arrows) */}
        <line x1={FEED1_START.x} y1={FEED1_START.y} x2={FEED1_END.x} y2={FEED1_END.y}
          stroke="#888" strokeWidth={3} strokeDasharray="13,8" markerEnd="url(#arrowGreySmall)" />
        <line x1={FEED2_START.x} y1={FEED2_START.y} x2={FEED2_END.x} y2={FEED2_END.y}
          stroke="#888" strokeWidth={3} strokeDasharray="13,8" markerEnd="url(#arrowGreySmall)" />
        {/* Λ-Link (brown, straight, small brown arrows) */}
        {LAMBDA.map((line, i) => (
          <line
            key={`lambda${i}`}
            x1={line.from.x}
            y1={line.from.y}
            x2={line.to.x}
            y2={line.to.y}
            stroke="#8B4513"
            strokeWidth={4}
            strokeDasharray="13,8"
            markerEnd="url(#arrowBrownSmall)"
          />
        ))}
        {/* RPC (purple, ALL arrows look into their block) */}
        {/* ULS-1 <-> Blockchain (curved): arrowhead at ULS-1 & Blockchain */}
        <path d={`M ${rpc1_bc.x} ${rpc1_bc.y} Q ${RPC_CURVED[0].ctrl.x} ${RPC_CURVED[0].ctrl.y} ${rpc1_uls.x} ${rpc1_uls.y}`}
          stroke="#9b2cff" strokeWidth={3.5} fill="none" strokeDasharray="13,8" markerEnd="url(#arrowPurpleSmall)" />
        <path d={`M ${rpc1_uls.x} ${rpc1_uls.y} Q ${RPC_CURVED[0].ctrl.x} ${RPC_CURVED[0].ctrl.y} ${rpc1_bc.x} ${rpc1_bc.y}`}
          stroke="#9b2cff" strokeWidth={3.5} fill="none" strokeDasharray="13,8" markerEnd="url(#arrowPurpleSmall)" />
        {/* ULS-2 <-> Blockchain (curved): arrowhead at ULS-2 & Blockchain */}
        <path d={`M ${rpc2_bc.x} ${rpc2_bc.y} Q ${RPC_CURVED[1].ctrl.x} ${RPC_CURVED[1].ctrl.y} ${rpc2_uls.x} ${rpc2_uls.y}`}
          stroke="#9b2cff" strokeWidth={3.5} fill="none" strokeDasharray="13,8" markerEnd="url(#arrowPurpleSmall)" />
        <path d={`M ${rpc2_uls.x} ${rpc2_uls.y} Q ${RPC_CURVED[1].ctrl.x} ${RPC_CURVED[1].ctrl.y} ${rpc2_bc.x} ${rpc2_bc.y}`}
          stroke="#9b2cff" strokeWidth={3.5} fill="none" strokeDasharray="13,8" markerEnd="url(#arrowPurpleSmall)" />
        {/* ULS-3 <-> Blockchain (straight): arrowhead at ULS-3 & Blockchain */}
        <line x1={rpc3_bc.x} y1={rpc3_bc.y} x2={rpc3_uls.x} y2={rpc3_uls.y}
          stroke="#9b2cff" strokeWidth={3.5} strokeDasharray="13,8" markerEnd="url(#arrowPurpleSmall)" />
        <line x1={rpc3_uls.x} y1={rpc3_uls.y} x2={rpc3_bc.x} y2={rpc3_bc.y}
          stroke="#9b2cff" strokeWidth={3.5} strokeDasharray="13,8" markerEnd="url(#arrowPurpleSmall)" />
        {/* ULS-4 <-> Blockchain (straight): arrowhead at ULS-4 & Blockchain */}
        <line x1={rpc4_bc.x} y1={rpc4_bc.y} x2={rpc4_uls.x} y2={rpc4_uls.y}
          stroke="#9b2cff" strokeWidth={3.5} strokeDasharray="13,8" markerEnd="url(#arrowPurpleSmall)" />
        <line x1={rpc4_uls.x} y1={rpc4_uls.y} x2={rpc4_bc.x} y2={rpc4_bc.y}
          stroke="#9b2cff" strokeWidth={3.5} strokeDasharray="13,8" markerEnd="url(#arrowPurpleSmall)" />
        {/* SVG arrow markers (smaller, color-matched) */}
        <defs>
          <marker id="arrowGreySmall" markerWidth="5.6" markerHeight="5.6" refX="3.5" refY="2.8" orient="auto" markerUnits="strokeWidth">
            <polygon points="0,0 5.6,2.8 0,5.6" fill="#888" />
          </marker>
          <marker id="arrowBrownSmall" markerWidth="5.6" markerHeight="5.6" refX="3.5" refY="2.8" orient="auto" markerUnits="strokeWidth">
            <polygon points="0,0 5.6,2.8 0,5.6" fill="#8B4513" />
          </marker>
          <marker id="arrowPurpleSmall" markerWidth="5.6" markerHeight="5.6" refX="3.5" refY="2.8" orient="auto" markerUnits="strokeWidth">
            <polygon points="0,0 5.6,2.8 0,5.6" fill="#9b2cff" />
          </marker>
        </defs>
      </svg>
      {/* ---- Line tags for all connections ---- */}
      {/* Message Feed */}
      <LineTag start={FEED2_START} end={FEED2_END} text="Message Feed" color="#888" t={0.5} offsetPx={24} />
      <LineTag start={FEED1_START} end={FEED1_END} text="Message Feed" color="#888" t={0.6} offsetPx={-19} />
      {/* Λ-Link: (all four lines, each with a tag, as requested) */}
      <LineTag start={LAMBDA[0].from} end={LAMBDA[0].to} text="Λ-Link" color="#8B4513" t={0.60} offsetPx={-20} />
      <LineTag start={LAMBDA[1].from} end={LAMBDA[1].to} text="Λ-Link" color="#8B4513" t={0.90} offsetPx={26} />
      <LineTag start={LAMBDA[2].from} end={LAMBDA[2].to} text="Λ-Link" color="#8B4513" t={0.80} offsetPx={20} />
      <LineTag start={LAMBDA[3].from} end={LAMBDA[3].to} text="Λ-Link" color="#8B4513" t={0.60} offsetPx={24} />
      {/* RPC tags */}
      <CurvedLineTag start={rpc1_bc} control={RPC_CURVED[0].ctrl} end={rpc1_uls} text="RPC/API" color="#9b2cff" t={0.42} offsetPx={4} />
      <CurvedLineTag start={rpc2_bc} control={RPC_CURVED[1].ctrl} end={rpc2_uls} text="RPC/API" color="#9b2cff" t={0.57} offsetPx={10} />
      <LineTag start={rpc3_bc} end={rpc3_uls} text="RPC channel" color="#9b2cff" t={0.45} offsetPx={-20} />
      <LineTag start={rpc4_bc} end={rpc4_uls} text="RPC channel" color="#9b2cff" t={0.46} offsetPx={22} />
    </>
  );
}

// ==== LEGEND ====
function LegendBox() {
  return (
    <div style={{
      width: 210, background: "#fff", border: "2px solid #d1d5db", borderRadius: 18,
      padding: "18px 16px 10px 20px", margin: "0 0 18px 0", boxShadow: "0 4px 20px #8881",
      display: "flex", flexDirection: "column", gap: 7
    }}>
      <div style={{ fontWeight: 700, fontSize: 19, marginBottom: 2, color: "#111" }}>Legend</div>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ display: "inline-block", width: 26, height: 26, borderRadius: 13, background: "#2196f3", border: "2px solid #2196f3" }}></span>
        <span style={{ fontSize: 16, marginLeft: 6 }}>= Pure Message</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ display: "inline-block", width: 26, height: 26, borderRadius: 13, background: "#21c36b", border: "2px solid #21c36b" }}></span>
        <span style={{ fontSize: 16, marginLeft: 6 }}>= Tokenized/Hashed</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ display: "inline-block", width: 26, height: 26, borderRadius: 13, background: "#ef4444", border: "2px solid #ef4444" }}></span>
        <span style={{ fontSize: 16, marginLeft: 6 }}>= Untokenized/Rejected</span>
      </div>
      <div style={{ height: 10 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ display: "inline-block", width: 40, height: 5, background: "#888", borderRadius: 3, border: "none" }}></span>
        <span style={{ fontSize: 15 }}>Message Feed</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ display: "inline-block", width: 40, height: 5, background: "#8B4513", borderRadius: 3, border: "none" }}></span>
        <span style={{ fontSize: 15 }}>Λ-Link</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ display: "inline-block", width: 40, height: 5, background: "#9b2cff", borderRadius: 3, border: "none" }}></span>
        <span style={{ fontSize: 15 }}>RPC/API</span>
      </div>
    </div>
  );
}

// ==== CLI LOG ====
const CLI_PAGE = 8;
function CLILog({ log }) {
  const [scroll, setScroll] = useState(0);
  useEffect(() => { setScroll(0); }, [log]);
  const show = log.slice(scroll, scroll + CLI_PAGE);
  return (
    <div style={{
      width: 780, height: 220, background: "#18181b", color: "#a3e635",
      fontFamily: "monospace", borderRadius: 8, padding: 12, overflow: "hidden", position: "relative", border: "2px solid #222"
    }}>
      <div style={{ height: "180px", overflow: "hidden" }}>
        {show.length === 0 && <div style={{ opacity: 0.6, fontStyle: "italic", color: "#999" }}>No logs</div>}
        {show.map((line, i) =>
          <div key={i} style={{ whiteSpace: "pre", fontSize: 16 }}>{line}</div>
        )}
      </div>
      <div style={{ position: "absolute", right: 15, top: 13 }}>
        <button onClick={() => setScroll(s => Math.max(0, s - 1))} disabled={scroll === 0} style={{ marginRight: 8 }}>↑</button>
        <button onClick={() => setScroll(s => Math.min(log.length - CLI_PAGE, s + 1))} disabled={scroll >= log.length - CLI_PAGE}>↓</button>
      </div>
    </div>
  );
}

// ==== MAIN SIMULATION LOGIC ====
function SimulatorApp() {
  const [log, setLog] = useState([]);
  const [messages, setMessages] = useState([]);
  const [stacks, setStacks] = useState({ uls3: [], uls4: [] });
  const [idx, setIdx] = useState(0);
  const [running, setRunning] = useState(true);
  const [paused, setPaused] = useState(false);

  // Message generator, 1 per 10 seconds, up to 2000
  useEffect(() => {
    if (!running || paused || idx >= 2000) return;
    const t = setTimeout(() => {
      const n = idx + 1;
      const tagOpt = ["Link 11", "Link 16", "Link 22"];
      const tagType = tagOpt[Math.floor(Math.random() * 3)];
      const isRejected = (n % 5 === 0);
      const ulsTarget = Math.random() < 0.5 ? "uls1" : "uls2";
      setMessages(msgs => [...msgs, {
        id: n,
        tag: `#${String(n).padStart(4, "0")} - ${tagType}`,
        isRejected,
        state: "feed",
        progress: 0,
        at: ulsTarget,
        lastStep: Date.now(),
        hash: null
      }]);
      setLog(logs => [
        `[${new Date().toLocaleTimeString()}] [GEN] ${ulsTarget.toUpperCase()} - ${n % 5 === 0 ? "REJECT" : "VALID"}  ${`#${String(n).padStart(4, "0")} - ${tagType}`}`,
        ...logs
      ]);
      setIdx(n);
    }, 10000);
    return () => clearTimeout(t);
  }, [running, idx, paused]);

  // Animation logic
  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setMessages(msgs => msgs.map(msg => {
        let { state, progress, isRejected, at, tag, id, lastStep, hash } = msg;
        let now = Date.now();
        if (state === "feed" && progress < 1) return { ...msg, progress: Math.min(progress + 0.014, 1) };
        if (state === "feed" && progress >= 1) {
          setLog(logs => [
            `[${new Date().toLocaleTimeString()}] [ARRIVE] ${at.toUpperCase()} | ${tag}`,
            ...logs
          ]);
          return { ...msg, state: "blink", blink: true, lastStep: now, progress: 0 };
        }
        if (state === "blink" && now - lastStep > 2000) {
          if (!isRejected) return { ...msg, state: "rpc-to-bc", progress: 0, lastStep: now };
          setLog(logs => [
            `[${new Date().toLocaleTimeString()}] [REJECT] Direct to ULS-3/ULS-4 | ${tag}`,
            ...logs
          ]);
          return { ...msg, state: "dup-to-uls3", progress: 0, lastStep: now };
        }
        if (state === "rpc-to-bc" && progress < 1) return { ...msg, progress: Math.min(progress + 0.0085, 1) };
        if (state === "rpc-to-bc" && progress >= 1) {
          setLog(logs => [
            `[${new Date().toLocaleTimeString()}] [BLOCKCHAIN] Tokenizing | ${tag}`,
            ...logs
          ]);
          return { ...msg, state: "on-bc", lastStep: now };
        }
        if (state === "on-bc" && now - lastStep > 4000) {
          const newHash = randomHash();
          setLog(logs => [
            `[${new Date().toLocaleTimeString()}] [TOKENIZED] Hash: ${newHash} | ${tag}`,
            ...logs
          ]);
          return { ...msg, state: "rpc-from-bc", progress: 0, lastStep: now, hash: newHash, tag: `${tag} - ${newHash}` };
        }
        if (state === "rpc-from-bc" && progress < 1) return { ...msg, progress: Math.min(progress + 0.0085, 1) };
        if (state === "rpc-from-bc" && progress >= 1) {
          setLog(logs => [
            `[${new Date().toLocaleTimeString()}] [RETURN] ${at.toUpperCase()} (TOKENIZED) | ${tag}`,
            ...logs
          ]);
          return { ...msg, state: "dup-to-uls3", progress: 0, lastStep: now };
        }
        if ((state === "dup-to-uls3" || state === "dup-to-uls4") && progress < 1) {
          return { ...msg, progress: Math.min(progress + 0.0095, 1) };
        }
        if (state === "dup-to-uls3" && progress >= 1) {
          setLog(logs => [
            `[${new Date().toLocaleTimeString()}] [TO ULS-3] ${isRejected ? "REJECT" : "VALID"} | ${tag}`,
            ...logs
          ]);
          setStacks(stacks => ({
            ...stacks,
            uls3: [...(stacks.uls3 || []), { ...msg, state: isRejected ? "rejected" : "tokenized" }]
          }));
          return { ...msg, state: "dup-to-uls4", progress: 0, lastStep: now };
        }
        if (state === "dup-to-uls4" && progress >= 1) {
          setLog(logs => [
            `[${new Date().toLocaleTimeString()}] [TO ULS-4] ${isRejected ? "REJECT" : "VALID"} | ${tag}`,
            ...logs
          ]);
          setStacks(stacks => ({
            ...stacks,
            uls4: [...(stacks.uls4 || []), { ...msg, state: isRejected ? "rejected" : "tokenized" }]
          }));
          return { ...msg, state: "done", finished: true, lastStep: now };
        }
        if (state === "rpc-from-bc" && progress === 0) {
          if (now - lastStep < 2000) return msg;
          return { ...msg, state: "dup-to-uls3", progress: 0, lastStep: now };
        }
        return msg;
      }));
    }, 20);
    return () => clearInterval(interval);
  }, [paused]);

  const handlePause = () => setPaused(true);
  const handleResume = () => setPaused(false);
  const handleReset = () => {
    setMessages([]); setStacks({ uls3: [], uls4: [] }); setLog([]); setIdx(0); setPaused(false); setRunning(true);
  };

  function getMsgPos(msg) {
    const { state, progress, at } = msg;
    if (state === "feed") {
      const from = getSide(positions.source, SRC_W, SRC_H, at === "uls1" ? "left" : "right");
      const to = getSide(positions[at], ULS_W, ULS_H, at === "uls1" ? "right" : "left");
      return lerp(from, to, progress);
    }
    if (state === "blink") {
      return getSide(positions[at], ULS_W, ULS_H, at === "uls1" ? "right" : "left");
    }
    if (state === "rpc-to-bc") {
      const uls = positions[at];
      const bc = getCorner(positions.blockchain, BC_W, BC_H, at === "uls1" ? "ul" : "ur");
      const ctrl = { x: (uls.x + bc.x) / 2 + (at === "uls1" ? -60 : 60), y: (uls.y + bc.y) / 2 - 40 };
      return bezier(uls, ctrl, bc, progress);
    }
    if (state === "on-bc") {
      return getCorner(positions.blockchain, BC_W, BC_H, at === "uls1" ? "ul" : "ur");
    }
    if (state === "rpc-from-bc") {
      const uls = positions[at];
      const bc = getCorner(positions.blockchain, BC_W, BC_H, at === "uls1" ? "ul" : "ur");
      const ctrl = { x: (uls.x + bc.x) / 2 + (at === "uls1" ? -60 : 60), y: (uls.y + bc.y) / 2 - 40 };
      return bezier(bc, ctrl, uls, progress);
    }
    if (state === "dup-to-uls3") {
      const from = getSide(positions[at], ULS_W, ULS_H, "bottom");
      const to = getSide(positions.uls3, ULS_W, ULS_H, "top");
      return lerp(from, to, progress);
    }
    if (state === "dup-to-uls4") {
      const from = getSide(positions[at], ULS_W, ULS_H, "bottom");
      const to = getCorner(positions.uls4, ULS_W, ULS_H, "ul");
      return lerp(from, to, progress);
    }
    return positions.source;
  }
  function StackRender({ stack, pos, side, isRejected }) {
    return stack.map((m, i) => (
      <div key={m.id}
        style={{
          position: "absolute",
          left: pos.x + (side === "left" ? -58 : 38),
          top: pos.y + 38 + (i * 22),
          zIndex: 20
        }}>
        <MessageEnvelope x={0} y={0} state={isRejected ? "rejected" : "tokenized"} tag={m.tag} />
      </div>
    ));
  }
  const valid3 = stacks.uls3?.filter(x => x.state === "tokenized").length || 0;
  const reject3 = stacks.uls3?.filter(x => x.state === "rejected").length || 0;
  const valid4 = stacks.uls4?.filter(x => x.state === "tokenized").length || 0;
  const reject4 = stacks.uls4?.filter(x => x.state === "rejected").length || 0;

  return (
    <>
      <CurvedConnections />
      <RectBlock {...positions.source} label="External Message Source" color="#3b82f6" bg="#e0f2ff" width={160} height={70} />
      <Blockchain {...positions.blockchain} />
      <RectBlock {...positions.uls1} label="ULS-1" />
      <RectBlock {...positions.uls2} label="ULS-2" />
      <RectBlock {...positions.uls3} label="ULS-3" />
      <RectBlock {...positions.uls4} label="ULS-4" />
      {/* Live messages in motion */}
      {messages.filter(m => !m.finished).map((m, i) => {
        const pos = getMsgPos(m);
        return <MessageEnvelope key={m.id} {...pos} state={m.state === "rpc-from-bc" && !m.isRejected ? "tokenized" : m.isRejected ? "rejected" : m.state} tag={m.tag} blink={m.state === "blink"} />;
      })}
      {/* Stack for ULS-3 and ULS-4 */}
      <StackRender stack={stacks.uls3?.filter(x => !x.isRejected)} pos={positions.uls3} side="left" />
      <StackRender stack={stacks.uls3?.filter(x => x.isRejected)} pos={positions.uls3} side="right" isRejected />
      <StackRender stack={stacks.uls4?.filter(x => !x.isRejected)} pos={positions.uls4} side="left" />
      <StackRender stack={stacks.uls4?.filter(x => x.isRejected)} pos={positions.uls4} side="right" isRejected />
      {/* Controls row */}
      <div style={{ margin: "15px auto", width: 940, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* ULS-3 Counter */}
        <div style={{
          fontWeight: "bold", fontSize: 19, display: "flex", alignItems: "center", gap: 11,
          color: "#1e293b", minWidth: 180
        }}>
          ULS-3:
          <span style={{ background: "#16a34a", color: "#fff", borderRadius: 7, padding: "2px 10px", fontSize: 16 }}>
            {valid3} Valid
          </span>
          <span style={{ background: "#dc2626", color: "#fff", borderRadius: 7, padding: "2px 10px", fontSize: 16 }}>
            {reject3} Rejected
          </span>
        </div>
        {/* Buttons */}
        <div>
          <button onClick={handlePause} style={{ marginRight: 9 }}>Pause</button>
          <button onClick={handleResume} style={{ marginRight: 9 }}>Resume</button>
          <button onClick={handleReset}>Reset</button>
        </div>
        {/* ULS-4 Counter */}
        <div style={{
          fontWeight: "bold", fontSize: 19, display: "flex", alignItems: "center", gap: 11,
          color: "#1e293b", minWidth: 180, justifyContent: "flex-end"
        }}>
          ULS-4:
          <span style={{ background: "#16a34a", color: "#fff", borderRadius: 7, padding: "2px 10px", fontSize: 16 }}>
            {valid4} Valid
          </span>
          <span style={{ background: "#dc2626", color: "#fff", borderRadius: 7, padding: "2px 10px", fontSize: 16 }}>
            {reject4} Rejected
          </span>
        </div>
      </div>
      {/* === Legend + CLI logs on the SAME ROW === */}
      <div style={{
        width: 940,
        margin: "8px auto 0",
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 28,
      }}>
        {/* Legend left */}
        <LegendBox />
        {/* CLI logs right */}
        <CLILog log={log} />
      </div>
    </>
  );
}

// ==== MAIN PAGE ====
export default function Page() {
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  if (!authed) {
    return (
      <div style={{
        minHeight: "100vh",
        minWidth: "100vw",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <img
          src="/BITREZUS_LogoVert.png"
          alt="Bitrezus Logo"
          style={{ width: 190, marginBottom: 40 }}
        />
        <div style={{
          fontSize: 23,
          marginBottom: 18,
          fontWeight: 500,
          letterSpacing: 1,
          color: "#252525"
        }}>
          Enter the password to continue
        </div>
        <form
          onSubmit={e => {
            e.preventDefault();
            if (input === PASSWORD) setAuthed(true);
            else setError("Wrong password. Try again.");
          }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: 300 }}
        >
          <input
            type="password"
            value={input}
            autoFocus
            onChange={e => { setInput(e.target.value); setError(""); }}
            placeholder="Password"
            style={{
              padding: "12px 16px",
              fontSize: 18,
              border: "2px solid #dbeafe",
              borderRadius: 9,
              outline: "none",
              width: "100%",
              textAlign: "center"
            }}
          />
          <button
            type="submit"
            style={{
              background: "#3b82f6",
              color: "#fff",
              fontSize: 17,
              padding: "9px 30px",
              border: "none",
              borderRadius: 7,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Enter
          </button>
          {error && <div style={{ color: "#dc2626", fontSize: 15 }}>{error}</div>}
        </form>
      </div>
    );
  }

  // ---- MAIN SIMULATION RENDERS HERE ----
  return (
    <div style={{
      minHeight: "100vh",
      minWidth: "100vw",
      background: "#edf5fa",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      <div style={{
        width: CANVAS_W,
        height: CANVAS_H,
        position: "relative",
        background: "#f6f8fa",
        border: "1px solid #ddd",
        margin: "40px auto 20px auto",
        overflow: "hidden"
      }}>
        {/* Watermark */}
        <img
          src="/favicon.png"
          alt="Astropledge Favicon"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 240,
            height: 240,
            transform: "translate(-50%, -50%)",
            opacity: 0.4,
            zIndex: 1,
            pointerEvents: "none"
          }}
        />
        {/* ---- MAIN SIMULATION CODE BELOW ---- */}
        <SimulatorApp />
      </div>
      {/* Footer */}
      <div style={{
        width: CANVAS_W,
        textAlign: "center",
        marginTop: 10,
        color: "#222",
        fontSize: 16,
        fontWeight: 500,
        letterSpacing: 0.6,
        opacity: 0.82
      }}>
        © 2025 by Bitrezus I.K.E. All rights reserved.
      </div>
    </div>
  );
}
