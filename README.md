# Next.js Azure Blob Storage Upload Example

This project demonstrates how to implement file uploads to Azure Blob Storage in a Next.js application using both client-side and server-side approaches. It provides a complete implementation with drag-and-drop functionality, progress tracking, and proper error handling.

## Features

- ✨ Two implementation approaches:
  - Client-side upload using API routes
  - Server-side upload using Server Actions
- 🎯 Drag and drop file upload
- 📁 File type validation (Image files only)
- 📊 File size validation
- 🔒 Secure upload handling
- 🎨 Modern UI with Tailwind CSS
- 💪 TypeScript support

## Prerequisites

Before you begin, ensure you have:

1. An Azure account with an active subscription
2. Azure Storage Account created
3. Node.js installed (version 18 or higher)
4. Next.js 14 or higher

## Setup Instructions

### 1. Azure Storage Setup

1. Create an Azure Storage Account:

   - Go to Azure Portal
   - Create a new Storage Account
   - Note down the connection string

2. Configure CORS for your Storage Account:
   - Go to your Storage Account in Azure Portal
   - Click on "Settings" > "Resource sharing (CORS)"
   - Add a new CORS rule:
     ```
     Allowed origins: Your domain (e.g., http://localhost:3000)
     Allowed methods: GET, PUT, POST, DELETE, HEAD
     Allowed headers: *
     Exposed headers: *
     Max age: 86400
     ```

### 2. Project Setup

1. Install required dependencies:

   ```bash
   npm install @azure/storage-blob uuid
   ```

2. Create a `.env.local` file in your project root:
   ```env
   AZURE_STORAGE_CONNECTION_STRING=your_connection_string_here
   ```

## Implementation Guide

### Method 1: Client-side Upload (API Route)

1. Create an API route for handling uploads (`src/app/api/upload/route.ts`):

   ```typescript
   import { NextResponse } from "next/server";
   import { BlobServiceClient } from "@azure/storage-blob";
   import { v4 as uuidv4 } from "uuid";

   export async function POST(request: NextRequest) {
     try {
       const formData = await request.formData();
       const file = formData.get("file") as File;

       // Validation
       if (!file || !file.type.startsWith("image/")) {
         return NextResponse.json({ error: "Invalid file" }, { status: 400 });
       }

       const containerName = "your-container-name";
       const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

       const blobServiceClient =
         BlobServiceClient.fromConnectionString(connectionString);
       const containerClient =
         blobServiceClient.getContainerClient(containerName);

       // Create container if not exists
       await containerClient.createIfNotExists({ access: "blob" });

       // Generate unique filename
       const fileName = `${uuidv4()}.${file.type.split("/")[1]}`;
       const blockBlobClient = containerClient.getBlockBlobClient(fileName);

       // Upload file
       const arrayBuffer = await file.arrayBuffer();
       const buffer = Buffer.from(arrayBuffer);

       await blockBlobClient.uploadData(buffer, {
         blobHTTPHeaders: {
           blobContentType: file.type,
         },
       });

       return NextResponse.json({
         url: blockBlobClient.url,
         filename: fileName,
       });
     } catch (error) {
       return NextResponse.json({ error: "Upload failed" }, { status: 500 });
     }
   }
   ```

2. Create a client-side upload service (`src/lib/uploadService.ts`):

   ```typescript
   export async function uploadToBlob(file: File): Promise<UploadResponse> {
     if (!file || !file.type.startsWith("image/")) {
       throw new Error("Invalid file");
     }

     const formData = new FormData();
     formData.append("file", file);

     const response = await fetch("/api/upload", {
       method: "POST",
       body: formData,
     });

     if (!response.ok) {
       throw new Error("Upload failed");
     }

     return response.json();
   }
   ```

### Method 2: Server-side Upload (Server Actions)

1. Create a Server Action for upload (`src/app/actions/upload.ts`):

   ```typescript
   "use server";

   import { BlobServiceClient } from "@azure/storage-blob";
   import { v4 as uuidv4 } from "uuid";

   export async function uploadToBlob(formData: FormData) {
     try {
       const file = formData.get("file") as File;

       if (!file || !file.type.startsWith("image/")) {
         throw new Error("Invalid file");
       }

       const containerName = "your-container-name";
       const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

       const bytes = await file.arrayBuffer();
       const buffer = Buffer.from(bytes);

       const blobServiceClient =
         BlobServiceClient.fromConnectionString(connectionString);
       const containerClient =
         blobServiceClient.getContainerClient(containerName);

       await containerClient.createIfNotExists({ access: "blob" });

       const fileName = `${uuidv4()}.${file.type.split("/")[1]}`;
       const blockBlobClient = containerClient.getBlockBlobClient(fileName);

       await blockBlobClient.uploadData(buffer, {
         blobHTTPHeaders: {
           blobContentType: file.type,
         },
       });

       return {
         success: true,
         url: blockBlobClient.url,
         filename: fileName,
       };
     } catch (error) {
       return {
         success: false,
         error: error instanceof Error ? error.message : "Upload failed",
       };
     }
   }
   ```

2. Use the Server Action in your component:

   ```typescript
   "use client";

   import { uploadToBlob } from "@/app/actions/upload";

   export default function UploadComponent() {
     const handleUpload = async (formData: FormData) => {
       const result = await uploadToBlob(formData);
       if (result.success) {
         // Handle success
         console.log("Upload URL:", result.url);
       } else {
         // Handle error
         console.error("Upload failed:", result.error);
       }
     };

     return (
       <form action={handleUpload}>
         <input type="file" name="file" accept="image/*" />
         <button type="submit">Upload</button>
       </form>
     );
   }
   ```

## Key Considerations

1. **Security**:

   - Always validate file types and sizes
   - Use environment variables for sensitive information
   - Implement proper authentication and authorization
   - Consider using SAS tokens for more granular access control

2. **Performance**:

   - Consider implementing chunked uploads for large files
   - Use proper caching headers
   - Implement retry mechanisms for failed uploads

3. **Error Handling**:
   - Implement proper error boundaries
   - Provide meaningful error messages to users
   - Log errors appropriately

## Best Practices

1. **Container Access**:

   - Use `blob` access level for public read access to individual blobs
   - Use `private` access level and generate SAS tokens for more secure implementations

2. **File Naming**:

   - Always generate unique filenames (UUID)
   - Preserve file extensions for proper MIME type handling

3. **Validation**:
   - Validate file types on both client and server
   - Implement file size limits
   - Sanitize filenames

## Environment Variables

Required environment variables:

```env
AZURE_STORAGE_CONNECTION_STRING=your_connection_string_here
```

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is MIT licensed.
