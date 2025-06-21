import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date string to locale date string
 * Handles both ISO strings and date objects consistently
 */
export function formatDate(dateString: string | Date): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    console.warn('Invalid date provided to formatDate:', dateString);
    return 'Invalid Date';
  }
  return date.toLocaleDateString();
}

/**
 * Format date with relative time (Today, Tomorrow, etc.)
 */
export function formatDateRelative(dateString: string | Date): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    console.warn('Invalid date provided to formatDateRelative:', dateString);
    return 'Invalid Date';
  }

  const now = new Date();
  // Reset time to start of day for accurate day comparison
  const dateAtMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = dateAtMidnight.getTime() - nowAtMidnight.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

  return date.toLocaleDateString();
}
