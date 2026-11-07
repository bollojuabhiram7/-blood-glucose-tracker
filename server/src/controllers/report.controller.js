import { z } from "zod";
import prisma from "../config/prisma.js";

const dateSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  "Date must be in YYYY-MM-DD format"
);

function getDateRange(dateString, type) {
  const [year, month, day] = dateString.split("-").map(Number);

  const selectedDate = new Date(Date.UTC(year, month - 1, day));

  // Reject impossible dates such as 2026-02-30
  if (
    selectedDate.getUTCFullYear() !== year ||
    selectedDate.getUTCMonth() !== month - 1 ||
    selectedDate.getUTCDate() !== day
  ) {
    return null;
  }

  if (type === "daily") {
    const end = new Date(selectedDate);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start: selectedDate, end };
  }

  if (type === "month-to-date") {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(selectedDate);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
  }

  // Previous full calendar month
  const start = new Date(Date.UTC(year, month - 2, 1));
  const end = new Date(Date.UTC(year, month - 1, 1));

  return { start, end };
}

async function generateReport(req, res, type) {
  try {
    const parsedDate = dateSchema.safeParse(req.query.date);

    if (!parsedDate.success) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid date in YYYY-MM-DD format",
      });
    }

    const range = getDateRange(parsedDate.data, type);

    if (!range) {
      return res.status(400).json({
        success: false,
        message: "Invalid calendar date",
      });
    }

    const readings = await prisma.glucoseReading.findMany({
      where: {
        userId: req.user.userId,
        date: {
          gte: range.start,
          lt: range.end,
        },
      },
      orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
    });

    const values = readings.map((reading) => reading.value);

    const count = values.length;
    const highest = count ? Math.max(...values) : null;
    const lowest = count ? Math.min(...values) : null;
    const average = count
      ? Number((values.reduce((sum, value) => sum + value, 0) / count).toFixed(1))
      : null;

    return res.status(200).json({
      success: true,
      reportType: type,
      period: {
        startDate: range.start.toISOString().slice(0, 10),
        endDate: new Date(range.end.getTime() - 86400000)
          .toISOString()
          .slice(0, 10),
      },
      summary: {
        highest,
        lowest,
        average,
        count,
      },
      readings,
      empty: count === 0,
    });
  } catch (error) {
    console.error("Report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate report",
    });
  }
}

export const getDailyReport = (req, res) =>
  generateReport(req, res, "daily");

export const getMonthToDateReport = (req, res) =>
  generateReport(req, res, "month-to-date");

export const getPreviousMonthReport = (req, res) =>
  generateReport(req, res, "previous-month");