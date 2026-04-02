// src/lib/utils.ts

import {
  startOfQuarter,
  endOfQuarter,
  eachDayOfInterval,
  isWeekend,
  format,
} from "date-fns";

export const getQuarterRange = (date: Date) => {
  return {
    start: startOfQuarter(date),
    end: endOfQuarter(date),
  };
};

export const getWorkingDays = (start: Date, end: Date) => {
  const days = eachDayOfInterval({ start, end });
  return days.filter((d) => !isWeekend(d));
};

export const formatDate = (date: Date) => {
  return format(date, "yyyy-MM-dd");
};

export const displayDate = (date: Date) => {
  return {
    day: format(date, "d MMMM"),
    weekday: format(date, "EEEE"),
  };
};