import express from "express";
import authenticate from "../middleware/auth.middleware.js";

import {
  getDailyReport,
  getMonthToDateReport,
  getPreviousMonthReport,
} from "../controllers/report.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/daily", getDailyReport);
router.get("/month-to-date", getMonthToDateReport);
router.get("/previous-month", getPreviousMonthReport);

export default router;