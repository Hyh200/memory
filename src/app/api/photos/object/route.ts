import { getObjectStreamFromMinio } from "@/lib/minio-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!key || !key.startsWith("users/")) {
    return Response.json({ error: "Invalid object key" }, { status: 400 });
  }

  try {
    const object = await getObjectStreamFromMinio(key);
    const body = toResponseBody(object.body);
    const headers = new Headers({
      "Cache-Control": "private, max-age=31536000, immutable",
      "Content-Type": object.contentType
    });

    if (typeof object.contentLength === "number") {
      headers.set("Content-Length", String(object.contentLength));
    }

    if (object.etag) {
      headers.set("ETag", object.etag);
    }

    return new Response(body, { headers });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load photo object";

    return Response.json({ error: message }, { status: 404 });
  }
}

function toResponseBody(body: unknown): BodyInit {
  if (!body) {
    return new Uint8Array();
  }

  if (body instanceof ReadableStream) {
    return body;
  }

  if (body && typeof body === "object" && "transformToWebStream" in body) {
    return (body as { transformToWebStream: () => ReadableStream<Uint8Array> })
      .transformToWebStream();
  }

  if (Symbol.asyncIterator in Object(body)) {
    const iterator = (body as AsyncIterable<Uint8Array | Buffer | string>)[
      Symbol.asyncIterator
    ]();

    return new ReadableStream<Uint8Array>({
      async pull(controller) {
        const result = await iterator.next();

        if (result.done) {
          controller.close();
          return;
        }

        const chunk = result.value;
        controller.enqueue(
          typeof chunk === "string" ? new TextEncoder().encode(chunk) : chunk
        );
      },
      async cancel() {
        if (typeof iterator.return === "function") {
          await iterator.return();
        }
      }
    });
  }

  throw new Error("Unsupported MinIO response body");
}
