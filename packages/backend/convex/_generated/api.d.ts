/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as functions_courts_mutations from "../functions/courts/mutations.js";
import type * as functions_courts_queries from "../functions/courts/queries.js";
import type * as functions_finances_index from "../functions/finances/index.js";
import type * as functions_finances_queries from "../functions/finances/queries.js";
import type * as functions_reservations_mutations from "../functions/reservations/mutations.js";
import type * as functions_reservations_queries from "../functions/reservations/queries.js";
import type * as functions_reservations_series from "../functions/reservations/series.js";
import type * as functions_users_mutations from "../functions/users/mutations.js";
import type * as functions_users_queries from "../functions/users/queries.js";
import type * as functions_users_sync from "../functions/users/sync.js";
import type * as functions_venues_mutations from "../functions/venues/mutations.js";
import type * as functions_venues_queries from "../functions/venues/queries.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_conflicts from "../lib/conflicts.js";
import type * as lib_dates from "../lib/dates.js";
import type * as lib_payments from "../lib/payments.js";
import type * as lib_recurrence from "../lib/recurrence.js";
import type * as lib_schedule from "../lib/schedule.js";
import type * as lib_time from "../lib/time.js";
import type * as lib_users from "../lib/users.js";
import type * as lib_venueAccess from "../lib/venueAccess.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "functions/courts/mutations": typeof functions_courts_mutations;
  "functions/courts/queries": typeof functions_courts_queries;
  "functions/finances/index": typeof functions_finances_index;
  "functions/finances/queries": typeof functions_finances_queries;
  "functions/reservations/mutations": typeof functions_reservations_mutations;
  "functions/reservations/queries": typeof functions_reservations_queries;
  "functions/reservations/series": typeof functions_reservations_series;
  "functions/users/mutations": typeof functions_users_mutations;
  "functions/users/queries": typeof functions_users_queries;
  "functions/users/sync": typeof functions_users_sync;
  "functions/venues/mutations": typeof functions_venues_mutations;
  "functions/venues/queries": typeof functions_venues_queries;
  "lib/auth": typeof lib_auth;
  "lib/conflicts": typeof lib_conflicts;
  "lib/dates": typeof lib_dates;
  "lib/payments": typeof lib_payments;
  "lib/recurrence": typeof lib_recurrence;
  "lib/schedule": typeof lib_schedule;
  "lib/time": typeof lib_time;
  "lib/users": typeof lib_users;
  "lib/venueAccess": typeof lib_venueAccess;
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
