import { parseTemplate } from "tool-form";
import { decodeContent } from "tool-handle";
import type { HttpContext } from "./context.ts";

/**
 * Tool Form templates for HTTP responses by status code.
 *
 * @category Handle
 */
export interface HttpResponsesTemplates {
  /**
   * Mapping from HTTP status codes to Tool Form templates.
   */
  readonly [code: string]: unknown | undefined;
}

/**
 * Transforms a fetch response by a Tool Form response template.
 *
 * @category Handle
 */
export async function transformHttpResponse(
  context: HttpContext,
  templates: HttpResponsesTemplates | undefined,
  response: Response,
): Promise<unknown> {
  // Decode the response body.
  const body = await decodeContent(
    response.body,
    response.headers.get("Content-Type"),
    context,
  );

  // Select the appropriate template.
  const template =
    templates?.[response.status] ??
    templates?.[String(response.status)[0] + "xx"] ??
    templates?.default;
  if (template === undefined) {
    return body;
  }

  // Transform the response.
  const responseTemplate = await parseTemplate(template, context);
  return await responseTemplate.transform({
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    body,
  });
}
