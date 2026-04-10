import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getOrdinalSuffix(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return "";
  const num = typeof n === "string" ? parseInt(n) : n;
  if (isNaN(num)) return n.toString();
  
  const j = num % 10, k = num % 100;
  if (j === 1 && k !== 11) return num + "st";
  if (j === 2 && k !== 12) return num + "nd";
  if (j === 3 && k !== 13) return num + "rd";
  return num + "th";
}
