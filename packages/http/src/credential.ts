import type { CredentialObject } from "tool-handle";
import { ToolError } from "tool-handle";

/**
 * Tool Handle HTTP credential object.
 *
 * @category Security
 */
export interface HttpCredentialObject extends CredentialObject {
  /**
   * Applies to the `"http"` security scheme.
   */
  readonly scheme: "http";

  /**
   * Headers to inject into the request.
   */
  readonly headers?: { readonly [name: string]: string } | undefined;

  /**
   * Query parameters to inject into the request URL.
   */
  readonly query?: { readonly [name: string]: string } | undefined;

  /**
   * Cookies to inject into the request.
   */
  readonly cookies?: { readonly [name: string]: string } | undefined;
}

/**
 * Applies HTTP credentials to a request.
 *
 * @category Security
 * @internal
 */
export function applyHttpCredentials(
  request: Request,
  credentials: HttpCredentialObject,
): Request {
  const url = new URL(request.url);
  const headers = new Headers(request.headers);

  if (credentials.headers !== undefined) {
    for (const [name, value] of Object.entries(credentials.headers)) {
      headers.set(name, value);
    }
  }

  if (credentials.query !== undefined) {
    for (const [name, value] of Object.entries(credentials.query)) {
      url.searchParams.append(name, value);
    }
  }

  if (credentials.cookies !== undefined) {
    let cookies = headers.get("Cookie") ?? "";
    for (const [name, value] of Object.entries(credentials.cookies)) {
      // Cookie names must consist of visible ASCII chars except control chars,
      // whitespace, double quote, comma, semicolon, and backslash
      if (/[^\x21\x23-\x2B\x2D-\x3A\x3C-\x5B\x5D-\x7E]/.test(name)) {
        throw new ToolError("Invalid cookie name: " + JSON.stringify(name));
      }
      if (cookies.length !== 0) {
        cookies += "; ";
      }
      cookies += name + "=" + encodeURIComponent(value);
    }
    if (cookies.length !== 0) {
      headers.set("Cookie", cookies);
    }
  }

  return new Request(url.toString(), { ...request, headers });
}
