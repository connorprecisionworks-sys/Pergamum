import { Resend } from "resend";

/**
 * Null when RESEND_API_KEY is unset — every caller must check for this and
 * no-op cleanly (HOT-LEAD-HEAT-SPEC.md phase 2: "build it so it no-ops
 * cleanly if that env is absent"). Constructed lazily-but-once at module
 * load, never inside a request handler, so a missing key never throws
 * mid-request.
 */
export const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const EMAIL_FROM = "Prmpt <alerts@useprmpt.com>";
