import React from "react";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded border border-gray-300 bg-white p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
