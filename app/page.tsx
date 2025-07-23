"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const ULSInstance = ({ id, validated }: { id: number; validated: boolean }) => (
  <div className={`border-2 rounded p-4 text-center w-40 h-24 ${validated ? "border-green-600" : "border-red-600"}`}>
    <div className="font-bold">ULS-{id}</div>
    <div className="text-xs">{validated ? "Validating..." : "Rejected"}</div>
  </div>
);

const Message = ({ id, hashed, failed, x, y }: { id: number; hashed: boolean; failed: boolean; x: number; y: number }) => (
  <motion.div
    className={`absolute w-10 h-6 text-xs text-white flex items-center justify-center rounded shadow ${
      failed ? "bg-red-500" : hashed ? "bg-green-500" : "bg-blue-500"
    }`}
    animate={{ x, y }}
    transition={{ duration: 1 }}>
    ✉{id}
  </motion.div>
);

const Blockchain = () => (
  <div className="w-52 h-24 bg-gray-900 text-white flex items-center justify-center rounded">
    <div className="text-center">
      <div className="font-bold">Blockchain</div>
      <div className="text-xs">(SCYTALYS Ledger)</div>
    </div>
  </div>
);

export default function ULSFlowSimulator() {
  const [messages, setMessages] = useState<{ id: number; hashed: boolean; failed: boolean; x: number; y: number }[]>([]);
  const [tick, setTick] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const handleToggle = () => setIsRunning(!isRunning);
  const handleReset = () => {
    setMessages([]);
    setTick(0);
    setIsRunning(false);
  };

  useEffect(() => {
    if (!isRunning || tick >= 50) return;
    const interval = setInterval(() => {
      const isBad = (tick + 1) % 4 === 0 || (tick + 1) % 7 === 0;
      const id = tick + 1;
      const hashed = !isBad;
      const delay = 1000;

      const newMsg = {
        id,
        hashed,
        failed: false,
        x: 100,
        y: 80,
      };

      setMessages((prev) => [...prev, newMsg]);
      setTick((t) => t + 1);

      setTimeout(() => setMessages(prev => prev.map(m => m.id === id ? { ...m, x: 300 } : m)), delay);
      setTimeout(() => setMessages(prev => prev.map(m => m.id === id ? { ...m, x: 500, y: 40 } : m)), delay + 1000);
      setTimeout(() => setMessages(prev => prev.map(m => m.id === id ? { ...m, x: 700, y: 20, failed: !m.hashed } : m)), delay + 2000);
      setTimeout(() => setMessages(prev => prev.map(m => m.id === id ? { ...m, x: 900, y: 60, failed: !m.hashed } : m)), delay + 3000);
    }, 1500);
    return () => clearInterval(interval);
  }, [tick, isRunning]);

  return (
    <div className="p-4 relative h-[480px] overflow-hidden">
      <div className="flex justify-between mb-4">
        <ULSInstance id={1} validated={true} />
        <Blockchain />
        <ULSInstance id={2} validated={true} />
        <ULSInstance id={3} validated={true} />
      </div>
      {messages.map((msg) => (
        <Message key={msg.id} {...msg} />
      ))}
      <div className="absolute bottom-4 left-4 space-x-4">
        <button className="bg-blue-600 text-white px-4 py-1 rounded" onClick={handleToggle}>
          {isRunning ? "Pause" : "Start"}
        </button>
        <button className="border px-4 py-1 rounded" onClick={handleReset}>Reset</button>
      </div>
    </div>
  );
}
