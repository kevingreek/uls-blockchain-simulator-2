"use client";
import React, { useState, useEffect } from "react";

const PASSWORD = "Bitrezus";

// ==== CANVAS & POSITIONS ====
const CANVAS_W = 980, CANVAS_H = 680;
const ULS_W = 135, ULS_H = 66, BC_W = 130, BC_H = 70, SRC_W = 170, SRC_H = 55;
const positions = {
  source: { x: CANVAS_W / 2, y: 65 },
  uls1: { x: 130, y: 120 },
  uls2: { x: CANVAS_W - 130, y: 120 },
  uls3: { x: 130, y: CANVAS_H - 130 },
  uls4: { x: CANVAS_W - 130, y: CANVAS_H - 130 },
  blockchain: { x: CANVAS_W / 2, y: CANVAS_H / 2 + 70 },
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
function RectBlock({ x, y, label, color = "#20B2AA", bg = "#EFFFFD", width = ULS_W, height = ULS_H, borderWidth = 3, labelColor = "#18181b" }) {
  return (
    <div style={{
      position: "absolute", left: x - width / 2, top: y - height / 2, width, height,
      background: bg, border: `${borderWidth}px solid ${color}`,
      borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: "bold", fontSize: 22, color: labelColor, zIndex: 3, userSelect: "none", boxShadow: "0 2px 7px #a6d6f16b"
    }}>{label}</div>
  );
}
function Blockchain({ x, y }) {
  return <div style={{
    position: "absolute", left: x - BC_W / 2, top: y - BC_H / 2, width: BC_W, height: BC_H,
    background: "#191919", border: "4px solid #333", borderRadius: 12, display: "flex",
    alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 21, color: "#fff",
    zIndex: 3, boxShadow: "0 2px 12px #aaa7"
  }}>Blockchain</div>;
}
function MessageEnvelope({ x, y, state, tag, blink }) {
  let bg = "#19a3ed", border = "#19a3ed", icon = "✉️", key = null, color = "#fff";
  if (state === "tokenized") { bg = "#12C98B"; border = "#12C98B"; key = "🔑"; }
  if (state === "rejected") { bg = "#e73c3c"; border = "#e73c3c"; key = "🔑"; }
  if (state === "blink") { bg = "#fde047"; border = "#facc15"; color = "#18181b"; }
  return (
    <div style={{
      position: "absolute", left: x - 22, top: y - 22, zIndex: 21, transition: "background 0.14s",
      width: 44, height: 44, borderRadius: 13, border: `3px solid ${border}`,
      background: bg, fontSize: 25, fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 2px 8px #6664", color, animation: blink ? "blink .4s linear infinite alternate" : "none"
    }}>
      {icon}{key ? <span style={{ fontSize: 19, color: state === "tokenized" ? "#12C98B" : "#e73c3c", marginLeft: 3 }}>{key}</span> : null}
      <div style={{
        position: "absolute", left: "50%", top: "110%", fontSize: 12, background: "#fff",
        color: "#222", padding: "2px 7px", borderRadius: 6, border: "1px solid #ccc", fontWeight: 600, transform: "translateX(-50%)", zIndex: 99
      }}>{tag}</div>
      <style>{`@keyframes blink { 0%{background:${bg};} 100%{background:#fde047;} }`}</style>
    </div>
  );
}

// ==== LINES & TAGS ====
function LineLabel({ x, y, color, text }) {
  return (
    <div style={{
      position: "absolute", left: x, top: y, fontSize: 15, fontWeight: 600, padding: "2px 10px",
      background: "#fff", border: `2px solid ${color}`, borderRadius: 9, color, zIndex: 99, pointerEvents: "none"
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
  // RPC (purple, 2 curved, 2 straight, all bidirectional)
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
        {/* Message Feed */}
        <line x1={FEED1_START.x} y1={FEED1_START.y} x2={FEED1_END.x} y2={FEED1_END.y}
          stroke="#888" strokeWidth={3} strokeDasharray="13,8" markerEnd="url(#arrowGreySmall)" />
        <line x1={FEED2_START.x} y1={FEED2_START.y} x2={FEED2_END.x} y2={FEED2_END.y}
          stroke="#888" strokeWidth={3} strokeDasharray="13,8" markerEnd="url(#arrowGreySmall)" />
        {/* Λ-Link */}
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
        {/* RPC (purple, arrows) */}
        <path d={`M ${rpc1_bc.x} ${rpc1_bc.y} Q ${RPC_CURVED[0].ctrl.x} ${RPC_CURVED[0].ctrl.y} ${rpc1_uls.x} ${rpc1_uls.y}`}
          stroke="#a63cff" strokeWidth={3.5} fill="none" strokeDasharray="13,8" markerEnd="url(#arrowPurpleSmall)" />
        <path d={`M ${rpc1_uls.x} ${rpc1_uls.y} Q ${RPC_CURVED[0].ctrl.x} ${RPC_CURVED[0].ctrl.y} ${rpc1_bc.x} ${rpc1_bc.y}`}
          stroke="#a63cff" strokeWidth={3.5} fill="none" strokeDasharray="13,8" markerEnd="url(#arrowPurpleSmall)" />
        <path d={`M ${rpc2_bc.x} ${rpc2_bc.y} Q ${RPC_CURVED[1].ctrl.x} ${RPC_CURVED[1].ctrl.y} ${rpc2_uls.x} ${rpc2_uls.y}`}
          stroke="#a63cff" strokeWidth={3.5} fill="none" strokeDasharray="13,8" markerEnd="url(#arrowPurpleSmall)" />
        <path d={`M ${rpc2_uls.x} ${rpc2_uls.y} Q ${RPC_CURVED[1].ctrl.x} ${RPC_CURVED[1].ctrl.y} ${rpc2_bc.x} ${rpc2_bc.y}`}
          stroke="#a63cff" strokeWidth={3.5} fill="none" strokeDasharray="13,8" markerEnd="url(#arrowPurpleSmall)" />
        <line x1={rpc3_bc.x} y1={rpc3_bc.y} x2={rpc3_uls.x} y2={rpc3_uls.y}
          stroke="#a63cff" strokeWidth={3.5} strokeDasharray="13,8" markerEnd="url(#arrowPurpleSmall)" />
        <line x1={rpc3_uls.x} y1={rpc3_uls.y} x2={rpc3_bc.x} y2={rpc3_bc.y}
          stroke="#a63cff" strokeWidth={3.5} strokeDasharray="13,8" markerEnd="url(#arrowPurpleSmall)" />
        <line x1={rpc4_bc.x} y1={rpc4_bc.y} x2={rpc4_uls.x} y2={rpc4_uls.y}
          stroke="#a63cff" strokeWidth={3.5} strokeDasharray="13,8" markerEnd="url(#arrowPurpleSmall)" />
        <line x1={rpc4_uls.x} y1={rpc4_uls.y} x2={rpc4_bc.x} y2={rpc4_bc.y}
          stroke="#a63cff" strokeWidth={3.5} strokeDasharray="13,8" markerEnd="url(#arrowPurpleSmall)" />
        {/* SVG arrow markers */}
        <defs>
          <marker id="arrowGreySmall" markerWidth="5.6" markerHeight="5.6" refX="3.5" refY="2.8" orient="auto" markerUnits="strokeWidth">
            <polygon points="0,0 5.6,2.8 0,5.6" fill="#888" />
          </marker>
          <marker id="arrowBrownSmall" markerWidth="5.6" markerHeight="5.6" refX="3.5" refY="2.8" orient="auto" markerUnits="strokeWidth">
            <polygon points="0,0 5.6,2.8 0,5.6" fill="#8B4513" />
          </marker>
          <marker id="arrowPurpleSmall" markerWidth="5.6" markerHeight="5.6" refX="3.5" refY="2.8" orient="auto" markerUnits="strokeWidth">
            <polygon points="0,0 5.6,2.8 0,5.6" fill="#a63cff" />
          </marker>
        </defs>
      </svg>
      {/* --- Line tags (absolutely positioned, not on lines) --- */}
      <LineLabel x={240} y={90} color="#888" text="Message Feed" />
      <LineLabel x={700} y={90} color="#888" text="Message Feed" />
      <LineLabel x={110} y={280} color="#8B4513" text="Λ-Link" />
      <LineLabel x={300} y={430} color="#8B4513" text="Λ-Link" />
      <LineLabel x={720} y={440} color="#8B4513" text="Λ-Link" />
      <LineLabel x={850} y={280} color="#8B4513" text="Λ-Link" />
      <LineLabel x={240} y={170} color="#a63cff" text="RPC channel" />
      <LineLabel x={690} y={170} color="#a63cff" text="RPC channel" />
      <LineLabel x={300} y={605} color="#a63cff" text="RPC channel" />
      <LineLabel x={700} y={605} color="#a63cff" text="RPC channel" />
    </>
  );
}

// ==== LEGEND ====
function LegendBox() {
  return (
    <div style={{
      width: 200, background: "#fff", border: "2px solid #d1d5db", borderRadius: 15,
      padding: "18px 16px 13px 20px", boxShadow: "0 2px 8px #aaa2",
      display: "flex", flexDirection: "column", gap: 7,
      marginRight: 20,
      fontSize: 15
    }}>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 5, color: "#111" }}>Legend</div>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ display: "inline-block", width: 22, height: 22, borderRadius: 11, background: "#19a3ed", border: "2px solid #19a3ed" }} />
        <span> : Pure Message </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ display: "inline-block", width: 22, height: 22, borderRadius: 11, background: "#12C98B", border: "2px solid #12C98B" }} />
        <span> : Tokenized/Hashed </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ display: "inline-block", width: 22, height: 22, borderRadius: 11, background: "#e73c3c", border: "2px solid #e73c3c" }} />
        <span> : Untokenized/Rejected </span>
      </div>
      <div style={{ height: 9 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ display: "inline-block", width: 36, height: 4, background: "#888", borderRadius: 2, border: "none" }} />
        <span> : Message Feed </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ display: "inline-block", width: 36, height: 4, background: "#8B4513", borderRadius: 2, border: "none" }} />
        <span> : Λ-Link </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ display: "inline-block", width: 36, height: 4, background: "#a63cff", borderRadius: 2, border: "none" }} />
        <span>: RPC/API </span>
      </div>
    </div>
  );
}

// ==== CLI LOG ====
const CLI_PAGE = 6;
function CLILog({ log }) {
  const [scroll, setScroll] = useState(0);
  useEffect(() => { setScroll(0); }, [log]);
  const show = log.slice(scroll, scroll + CLI_PAGE);
  return (
    <div style={{
      width: 380, height: 160, background: "#18181b", color: "#a3e635",
      fontFamily: "monospace", borderRadius: 10, padding: 13, overflow: "hidden", position: "relative", border: "2px solid #222"
    }}>
      <div style={{ height: "118px", overflow: "hidden" }}>
        {show.length === 0 && <div style={{ opacity: 0.6, fontStyle: "italic", color: "#999" }}>No logs</div>}
        {show.map((line, i) =>
          <div key={i} style={{ whiteSpace: "pre", fontSize: 15 }}>{line}</div>
        )}
      </div>
      <div style={{ position: "absolute", right: 13, top: 10 }}>
        <button onClick={() => setScroll(s => Math.max(0, s - 1))} disabled={scroll === 0} style={{ marginRight: 7 }}>↑</button>
        <button onClick={() => setScroll(s => Math.min(log.length - CLI_PAGE, s + 1))} disabled={scroll >= log.length - CLI_PAGE}>↓</button>
      </div>
    </div>
  );
}

// ==== MAIN SIMULATION LOGIC ====
function SimulatorApp({ log, setLog, messages, setMessages, stacks, setStacks, idx, setIdx, paused, setPaused }) {
  useEffect(() => {
    if (paused || idx >= 2000) return;
    const t = setTimeout(() => {
      const n = idx + 1;
      const tagOpt = ["Link 11", "Link 16", "Link 22"];
      const tagType = tagOpt[Math.floor(Math.random() * 3)];
      const isRejected = (n % 5 === 0 || n % 9 === 0);
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
        `[${new Date().toLocaleTimeString()}] [GEN] ${ulsTarget.toUpperCase()} - ${n % 5 === 0 || n % 9 === 0 ? "REJECT" : "VALID"}  ${`#${String(n).padStart(4, "0")} - ${tagType}`}`,
        ...logs
      ]);
      setIdx(n);
    }, 10000);
    return () => clearTimeout(t);
  }, [idx, paused]);

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
          left: pos.x + (side === "left" ? -48 : 48),
          top: pos.y + 28 + (i * 19),
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

  return {
    valid3, reject3, valid4, reject4,
    render: (
      <>
        <CurvedConnections />
        <RectBlock {...positions.source} label="External Message Source" color="#4497f3" bg="#e0f4ff" width={SRC_W} height={SRC_H} />
        <Blockchain {...positions.blockchain} />
        <RectBlock {...positions.uls1} label="ULS-1" />
        <RectBlock {...positions.uls2} label="ULS-2" />
        <RectBlock {...positions.uls3} label="ULS-3" />
        <RectBlock {...positions.uls4} label="ULS-4" />
        {/* Watermark */}
        <img
          src="/favicon.png"
          alt="Astropledge Favicon"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 260,
            height: 260,
            transform: "translate(-50%, -50%)",
            opacity: 0.4,
            zIndex: 0,
            pointerEvents: "none"
          }}
        />
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
      </>
    )
  };
}

// ==== MAIN PAGE ====
export default function Page() {
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  // States for main app
  const [log, setLog] = useState([]);
  const [messages, setMessages] = useState([]);
  const [stacks, setStacks] = useState({ uls3: [], uls4: [] });
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  // Use ref for SimulatorApp so it exposes counters
  const simApp = SimulatorApp({ log, setLog, messages, setMessages, stacks, setStacks, idx, setIdx, paused, setPaused });

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
          style={{ width: 180, marginBottom: 38 }}
        />
        <div style={{
          fontSize: 22,
          marginBottom: 15,
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
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: 280 }}
        >
          <input
            type="password"
            value={input}
            autoFocus
            onChange={e => { setInput(e.target.value); setError(""); }}
            placeholder="Password"
            style={{
              padding: "12px 16px",
              fontSize: 17,
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
              fontSize: 16,
              padding: "9px 26px",
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

  // Counters pills
  function Counter({ value, label, color }) {
    return (
      <span style={{
        background: color, color: "#fff", borderRadius: 10, padding: "3px 14px", fontWeight: 700,
        marginLeft: 6, marginRight: 6, fontSize: 16, display: "inline-block"
      }}>
        {value} {label}
      </span>
    );
  }

  // ---- MAIN RENDER ----
  return (
    <div style={{
      minHeight: "100vh",
      minWidth: "100vw",
      background: "#f1f8fc",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      {/* --- HEADER: Counters & Buttons --- */}
      <div style={{
        width: CANVAS_W + 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        margin: "30px auto 0 auto",
        height: 46
      }}>
        {/* ULS-3 Counters */}
        <div style={{ display: "flex", alignItems: "center", fontWeight: "bold", fontSize: 17 }}>
          ULS-3:
          <Counter value={simApp.valid3} label="Valid" color="#14c572" />
          <Counter value={simApp.reject3} label="Rejected" color="#e73c3c" />
        </div>
        {/* Center Buttons */}
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => setPaused(true)} style={{ padding: "6px 14px" }}>Pause</button>
          <button onClick={() => setPaused(false)} style={{ padding: "6px 14px" }}>Resume</button>
          <button onClick={() => {
            setMessages([]); setStacks({ uls3: [], uls4: [] }); setLog([]); setIdx(0); setPaused(false);
          }} style={{ padding: "6px 14px" }}>Reset</button>
        </div>
        {/* ULS-4 Counters */}
        <div style={{ display: "flex", alignItems: "center", fontWeight: "bold", fontSize: 17 }}>
          ULS-4:
          <Counter value={simApp.valid4} label="Valid" color="#14c572" />
          <Counter value={simApp.reject4} label="Rejected" color="#e73c3c" />
        </div>
      </div>

      {/* --- CANVAS --- */}
      <div style={{
        width: CANVAS_W,
        height: CANVAS_H,
        position: "relative",
        background: "#f6f8fa",
        border: "1px solid #ddd",
        margin: "0px auto 0 auto",
        overflow: "hidden",
        borderRadius: 11
      }}>
        {simApp.render}
      </div>

      {/* --- FOOTER: Legend + CLI log --- */}
      <div style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 38,
        width: CANVAS_W + 40,
        margin: "25px auto 0 auto",
        justifyContent: "center"
      }}>
        <LegendBox />
        <CLILog log={log} />
      </div>

      {/* --- COPYRIGHT --- */}
      <div style={{
        width: CANVAS_W,
        textAlign: "center",
        marginTop: 28,
        marginBottom: 18,
        color: "#222",
        fontSize: 15,
        fontWeight: 500,
        letterSpacing: 0.5,
        opacity: 0.86
      }}>
        Copyright 2025 (c) by Bitrezus I.K.E. All rights reserved.
      </div>
    </div>
  );
}
