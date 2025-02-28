import type { ToolContext } from "./context.ts";
import type { ToolHandle } from "./handle.ts";

/**
 * A Tool Handle protocol handler.
 *
 * @category Protocol
 */
export interface ProtocolHandler {
  /**
   * The name of the protocol handler.
   */
  readonly name: string;

  /**
   * Executes a Tool Handle using this protocol handler.
   */
  execute(
    context: ToolContext,
    handle: ToolHandle,
    args: unknown,
  ): Promise<unknown>;
}
