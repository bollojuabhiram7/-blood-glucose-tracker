import express from "express";

import authenticate from "../middleware/auth.middleware.js";

import {
  addReading,
  getReadings,
  updateReading,
  deleteReading,
} from "../controllers/reading.controller.js";

const router = express.Router();

router.use(authenticate);

router.post("/", addReading);
router.get("/", getReadings);
router.put("/:id", updateReading);
router.delete("/:id", deleteReading);

export default router;