"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

interface MessageType {
  id: number;
  hashed: boolean;
  failed: boolean;
  tag: string;
  x: number;
  y: number;
}

const lineStyle = (color: string) => `absolute h-0.5 bg-${color} z-0`;

const ULSBlock = ({ id }: { id: number }) => (
  <div className="absolute w-32 h-20 border-2 border-blue-700 bg-white text-center flex flex-col justify-center items-center text-sm font-bold z-10">
    ULS-{id}
  </div>
);

const BlockchainBlock = () => (
  <div className="absolute w-40 h-20 bg-black text-white flex flex-col justify-center items-center rounded z-10">
    <div className="font-bold">Blockchain</div>
    <div className="text-xs">(Distributed Ledger)</div>
  </div>
);

const SourceHex = () => (
  <div className="absolute w-28 h-16 bg-blue-100 text-center text-xs border-2 border-gray-500 flex justify-center items-center rotate-0 clip-hexagon z-10">
    External Message Source
  </div>
);

const Message = ({ id, hashed, failed, tag, x, y }: MessageType) => (
  <motion.div
    className={`absolute w-10 h-6 px-1 text-[10px] text-white flex items-center justify-center rounded shadow ${
      failed ? "bg-red-500" : hashed ? "bg-green-500" : "bg-blue-500"
    }`}
    animate={{ x, y }}
    transition={{ duration: 1 }}>
    ✉{id}
    <span className="ml-1 text-[8px]">{tag}</span>
  </motion.div>
);

const CLI = ({ logs }: { logs: string[] }) => (
  <div className="bg-black text-green-400 text-xs font-mono h-32 overflow-y-scroll mt-4 p-2">
    {logs.map((log, i) => (
      <div key={i}>{log}</div>
    ))}
  </div>
);

export default function Page() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [tick, setTick] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const audioValid = useRef<HTMLAudioElement | null>(null);
  const audioInvalid = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioValid.current = new Audio("/valid.mp3");
    audioInvalid.current = new Audio("/invalid.mp3");
  }, []);

  useEffect(() => {
    if (!isRunning || tick >= 2000) return;
    const interval = setInterval(() => {
      const id = tick + 1;
      const isBad = id % 4 === 0 || id % 7 === 0;
      const hashed = !isBad;
      const tag = ["Link 11", "Link 16", "Link 22"][Math.floor(Math.random() * 3)];
      const delay = 1000;
      const logMsg = `Generated Message ✉${id} with ${tag}`;

      const newMsg: MessageType = {
        id,
        hashed,
        failed: false,
        tag,
        x: 320,
        y: 20,
      };

      setMessages((prev) => [...prev, newMsg]);
      setLogs((prev) => [logMsg, ...prev]);
      setTick((t) => t + 1);

      const route = async () => {
        await new Promise((r) => setTimeout(r, delay));
        setMessages((prev) =>
          prev.map((msg) => (msg.id === id ? { ...msg, x: 160, y: 160 } : msg))
        );
        setLogs((prev) => [`Sent ✉${id} to Blockchain`, ...prev]);

        await new Promise((r) => setTimeout(r, delay));
        if (hashed) audioValid.current?.play();
        else audioInvalid.current?.play();

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === id ? { ...msg, x: 120, y: 400, failed: !hashed } : msg
          )
        );

        setLogs((prev) =>
          hashed
            ? [`Received tokenized ✉${id} with hash`, ...prev]
            : [`✉${id} failed tokenization`, ...prev]
        );
      };

      route();
    }, 120);
    return () => clearInterval(interval);
  }, [tick, isRunning]);

  return (
    <div className="relative w-full h-[600px] bg-gray-100 overflow-hidden p-2">
      <SourceHex />
      <BlockchainBlock />
      <ULSBlock id={1} />
      <ULSBlock id={2} />
      <ULSBlock id={3} />
      <ULSBlock id={4} />

      {messages.map((msg) => (
        <Message key={msg.id} {...msg} />
      ))}

      <div className="absolute top-4 right-4 flex gap-2">
        <button onClick={() => setIsRunning(!isRunning)} className="bg-blue-600 text-white px-3 py-1 rounded">
          {isRunning ? "Pause" : "Start"}
        </button>
        <button onClick={() => {
          setIsRunning(false);
          setMessages([]);
          setTick(0);
          setLogs([]);
        }} className="border px-3 py-1 rounded">
          Reset
        </button>
      </div>

      <div className="absolute left-2 top-1/2 bg-white p-1 border text-xs rounded">
        <div>🔵 = Pure Message</div>
        <div>🟢 = Tokenized Message</div>
        <div>🔴 = Rejected Message</div>
      </div>

      <CLI logs={logs} />

      <audio src="/valid.mp3" ref={audioValid} />
      <audio src="/invalid.mp3" ref={audioInvalid} />
    </div>
  );
}
