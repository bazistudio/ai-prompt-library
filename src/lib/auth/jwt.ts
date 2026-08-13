import { SignJWT, jwtVerify } from "jose";
import { env } from "@/config/env";

const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);

export interface SessionPayload {
  userId: string;
  email: string;
  username: string;
  [key: string]: unknown;
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function decrypt(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
