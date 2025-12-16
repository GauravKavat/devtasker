"use client";

import { toast } from "sonner";

export function useToast() {
  const success = (message: string, description?: string) => {
    toast.success(message, {
      description,
    });
  };

  const error = (message: string, description?: string) => {
    toast.error(message, {
      description,
    });
  };

  const info = (message: string, description?: string) => {
    toast.info(message, {
      description,
    });
  };

  const warning = (message: string, description?: string) => {
    toast.warning(message, {
      description,
    });
  };

  const promise = <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, {
      loading,
      success,
      error,
    });
  };

  const custom = (message: string, options?: Parameters<typeof toast>[1]) => {
    return toast(message, options);
  };

  return {
    success,
    error,
    info,
    warning,
    promise,
    custom,
    toast, // Export raw toast for advanced use cases
  };
}
