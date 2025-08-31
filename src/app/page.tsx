"use client";

import { useState } from "react";
import FileUpload from "@/components/file-upload";
import { Button } from "@/components/ui/button";
import { useUploadMutation } from "@/hooks/useUploadMutation";
import { useFileUpload as useDragAndDrop } from "@/hooks/use-file-upload";

export default function Home() {
  const maxSizeMB = 5;
  const maxSize = maxSizeMB * 1024 * 1024; // 5MB default
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
    },
  ] = useDragAndDrop({
    accept: "image/*",
    maxSize,
  });

  const { trigger, isMutating, error, reset } = useUploadMutation();

  const handleUpload = async () => {
    if (files[0]) {
      try {
        const result = await trigger(files[0].file as File);
        setUploadedUrl(result.url);
      } catch (err) {
        // Error is already handled by the hook
        console.error("Upload failed:", err);
      }
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Upload Example</h1>
      <FileUpload
        maxSizeMB={maxSizeMB}
        files={files}
        openFileDialog={openFileDialog}
        handleDragEnter={handleDragEnter}
        handleDragLeave={handleDragLeave}
        handleDragOver={handleDragOver}
        handleDrop={handleDrop}
        removeFile={removeFile}
        getInputProps={getInputProps}
        isDragging={isDragging}
        errors={errors}
      />
      <div className="mt-4 space-y-4">
        <Button onClick={handleUpload} disabled={!files.length || isMutating}>
          {isMutating ? "Uploading..." : "Upload"}
        </Button>

        {error && (
          <div className="text-red-500 mt-2">Error: {error.message}</div>
        )}

        {uploadedUrl && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-600">
              Uploaded successfully! View your image:
            </p>
            <a
              href={uploadedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline break-all"
            >
              {uploadedUrl}
            </a>
            <div className="mt-2">
              <img
                src={uploadedUrl}
                alt="Uploaded image"
                className="max-w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
