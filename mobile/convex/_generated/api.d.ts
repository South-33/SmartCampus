/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accessLogs from "../accessLogs.js";
import type * as auth from "../auth.js";
import type * as classes from "../classes.js";
import type * as devices from "../devices.js";
import type * as hardware from "../hardware.js";
import type * as http from "../http.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as rooms from "../rooms.js";
import type * as seed from "../seed.js";
import type * as staffTasks from "../staffTasks.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accessLogs: typeof accessLogs;
  auth: typeof auth;
  classes: typeof classes;
  devices: typeof devices;
  hardware: typeof hardware;
  http: typeof http;
  "lib/permissions": typeof lib_permissions;
  rooms: typeof rooms;
  seed: typeof seed;
  staffTasks: typeof staffTasks;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
