import type { ToolHandle } from "tool-handle";
import type { HttpRequestTemplate } from "./request.ts";
import type { HttpResponsesTemplates } from "./response.ts";

/**
 * An HTTP Tool Handle.
 *
 * @category Handle
 */
export interface HttpHandle extends ToolHandle {
  /**
   * Requires the `"http"` tool handler.
   * @override
   */
  readonly handler: "http";

  /**
   * Template for the HTTP request.
   */
  readonly request: HttpRequestTemplate;

  /**
   * Templates for the HTTP response.
   */
  readonly responses?: HttpResponsesTemplates | undefined;
}
