import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { axiosInstance } from "./api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const genericMutationFetcher = async <T>(
  url: string,
  {
    arg,
  }: {
    arg: {
      type: "get" | "post" | "put" | "delete" | "patch";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rest?: any[];
    };
  }
): Promise<T> => {
  const response = await axiosInstance[arg.type](url, ...(arg.rest || []));
  return response.data?.data;
};
