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
   * The protocol handler used by the tool.
   */
  readonly protocol: string;
}

/**
 * Executes a Tool Handle with its specified protocol handler.
 *
 * @category Handle
 */
export function executeToolHandle(
  context: ToolContext,
  handle: ToolHandle,
  args: unknown,
): Promise<unknown> {
  const handler = context.protocolHandlers?.[handle.protocol];
  if (handler === undefined) {
    throw new ToolError(
      "Unknown protocol handler: " + JSON.stringify(handle.protocol),
    );
  }

  return handler.execute(context, handle, args);
}
