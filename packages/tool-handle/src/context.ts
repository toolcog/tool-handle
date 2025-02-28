import { isArray, initContext } from "tool-json";
import { initQueryContext } from "tool-query";
import type { FormContext, FormContextOptions } from "tool-form";
import { initFormContext, createFormContext } from "tool-form";
import type { ContentDecoder } from "./content.ts";
import { contentDecoders } from "./content.ts";
import type { ToolHandler } from "./handler.ts";
import type { SecurityScheme } from "./security.ts";
import type { CredentialResolver } from "./credential.ts";

/**
 * A context for Tool Handle execution.
 *
 * @category Context
 */
export interface ToolContext extends FormContext {
  /**
   * Supported content decoders.
   */
  contentDecoders: { readonly [type: string]: ContentDecoder } | undefined;

  /**
   * Supported tool handlers.
   */
  toolHandlers: { readonly [name: string]: ToolHandler } | undefined;

  /**
   * Supported security schemes.
   */
  securitySchemes: { readonly [name: string]: SecurityScheme } | undefined;

  /**
   * The function to use to resolve credentials.
   */
  credentialResolver: CredentialResolver | undefined;
}

/**
 * Options for configuring a tool context.
 *
 * @category Context
 */
export interface ToolContextOptions extends FormContextOptions {
  /**
   * Additional content decoders to support.
   */
  contentDecoders?:
    | readonly ContentDecoder[]
    | { readonly [type: string]: ContentDecoder }
    | undefined;

  /**
   * Additional protocol handlers to support.
   */
  toolHandlers?:
    | readonly ToolHandler[]
    | { readonly [name: string]: ToolHandler }
    | undefined;

  /**
   * Additional security schemes to support.
   */
  securitySchemes?:
    | readonly SecurityScheme[]
    | { readonly [name: string]: SecurityScheme }
    | undefined;

  /**
   * The function to use to resolve credentials.
   */
  credentialResolver?: CredentialResolver | undefined;
}

/**
 * Initializes a context for Tool Handle execution.
 *
 * @category Context
 */
export function initToolContext(
  context: FormContext & Partial<ToolContext>,
  options?: ToolContextOptions,
): ToolContext {
  // Minimize mixin shape variation.
  if (!("contentDecoders" in context)) {
    context.contentDecoders = contentDecoders;
  }
  if (!("toolHandlers" in context)) {
    context.toolHandlers = undefined;
  }
  if (!("securitySchemes" in context)) {
    context.securitySchemes = undefined;
  }
  if (!("credentialResolver" in context)) {
    context.credentialResolver = undefined;
  }

  // Configure additional content decoders.
  if (options?.contentDecoders !== undefined) {
    if (isArray(options.contentDecoders)) {
      const contentDecoders: Record<string, ContentDecoder> = {
        ...context.contentDecoders,
      };
      for (const contentDecoder of options.contentDecoders) {
        contentDecoders[contentDecoder.contentType] = contentDecoder;
      }
      context.contentDecoders = contentDecoders;
    } else if (context.contentDecoders !== undefined) {
      context.contentDecoders = {
        ...context.contentDecoders,
        ...options.contentDecoders,
      };
    } else {
      context.contentDecoders = options.contentDecoders;
    }
  }

  // Configure additional tool handlers.
  if (options?.toolHandlers !== undefined) {
    if (isArray(options.toolHandlers)) {
      const toolHandlers: Record<string, ToolHandler> = {
        ...context.toolHandlers,
      };
      for (const protocolHandler of options.toolHandlers) {
        toolHandlers[protocolHandler.name] = protocolHandler;
      }
      context.toolHandlers = toolHandlers;
    } else if (context.toolHandlers !== undefined) {
      context.toolHandlers = {
        ...context.toolHandlers,
        ...options.toolHandlers,
      };
    } else {
      context.toolHandlers = options.toolHandlers;
    }
  }

  // Configure additional security schemes.
  if (options?.securitySchemes !== undefined) {
    if (isArray(options.securitySchemes)) {
      const securitySchemes: Record<string, SecurityScheme> = {
        ...context.securitySchemes,
      };
      for (const securityScheme of options.securitySchemes) {
        securitySchemes[securityScheme.name] = securityScheme;
      }
      context.securitySchemes = securitySchemes;
    } else if (context.securitySchemes !== undefined) {
      context.securitySchemes = {
        ...context.securitySchemes,
        ...options.securitySchemes,
      };
    } else {
      context.securitySchemes = options.securitySchemes;
    }
  }

  return context as ToolContext;
}

/**
 * Creates a new shared context for Tool Handle execution.
 *
 * @category Context
 */
export function createToolContext(options?: ToolContextOptions): ToolContext {
  return initToolContext(createFormContext(options), options);
}

/**
 * Initializes a tool context with the specified options,
 * returning `options` itself if it's already a tool context.
 *
 * @category Context
 */
export function coerceToolContext(
  options?: ToolContextOptions | ToolContext,
): ToolContext {
  if (options !== undefined && "queryScope" in options) {
    return options;
  }

  return initToolContext(
    initFormContext(
      initQueryContext(initContext({}, options), options),
      options,
    ),
    options,
  );
}
