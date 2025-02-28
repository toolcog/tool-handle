import { isObject, Payload, currentLocation } from "tool-json";
import { parseTemplate } from "tool-form";
import { ToolError } from "tool-handle";
import type { HttpContext } from "./context.ts";

/**
 * A Tool Form template for HTTP requests.
 *
 * @category Handle
 */
export interface HttpRequestTemplate {
  /**
   * Template for the HTTP method to use.
   */
  readonly method?: unknown | undefined;

  /**
   * Template for the URL to request.
   */
  readonly url?: unknown | undefined;

  /**
   * Template for additional headers to include in the request.
   */
  readonly headers?: unknown | undefined;

  /**
   * Template for the request body.
   */
  readonly body?: unknown | undefined;
}

/**
 * Transforms a Tool Form request template into a fetch request.
 *
 * @category Handle
 */
export async function transformHttpRequest(
  context: HttpContext,
  template: HttpRequestTemplate,
  args: unknown,
): Promise<Request> {
  const requestTemplate = await parseTemplate(template, context);
  const requestForm = await requestTemplate.transform(args);
  if (!isObject(requestForm)) {
    throw new ToolError(
      "Invalid request template: " + JSON.stringify(requestForm),
      { location: currentLocation(context) },
    );
  }

  const method = requestForm.method ?? "GET";
  if (typeof method !== "string") {
    throw new ToolError("Invalid request method: " + JSON.stringify(method), {
      location: currentLocation(context),
    });
  }

  const url = requestForm.url;
  if (typeof url !== "string") {
    throw new ToolError("Invalid request URL: " + JSON.stringify(url), {
      location: currentLocation(context),
    });
  }

  let headers = requestForm.headers as HeadersInit; // | undefined
  if (isObject(headers)) {
    for (const [name, value] of Object.entries(headers)) {
      if (typeof value !== "string") {
        throw new ToolError(
          "Invalid request header " +
            JSON.stringify(name) +
            ": " +
            JSON.stringify(value),
          { location: currentLocation(context) },
        );
      }
    }
  } else if (headers !== undefined) {
    throw new ToolError("Invalid request headers: " + JSON.stringify(headers), {
      location: currentLocation(context),
    });
  }

  let body = (requestForm.body ?? null) as Payload | BodyInit | null;
  if (body instanceof Payload) {
    headers = { ...headers, ...body.headers };
    body = body.value as BodyInit | null;
  }

  return new Request(url, { method, headers, body });
}
