import type { SecurityScheme, SecurityObject } from "tool-handle";

/**
 * Tool Handle HTTP security scheme configuration.
 *
 * @category Security
 */
export interface HttpSecurityObject extends SecurityObject {
  /**
   * Configures the `"http"` security scheme.
   */
  readonly scheme: "http";

  /**
   * The authentication method to use for the request.
   */
  readonly method: string;

  /**
   * The name of the credential to use for the request.
   */
  readonly secret: string;
}

/**
 * Tool Handle HTTP security scheme.
 *
 * @category Security
 */
export interface HttpSecurityScheme extends SecurityScheme {
  readonly name: "http";
}

/**
 * Tool Handle HTTP security scheme implementation.
 *
 * @category Security
 */
export const httpSecurityScheme: HttpSecurityScheme = {
  name: "http",
};
