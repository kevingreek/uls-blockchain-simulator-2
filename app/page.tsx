
"use client";
import React, { useState } from "react";

const PASSWORD = "Bitrezus";

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

  // --- Main simulator canvas (uses watermark) ---
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
        width: 1200,
        height: 700,
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
        {/* Place your main simulation code below here, or replace with components */}
        <div style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1200,
          height: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#a0aec0",
          fontSize: 40,
          zIndex: 2
        }}>
          Λ-Link Enhanced By Astropledge Simulator
        </div>
      </div>
    </div>
  );
}
