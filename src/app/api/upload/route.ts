import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { BlobServiceClient } from "@azure/storage-blob";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { base64Image, fileName } = body;

    if (!base64Image) {
      return NextResponse.json(
        { message: "No image data provided" },
        { status: 400 }
      );
    }

    const containerName = "mypdf";
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!containerName || !connectionString) {
      return NextResponse.json(
        { message: "Azure Storage configuration is missing" },
        { status: 500 }
      );
    }

    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Create container if it doesn't exist with public access
    await containerClient.createIfNotExists({
      access: "blob", // This allows public read access to individual blobs
    });

    // Get file extension from the fileName
    const fileExtension = fileName.split(".").pop();
    const contentType = `image/${fileExtension}`;

    // Get the block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Image, "base64");

    // Set blob properties including content type
    await blockBlobClient.uploadData(imageBuffer, {
      blobHTTPHeaders: {
        blobContentType: contentType,
        blobCacheControl: "public, max-age=31536000",
      },
      metadata: {
        uploadedAt: new Date().toISOString(),
      },
    });

    // Get the blob URL
    const blobUrl = blockBlobClient.url;

    return NextResponse.json(
      {
        message: "Image uploaded successfully",
        filename: fileName,
        url: blobUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        message: "Failed to upload image",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
