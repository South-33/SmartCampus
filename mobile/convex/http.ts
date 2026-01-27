import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { api } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

/**
 * Utility to extract hardware credentials.
 * Token is now expected in the Authorization header: Bearer <token>
 */
async function getHardwareCreds(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  if (request.method === "GET") {
    const url = new URL(request.url);
    return {
      chipId: url.searchParams.get("chipId"),
      token: token,
    };
  }
  
  const body = await request.json();
  return {
    chipId: body.chipId,
    token: token,
    payload: body,
  };
}

/**
 * GET /api/whitelist?chipId=XXX&token=YYY
 */
http.route({
  path: "/api/whitelist",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const { chipId, token } = await getHardwareCreds(request);
    if (!chipId || !token) return new Response("Missing credentials", { status: 400 });

    try {
      const data = await ctx.runQuery(api.hardware.getWhitelist, { chipId, token });
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e: any) {
      return new Response(e.message, { status: 401 });
    }
  }),
});

/**
 * POST /api/logs
 * Body: { chipId, token, logs: [...] }
 */
http.route({
  path: "/api/logs",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const { payload } = await getHardwareCreds(request);
      const result = await ctx.runMutation(api.hardware.syncLogs, payload);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e: any) {
      return new Response(e.message, { status: 401 });
    }
  }),
});

/**
 * POST /api/heartbeat
 * Body: { chipId, token, firmware }
 */
http.route({
  path: "/api/heartbeat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const { payload } = await getHardwareCreds(request);
      const result = await ctx.runMutation(api.hardware.heartbeat, payload);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e: any) {
      return new Response(e.message, { status: 401 });
    }
  }),
});

/**
 * POST /api/register
 * Body: { chipId }
 */
http.route({
  path: "/api/register",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const result = await ctx.runMutation(api.hardware.register, body);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e: any) {
      return new Response(e.message, { status: 400 });
    }
  }),
});

export default http;
