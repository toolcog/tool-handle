import type { ToolContext } from "./context.ts";
import type { ToolHandle } from "./handle.ts";

/**
 * A handler for a Tool Handle.
 *
 * @category Protocol
 */
export interface ToolHandler {
  /**
   * The name of the tool handler.
   */
  readonly name: string;

  /**
   * Executes a Tool Handle.
   */
  execute(
    context: ToolContext,
    handle: ToolHandle,
    args: unknown,
  ): Promise<unknown>;
}
