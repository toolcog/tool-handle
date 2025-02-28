import type { ToolContext, ToolContextOptions } from "tool-handle";
import { createToolContext } from "tool-handle";
import type { HttpHandle } from "./handle.ts";

/**
 * A context for HTTP Handle execution.
 *
 * @category Context
 */
export interface HttpContext extends ToolContext {
  /**
   * Options to apply to `fetch` requests.
   */
  fetchOptions?:
    | RequestInit
    | ((
        request: Request,
        handle: HttpHandle,
      ) => Promise<RequestInit> | RequestInit | undefined)
    | undefined;
}

/**
 * Options for configuring an HTTP context.
 *
 * @category Context
 */
export interface HttpContextOptions extends ToolContextOptions {
  /**
   * Additional options to apply to `fetch` requests.
   */
  fetchOptions?:
    | RequestInit
    | ((
        request: Request,
        handle: HttpHandle,
      ) => Promise<RequestInit> | RequestInit | undefined)
    | undefined;
}

/**
 * Initializes a context for HTTP Handle execution.
 *
 * @category Context
 */
export function initHttpContext(
  context: ToolContext & Partial<HttpContext>,
  options?: HttpContextOptions,
): HttpContext {
  // Minimize mixin shape variation.
  if (!("fetchOptions" in context)) {
    context.fetchOptions = undefined;
  }

  if (options?.fetchOptions !== undefined) {
    context.fetchOptions = options.fetchOptions;
  }

  return context as HttpContext;
}

/**
 * Creates a new shared context for HTTP Handle execution.
 *
 * @category Context
 */
export function createHttpContext(options?: HttpContextOptions): HttpContext {
  return initHttpContext(createToolContext(options), options);
}
