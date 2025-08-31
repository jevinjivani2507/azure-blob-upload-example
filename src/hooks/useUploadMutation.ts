import { useState } from "react";
import useSWRMutation from "swr/mutation";
import { uploadToBlob, type UploadResponse } from "@/lib/uploadService";

interface UseUploadMutationReturn {
  trigger: (file: File) => Promise<UploadResponse>;
  isMutating: boolean;
  error: Error | null;
  reset: () => void;
}

export function useUploadMutation(): UseUploadMutationReturn {
  const [error, setError] = useState<Error | null>(null);

  const { trigger, isMutating, reset } = useSWRMutation(
    "file-upload",
    async (_key: string, { arg }: { arg: File }) => {
      try {
        setError(null);
        return await uploadToBlob(arg);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to upload file");
        setError(error);
        throw error;
      }
    }
  );

  return {
    trigger,
    isMutating,
    error,
    reset,
  };
}
