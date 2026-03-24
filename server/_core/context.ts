import type { Request as ExpressRequest, Response as ExpressResponse } from "express";
import { getUserFromAccessToken, type AppUser } from "../db";

export type TrpcContext = {
  req: ExpressRequest;
  res: ExpressResponse;
  user: AppUser | null;
};

export async function createContext(
  opts: { req: ExpressRequest; res: ExpressResponse }
): Promise<TrpcContext> {
  const authorizationHeader = opts.req.header("authorization");
  const user = await resolveUserFromAuthHeader(authorizationHeader);

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
