/**
 * Applications domain - LLM-driven helpers around an application record.
 *
 * The CRUD lives in `db/applications.ts`. This module owns the higher-level
 * operations that pair an application with the LLM (extract job posting,
 * assess profile fit).
 */

export { extractJobData } from './services/extraction.service';
export { assessFit } from './services/fit.service';
