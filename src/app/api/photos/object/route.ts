import { getObjectFromMinio } from "@/lib/minio-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!key || !key.startsWith("users/")) {
    return Response.json({ error: "Invalid object key" }, { status: 400 });
  }

  try {
    const object = await getObjectFromMinio(key);
    const body = Uint8Array.from(object.body);

    return new Response(body.buffer as ArrayBuffer, {
      headers: {
        "Cache-Control": "private, max-age=31536000, immutable",
        "Content-Type": object.contentType
      }
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load photo object";

    return Response.json({ error: message }, { status: 404 });
  }
}
