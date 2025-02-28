import type { ToolHandler } from "tool-handle";
import type { HttpContext } from "./context.ts";
import { transformHttpRequest } from "./request.ts";
import { transformHttpResponse } from "./response.ts";
import type { HttpHandle } from "./handle.ts";
import type { HttpCredentialObject } from "./credential.ts";
import { applyHttpCredentials } from "./credential.ts";

/**
 * Tool Handle HTTP handler.
 *
 * @category Protocol
 */
export interface HttpProtocolHandler extends ToolHandler {
  readonly name: "http";
}

/**
 * Tool Handle HTTP handler implementation.
 *
 * @category Protocol
 */
export const httpProtocolHandler: HttpProtocolHandler = {
  name: "http",

  async execute(
    context: HttpContext,
    handle: HttpHandle,
    args: unknown,
  ): Promise<unknown> {
    // Transform the arguments into a request.
    let request = await transformHttpRequest(context, handle.request, args);

    // Resolve credentials for the request.
    const credentials = await context.credentialResolver?.(handle, context);

    // Apply HTTP credentials to the request.
    if (credentials?.scheme === "http") {
      request = applyHttpCredentials(
        request,
        credentials as HttpCredentialObject,
      );
    }

    // Resolve additional fetch options for the request.
    let options: RequestInit | undefined;
    if (context.fetchOptions !== undefined) {
      if (typeof context.fetchOptions === "function") {
        options = await context.fetchOptions(request, handle);
      } else {
        options = context.fetchOptions;
      }
    }

    // Execute the request.
    const response = await fetch(request, options);

    // Transform the response into the final result.
    return transformHttpResponse(context, handle.responses, response);
  },
};
