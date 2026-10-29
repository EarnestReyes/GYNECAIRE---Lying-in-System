
import type { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";

const supabaseUrl =
  process.env.SUPABASE_URL ??
  "https://egywyonhxhguyvbtfmir.supabase.co";

const issuer = `${supabaseUrl.replace(/\/$/, "")}/auth/v1`;

const JWKS = createRemoteJWKSet(
  new URL(`${issuer}/.well-known/jwks.json`)
);

export interface AuthenticatedRequest extends Request {
  authUserId?: string;
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Authentication required",
    });
    return;
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    res.status(401).json({ error: "Missing access token" });
    return;
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer,
      audience: "authenticated",
    });

    if (
      typeof payload.sub !== "string" ||
      payload.role !== "authenticated"
    ) {
      res.status(401).json({ error: "Invalid access token" });
      return;
    }

    req.authUserId = payload.sub;
    next();
  } catch {
    res.status(401).json({
      error: "Invalid or expired access token",
    });
  }
}
