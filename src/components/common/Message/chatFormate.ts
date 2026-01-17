import { parseISO, format } from "date-fns";
import { errorHandler, commonLabels } from "@/components/constants/Common";

export const chatFormate = (dateString?: string): string => {
  if (!dateString) {
    return commonLabels.today; // Default to Today if no date
  }

  try {
    // Parse the ISO date string - parseISO converts UTC to local time
    const inputDate = parseISO(dateString);
    const now = new Date();

    // Get local date components (year, month, day) for accurate day comparison
    // This ensures we compare calendar days, not timestamps
    const inputYear = inputDate.getFullYear();
    const inputMonth = inputDate.getMonth();
    const inputDay = inputDate.getDate();

    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();
    const nowDay = now.getDate();

    // Calculate yesterday's date
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayYear = yesterday.getFullYear();
    const yesterdayMonth = yesterday.getMonth();
    const yesterdayDay = yesterday.getDate();

    // Check if it's today (same calendar day in local timezone)
    if (
      inputYear === nowYear &&
      inputMonth === nowMonth &&
      inputDay === nowDay
    ) {
      return commonLabels.today;
    }

    // Check if it's yesterday (previous calendar day in local timezone)
    if (
      inputYear === yesterdayYear &&
      inputMonth === yesterdayMonth &&
      inputDay === yesterdayDay
    ) {
      return commonLabels.yesterday;
    }

    // For older messages, use "DD MMM" format (e.g., "08 Jan")
    return format(inputDate, "dd MMM");
  } catch (error) {
    errorHandler(error);
    return commonLabels.today; // Default to Today on error
  }
};
