/**
 * A Tool Handle security scheme configuration.
 *
 * @category Security
 */
export interface SecurityObject {
  /**
   * The name of the configured security scheme.
   */
  readonly scheme: string;
}

/**
 * A Tool Handle security scheme.
 *
 * @category Security
 */
export interface SecurityScheme {
  /**
   * The name of the security scheme.
   */
  readonly name: string;
}
