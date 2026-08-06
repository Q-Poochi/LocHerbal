interface ApiErrorShape {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (!error) return fallback;
  const apiError = error as ApiErrorShape;
  return (
    apiError?.response?.data?.message ||
    (error instanceof Error ? error.message : '') ||
    fallback
  );
}
