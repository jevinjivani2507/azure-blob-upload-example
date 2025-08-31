"use server";

import { BlobServiceClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";

export async function uploadToBlob(formData: FormData) {
  try {
    const file = formData.get("file") as File;

    if (!file) {
      throw new Error("No file provided");
    }

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files are allowed");
    }

    const containerName = "mypdf";
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!containerName || !connectionString) {
      throw new Error("Azure Storage configuration is missing");
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const fileName = `${uuidv4()}.${file.type.split("/")[1]}`;

    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Create container if it doesn't exist
    await containerClient.createIfNotExists({
      access: "blob",
    });

    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    // Upload file
    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: file.type,
        blobCacheControl: "public, max-age=31536000",
      },
      metadata: {
        uploadedAt: new Date().toISOString(),
      },
    });

    return {
      success: true,
      url: blockBlobClient.url,
      filename: fileName,
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload image",
    };
  }
}
