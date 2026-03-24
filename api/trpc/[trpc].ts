import "../../server/_core/loadEnv";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { IncomingMessage, ServerResponse } from "http";
import { appRouter } from "../../server/routers";
import { resolveUserFromAuthHeader } from "../../server/_core/context";

export const config = {
  runtime: "nodejs",
};

function toRequest(req: VercelRequest): Request {
  const protocol = (req.headers["x-forwarded-proto"] as string | undefined) ?? "https";
  const host = req.headers.host ?? "localhost";
  const url = new URL(req.url ?? "/", `${protocol}://${host}`);

  const headers = new Headers();
  Object.entries(req.headers).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => headers.append(key, item));
    } else if (value !== undefined) {
      headers.set(key, value);
    }
  });

  const method = req.method ?? "GET";
  const body =
    method === "GET" || method === "HEAD"
      ? undefined
      : typeof req.body === "string" || req.body instanceof Buffer
        ? req.body
        : req.body !== undefined
          ? JSON.stringify(req.body)
          : undefined;

  return new Request(url, {
    method,
    headers,
    body,
  });
}

type VercelLikeRequest = IncomingMessage & {
  url?: string;
  method?: string;
  body?: unknown;
  headers: IncomingMessage["headers"];
};

type VercelLikeResponse = ServerResponse<IncomingMessage> & {
  send: (body: Buffer | string) => void;
};

export default async function handler(req: VercelLikeRequest, res: VercelLikeResponse) {
  const request = toRequest(req);

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: async () => ({
      req,
      res,
      user: await resolveUserFromAuthHeader(req.headers.authorization),
    }),
    onError({ error, path }: { error: unknown; path: string | undefined }) {
      console.error(`[tRPC] ${path ?? "<unknown>"} failed:`, error);
    },
  });

  res.status(response.status);
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const arrayBuffer = await response.arrayBuffer();
  res.send(Buffer.from(arrayBuffer));
}
