import { ToolError } from "./error.ts";
import type { ToolContext } from "./context.ts";
import type { SecurityObject } from "./security.ts";

/**
 * A Tool Handle.
 *
 * @category Handle
 */
export interface ToolHandle {
  /**
   * The name of the tool.
   */
  readonly name: string;

  /**
   * A detailed description of the tool's purpose and behavior.
   */
  readonly description?: string | undefined;

  /**
   * A JSON Schema representing the tool's parameters.
   */
  readonly parameters?: object | undefined;

  /**
   * The security scheme configuration for the tool.
   */
  readonly security?: SecurityObject | undefined;

  /**
   * The handler used by the tool.
   */
  readonly handler: string;
}

/**
 * Executes a Tool Handle with its specified handler.
 *
 * @category Handle
 */
export function executeToolHandle(
  context: ToolContext,
  handle: ToolHandle,
  args: unknown,
): Promise<unknown> {
  const handler = context.toolHandlers?.[handle.handler];
  if (handler === undefined) {
    throw new ToolError(
      "Unknown tool handler: " + JSON.stringify(handle.handler),
    );
  }

  return handler.execute(context, handle, args);
}
