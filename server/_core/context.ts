import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { getUserFromAccessToken, type AppUser } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: AppUser | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const user = await resolveUserFromAuthHeader(opts.req.headers.authorization);

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}

export async function resolveUserFromAuthHeader(
  authorizationHeader: string | string[] | undefined
): Promise<AppUser | null> {
  let user: AppUser | null = null;

  try {
    const authHeader = Array.isArray(authorizationHeader)
      ? authorizationHeader[0]
      : authorizationHeader;
    const accessToken =
      typeof authHeader === "string" && authHeader.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length)
        : "";
    user = await getUserFromAccessToken(accessToken);
  } catch {
    // Authentication is optional for public procedures.
    user = null;
  }

  return user;
}
