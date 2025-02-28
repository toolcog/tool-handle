import type { ToolContext } from "./context.ts";
import type { ToolHandle } from "./handle.ts";

/**
 * A Tool Handle credential object.
 *
 * @category Security
 */
export interface CredentialObject {
  /**
   * The name of the security scheme to which the credentials apply.
   */
  readonly scheme: string;
}

/**
 * A function that resolves credentials for a tool.
 *
 * @category Security
 */
export type CredentialResolver = (
  handle: ToolHandle,
  context: ToolContext,
) => Promise<CredentialObject | undefined>;
