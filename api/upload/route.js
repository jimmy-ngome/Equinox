import { handleUpload } from "@vercel/blob/client";

// POST - Génère un token pour upload client
export async function POST(request) {
  const body = await request.json();

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Validation et configuration du token
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "application/pdf",
          ],
          maximumSizeInBytes: 10 * 1024 * 1024, // 10MB max
          validUntil: Date.now() + 60000, // Token valide 1 minute
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Callback après upload réussi
        // Tu peux sauvegarder l'URL dans ta DB Neon ici
        console.log("Upload completed:", blob.url);
      },
    });

    return Response.json(jsonResponse);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
