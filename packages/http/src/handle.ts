import type { ToolHandle } from "tool-handle";
import type { HttpRequestTemplate } from "./request.ts";
import type { HttpResponseTemplates } from "./response.ts";

/**
 * An HTTP Tool Handle.
 *
 * @category Handle
 */
export interface HttpHandle extends ToolHandle {
  /**
   * Requires the `"http"` protocol handler.
   * @override
   */
  readonly protocol: "http";

  /**
   * Template for the HTTP request.
   */
  readonly request: HttpRequestTemplate;

  /**
   * Templates for the HTTP response.
   */
  readonly response?: HttpResponseTemplates | undefined;
}
