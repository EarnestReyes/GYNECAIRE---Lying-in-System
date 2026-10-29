
import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requireStaff } from "../middleware/authorize.js";

const router = Router();

router.get(
  "/dashboard",
  authenticate,
  requireStaff("admin", "midwife", "nurse", "receptionist"),
  (_req, res) => {
    res.json({
      message: "Authorized GYNECAIRE staff access",
    });
  }
);

export default router;
