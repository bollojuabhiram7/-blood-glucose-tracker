import { z } from "zod";
import prisma from "../config/prisma.js";

const slots = [
  "MORNING",
  "AFTER_BREAKFAST",
  "AFTER_LUNCH",
  "AFTER_DINNER",
];

const readingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  timeSlot: z.enum(slots),
  value: z.number().int().min(40).max(600),
});

function getTodayDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.APP_TIME_ZONE || "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// ADD READING
export const addReading = async (req, res) => {
  try {
    const validation = readingSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid reading details",
        errors: validation.error.issues.map((issue) => issue.message),
      });
    }

    const { date, timeSlot, value } = validation.data;

    const parsedDate = new Date(`${date}T00:00:00.000Z`);

    if (
      parsedDate.toISOString().slice(0, 10) !== date
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid date",
      });
    }

    if (date > getTodayDate()) {
      return res.status(400).json({
        success: false,
        message: "Future dates are not allowed",
      });
    }

    const userId = req.user.userId;

    const existing = await prisma.glucoseReading.findUnique({
      where: {
        userId_date_timeSlot: {
          userId,
          date: parsedDate,
          timeSlot,
        },
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A reading already exists for this time slot",
      });
    }

    const count = await prisma.glucoseReading.count({
      where: {
        userId,
        date: parsedDate,
      },
    });

    if (count >= 4) {
      return res.status(409).json({
        success: false,
        message: "Maximum 4 readings allowed per day",
      });
    }

    const reading = await prisma.glucoseReading.create({
      data: {
        userId,
        date: parsedDate,
        timeSlot,
        value,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Glucose reading added successfully",
      reading,
    });
  } catch (error) {
    console.error("Add reading error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Reading already exists for this time slot",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to add glucose reading",
    });
  }
};

// GET ALL READINGS FOR LOGGED-IN USER
export const getReadings = async (req, res) => {
  try {
    const readings = await prisma.glucoseReading.findMany({
      where: {
        userId: req.user.userId,
      },
      orderBy: [
        { date: "desc" },
        { createdAt: "desc" },
      ],
    });

    return res.status(200).json({
      success: true,
      count: readings.length,
      readings,
    });
  } catch (error) {
    console.error("Get readings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch readings",
    });
  }
};

// UPDATE READING
export const updateReading = async (req, res) => {
  try {
    const validation = readingSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid reading details",
        errors: validation.error.issues.map((issue) => issue.message),
      });
    }

    const { date, timeSlot, value } = validation.data;
    const parsedDate = new Date(`${date}T00:00:00.000Z`);
    const userId = req.user.userId;
    const readingId = req.params.id;

    if (
      parsedDate.toISOString().slice(0, 10) !== date ||
      date > getTodayDate()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or future date",
      });
    }

    const existing = await prisma.glucoseReading.findFirst({
      where: {
        id: readingId,
        userId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Reading not found",
      });
    }

    const duplicate = await prisma.glucoseReading.findFirst({
      where: {
        userId,
        date: parsedDate,
        timeSlot,
        NOT: { id: readingId },
      },
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "A reading already exists for this time slot",
      });
    }

    const reading = await prisma.glucoseReading.update({
      where: { id: readingId },
      data: {
        date: parsedDate,
        timeSlot,
        value,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Reading updated successfully",
      reading,
    });
  } catch (error) {
    console.error("Update reading error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update reading",
    });
  }
};

// DELETE READING
export const deleteReading = async (req, res) => {
  try {
    const reading = await prisma.glucoseReading.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.userId,
      },
    });

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: "Reading not found",
      });
    }

    await prisma.glucoseReading.delete({
      where: { id: reading.id },
    });

    return res.status(200).json({
      success: true,
      message: "Reading deleted successfully",
    });
  } catch (error) {
    console.error("Delete reading error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete reading",
    });
  }
};