import { genericMutationFetcher } from "./utils";

export interface UploadResponse {
  message: string;
  filename: string;
  url: string;
}

export async function uploadToBlob(file: File): Promise<UploadResponse> {
  if (!file) {
    throw new Error("No file selected");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await genericMutationFetcher<UploadResponse>("/api/upload", {
    arg: {
      type: "post",
      rest: [formData],
    },
  });

  return response;
}
