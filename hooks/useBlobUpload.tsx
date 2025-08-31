import { useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

interface UploadResponse {
  message: string;
  filename: string;
  url: string;
}

interface UseAzureBlobReturn {
  uploadFile: (file: File) => Promise<UploadResponse | null>;
  uploading: boolean;
  error: string | null;
}

const useAzureBlob = (): UseAzureBlobReturn => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (
    selectedFile: File
  ): Promise<UploadResponse | null> => {
    if (!selectedFile) {
      setError("No file selected");
      return null;
    }

    // Check if file is an image
    if (!selectedFile.type.startsWith("image/")) {
      setError("Only image files are allowed");
      return null;
    }

    try {
      setUploading(true);
      setError(null);

      const base64File = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            const base64 = reader.result.split(",")[1];
            resolve(base64);
          } else {
            reject(new Error("Failed to convert file to base64"));
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(selectedFile);
      });

      const fileName = uuidv4();

      const response = await axios.post<UploadResponse>("/api/upload", {
        base64Image: base64File,
        fileName: fileName + "." + selectedFile.type.split("/")[1],
      });
      return response.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to upload file";
      setError(errorMessage);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadFile, uploading, error };
};

export default useAzureBlob;
