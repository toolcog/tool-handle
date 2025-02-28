import type { ToolContext } from "./context.ts";

/**
 * A Tool Handle content decoder.
 *
 * @category Content
 */
export interface ContentDecoder<T = unknown> {
  /**
   * The supported content type.
   */
  readonly contentType: string;

  /**
   * Decodes the content of the give stream.
   */
  decodeContent(
    stream: ReadableStream<Uint8Array>,
    context: ToolContext,
  ): Promise<T>;
}

/** @internal */
export const anyDecoder: ContentDecoder<Uint8Array> = {
  contentType: "*/*",
  decodeContent: decodeBytes,
};

/** @internal */
export const applicationOctetStreamDecoder: ContentDecoder<Uint8Array> = {
  contentType: "application/octet-stream",
  decodeContent: decodeBytes,
};

/** @internal */
export const textPlainDecoder: ContentDecoder<string> = {
  contentType: "text/plain",
  decodeContent: decodeString,
};

/** @internal */
export const textDecoder: ContentDecoder<string> = {
  contentType: "text/*",
  decodeContent: decodeString,
};

/** @internal */
export const applicationJsonDecoder: ContentDecoder<unknown> = {
  contentType: "application/json",
  async decodeContent(
    stream: ReadableStream<Uint8Array>,
    context: ToolContext,
  ): Promise<unknown> {
    return JSON.parse(await decodeString(stream, context));
  },
};

/** @internal */
function decodeBytes(
  stream: ReadableStream<Uint8Array>,
  context: ToolContext,
): Promise<Uint8Array> {
  const reader = stream.getReader();
  try {
    return readBytes(reader);
  } finally {
    reader?.releaseLock();
  }
}

/** @internal */
async function readBytes(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  let length = 0;

  while (true) {
    const result = await reader.read();
    if (result.value !== undefined) {
      chunks.push(result.value);
      length += result.value.length;
    }
    if (result.done) {
      break;
    }
  }

  const data = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    data.set(chunk, offset);
    offset += chunk.length;
  }
  return data;
}

/** @internal */
async function decodeString(
  stream: ReadableStream<Uint8Array>,
  context: ToolContext,
): Promise<string> {
  let reader:
    | ReadableStreamBYOBReader
    | ReadableStreamDefaultReader<Uint8Array>
    | undefined;
  try {
    reader = stream.getReader({ mode: "byob" });
  } catch (error) {
    // ignore
  }

  try {
    if (reader !== undefined) {
      return await readStringBYOB(reader as ReadableStreamBYOBReader);
    } else {
      reader = stream.getReader();
      return await readString(reader);
    }
  } finally {
    reader?.releaseLock();
  }
}

/** @internal */
async function readString(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): Promise<string> {
  const decoder = new TextDecoder();
  let decoded = "";

  while (true) {
    const result = await reader.read();
    if (result.value !== undefined) {
      decoded += decoder.decode(result.value, { stream: true });
    }
    if (result.done) {
      break;
    }
  }

  decoded += decoder.decode(); // flush
  return decoded;
}

/** @internal */
async function readStringBYOB(
  reader: ReadableStreamBYOBReader,
  buffer: ArrayBuffer = new ArrayBuffer(8192),
): Promise<string> {
  const decoder = new TextDecoder();
  let decoded = "";

  while (true) {
    const view = new Uint8Array(buffer);
    const result = await reader.read(view);
    if (result.value !== undefined) {
      decoded += decoder.decode(result.value, { stream: true });
    }
    if (result.done) {
      break;
    }
    buffer = result.value.buffer;
  }

  decoded += decoder.decode(); // flush
  return decoded;
}

/** @internal */
export const contentDecoders: { readonly [type: string]: ContentDecoder } = {
  [anyDecoder.contentType]: anyDecoder,
  [applicationOctetStreamDecoder.contentType]: applicationOctetStreamDecoder,
  [applicationJsonDecoder.contentType]: applicationJsonDecoder,
  [textPlainDecoder.contentType]: textPlainDecoder,
  [textDecoder.contentType]: textDecoder,
};

/** @internal */
const MEDIA_TYPE_REGEX = /^([^/]+)\/([^+;]+)(?:\+([^;]+))?(?:;.*)?$/;

/**
 * Returns the `ContentDecoder` for the given `contentType`
 * in the specified context.
 *
 * Given `contentType` with the form `{type}/{subtype}*[+{syntax}](;{parameter})`,
 * the following keys are looked up in `context.contentDecoders` in order:
 *
 * 1. `contentType`
 * 2. `{type}/{subtype}`
 * 3. `{type}/{syntax}`
 * 4. `{type}/*`
 * 5. `*``/``*`
 *
 * The value of the first matched key is returned. If no decoder is found,
 * `undefined` is returned.
 */
export function contentDecoder(
  contentType: string | null | undefined,
  context: ToolContext,
): ContentDecoder | undefined {
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  const match = contentType ? MEDIA_TYPE_REGEX.exec(contentType) : null;
  if (match === null) {
    return undefined;
  }
  const [mediaType, type, subtype, syntax] = match;

  const decoders = context.contentDecoders;
  return (
    decoders?.[mediaType] ??
    decoders?.[`${type}/${subtype}`] ??
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    (syntax ? decoders?.[`${type}/${syntax}`] : undefined) ??
    decoders?.[`${type}/*`] ??
    decoders?.[""]
  );
}

/**
 * Decodes a stream with the given contentType using the decoders
 * in the specified context.
 */
export function decodeContent(
  stream: ReadableStream<Uint8Array> | null | undefined,
  contentType: string | null | undefined,
  context: ToolContext,
): Promise<unknown> {
  if (stream === undefined || stream === null) {
    return Promise.resolve(stream);
  }
  const decoder = contentDecoder(contentType, context) ?? anyDecoder;
  return decoder.decodeContent(stream, context);
}
