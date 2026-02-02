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
    if (!chipId || !token) return new Response("Unauthorized", { status: 401 });

    try {
      const data = await ctx.runQuery(api.hardware.getWhitelist, { chipId, token });
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e: any) {
      // Log internally but don't expose error details to client
      return new Response("Unauthorized", { status: 401 });
    }
  }),
});

/**
 * POST /api/logs
 * Body: { chipId, logs: [...] }
 */
http.route({
  path: "/api/logs",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const { chipId, token, payload } = await getHardwareCreds(request);
      if (!chipId || !token) return new Response("Unauthorized", { status: 401 });
      
      const result = await ctx.runMutation(api.hardware.syncLogs, { 
        chipId, 
        token, 
        logs: payload.logs 
      });
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e: any) {
      // Log internally but don't expose error details to client
      return new Response("Unauthorized", { status: 401 });
    }
  }),
});

/**
 * POST /api/heartbeat
 * Body: { chipId, firmware }
 */
http.route({
  path: "/api/heartbeat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const { chipId, token, payload } = await getHardwareCreds(request);
      if (!chipId || !token) return new Response("Unauthorized", { status: 401 });

      const result = await ctx.runMutation(api.hardware.heartbeat, {
        chipId,
        token,
        firmware: payload.firmware
      });
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e: any) {
      // Log internally but don't expose error details to client
      return new Response("Unauthorized", { status: 401 });
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
      const result = await ctx.runMutation(api.hardware.register, { chipId: body.chipId });
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e: any) {
      // Don't leak internal error messages
      return new Response("Registration failed", { status: 400 });
    }
  }),
});

/**
 * GET /api/config
 * Returns system configuration (ESP-NOW secrets, debug mode) to authenticated devices
 */
http.route({
  path: "/api/config",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const { chipId, token } = await getHardwareCreds(request);
    if (!chipId || !token) return new Response("Unauthorized", { status: 401 });

    try {
      const data = await ctx.runQuery(api.hardware.getSystemConfig, { chipId, token });
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e: any) {
      return new Response("Unauthorized", { status: 401 });
    }
  }),
});

export default http;
