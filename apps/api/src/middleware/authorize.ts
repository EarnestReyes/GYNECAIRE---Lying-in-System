
import type { Response, NextFunction } from "express";
import { pool } from "../config/database.js";
import type { AuthenticatedRequest } from "./authenticate.js";

export type StaffRole =
  | "admin"
  | "midwife"
  | "nurse"
  | "receptionist";

export function requireStaff(...allowedRoles: StaffRole[]) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.authUserId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    try {
      const result = await pool.query(
        `
        SELECT s.staff_role
        FROM staff_members s
        JOIN profiles p ON p.id = s.profile_id
        WHERE s.profile_id = $1
          AND s.is_active = TRUE
          AND p.account_type IN ('staff', 'admin')
        LIMIT 1
        `,
        [req.authUserId]
      );

      if (result.rowCount === 0) {
        res.status(403).json({
          error: "Staff access required",
        });
        return;
      }

      const role = result.rows[0].staff_role as StaffRole;

      if (!allowedRoles.includes(role)) {
        res.status(403).json({
          error: "Insufficient permissions",
        });
        return;
      }

      next();
    } catch (error) {
      console.error("Staff authorization failed:", error);

      res.status(500).json({
        error: "Unable to verify permissions",
      });
    }
  };
}
