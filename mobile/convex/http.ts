import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { api } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

/**
 * GET /api/whitelist?chipId=XXX&token=YYY
 */
http.route({
  path: "/api/whitelist",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const chipId = url.searchParams.get("chipId");
    const token = url.searchParams.get("token");

    if (!chipId || !token) {
      return new Response("Missing credentials", { status: 400 });
    }

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
    const body = await request.json();
    try {
      const result = await ctx.runMutation(api.hardware.syncLogs, body);
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
    const body = await request.json();
    try {
      const result = await ctx.runMutation(api.hardware.heartbeat, body);
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
    const body = await request.json();
    try {
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
