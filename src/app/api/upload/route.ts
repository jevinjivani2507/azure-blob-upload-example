import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { BlobServiceClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";

export interface UploadResponse {
  data: {
    message: string;
    filename: string;
    url: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    const containerName = "mypdf";
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!containerName || !connectionString) {
      return NextResponse.json(
        { error: "Azure Storage configuration is missing" },
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

    // Generate unique filename
    const fileExtension = file.type.split("/")[1];
    const fileName = `${uuidv4()}.${fileExtension}`;

    // Get the block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload the file
    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: file.type,
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
        data: {
          message: "Image uploaded successfully",
          filename: fileName,
          url: blobUrl,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
