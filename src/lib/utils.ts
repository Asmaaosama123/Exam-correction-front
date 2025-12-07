import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert Western numerals to Arabic numerals
 * @param num - Number to convert
 * @returns String with Arabic numerals
 */
function toArabicNumerals(num: number): string {
  const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(num)
    .split("")
    .map((digit) => arabicNumerals[parseInt(digit)] || digit)
    .join("");
}

/**
 * Format date in Arabic format with Arabic numerals
 * @param date - Date object to format
 * @returns Formatted date string in Arabic (YYYY-MM-DD_HH-MM-SS with Arabic numerals)
 */
export function formatArabicDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  
  // Format with Arabic numerals
  const yearStr = toArabicNumerals(year);
  const monthStr = String(month).padStart(2, "0").split("").map(d => toArabicNumerals(parseInt(d))).join("");
  const dayStr = String(day).padStart(2, "0").split("").map(d => toArabicNumerals(parseInt(d))).join("");
  const hoursStr = String(hours).padStart(2, "0").split("").map(d => toArabicNumerals(parseInt(d))).join("");
  const minutesStr = String(minutes).padStart(2, "0").split("").map(d => toArabicNumerals(parseInt(d))).join("");
  const secondsStr = String(seconds).padStart(2, "0").split("").map(d => toArabicNumerals(parseInt(d))).join("");
  
  return `${yearStr}-${monthStr}-${dayStr}_${hoursStr}-${minutesStr}-${secondsStr}`;
}

/**
 * Sanitize filename by removing invalid characters
 * @param filename - Filename to sanitize
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove invalid characters for filenames
  return filename
    .replace(/[<>:"/\\|?*]/g, "") // Remove invalid characters
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .trim();
}
