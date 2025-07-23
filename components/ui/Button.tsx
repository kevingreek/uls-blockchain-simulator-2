import React from "react";

export function Button({
  children,
  onClick,
  variant = "solid",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "solid" | "outline";
}) {
  const base = "px-4 py-2 rounded text-sm font-medium";
  const style =
    variant === "solid"
      ? "bg-blue-600 text-white hover:bg-blue-700"
      : "border border-gray-400 text-gray-700 bg-white hover:bg-gray-100";

  return (
    <button onClick={onClick} className={`${base} ${style}`}>
      {children}
    </button>
  );
}
