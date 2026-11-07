import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "pb_session";

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters");
  }
  return new TextEncoder().encode(value);
}

export async function signSession(username: string, version: number) {
  return new SignJWT({ sub: username, ver: version })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function verifySession(token: string): Promise<{ username: string; version: number } | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    // Cookies issued before accounts moved to the database have no version: they count as 0.
    return typeof payload.sub === "string" ? { username: payload.sub, version: Number(payload.ver ?? 0) } : null;
  } catch {
    return null;
  }
}
