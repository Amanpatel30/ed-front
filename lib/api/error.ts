export type NormalizedApiError = {
  status: number | undefined;
  /** True when the request never reached the API. */
  isNetworkError: boolean;
  message: string;
};

const NETWORK_MESSAGE =
  "Could not reach the EduCore API. Check that the backend is running, then try again.";

/**
 * Turns every RTK Query error variant into one shape the UI can render, so
 * screens do not each re-implement status/message extraction.
 *
 * Takes `unknown` because the usual caller is a `catch` block around
 * `unwrap()`, where the thrown value is not statically typed.
 */
export function normalizeApiError(error: unknown): NormalizedApiError | null {
  if (!error || typeof error !== "object") return null;

  if ("status" in error) {
    if (error.status === "FETCH_ERROR") {
      return { status: undefined, isNetworkError: true, message: NETWORK_MESSAGE };
    }

    if (error.status === "PARSING_ERROR") {
      return {
        status: undefined,
        isNetworkError: false,
        message: "The API returned a response the app could not read.",
      };
    }

    if (error.status === "TIMEOUT_ERROR") {
      return {
        status: undefined,
        isNetworkError: true,
        message: "The API took too long to respond. Try again.",
      };
    }

    if (typeof error.status === "number") {
      const data = ("data" in error ? error.data : undefined) as
        | { message?: string }
        | undefined;

      return {
        status: error.status,
        isNetworkError: false,
        message: data?.message ?? defaultMessageForStatus(error.status),
      };
    }

    return {
      status: undefined,
      isNetworkError: false,
      message: "Something went wrong while talking to the API.",
    };
  }

  const message = "message" in error ? error.message : undefined;

  return {
    status: undefined,
    isNetworkError: false,
    message: typeof message === "string" ? message : "Something went wrong.",
  };
}

function defaultMessageForStatus(status: number): string {
  if (status === 401) return "Your session has expired. Sign in again.";
  if (status === 403) return "You do not have permission to do that.";
  if (status === 404) return "That record no longer exists.";
  if (status === 409) return "That change conflicts with the current data.";
  if (status >= 500) return "The API reported an internal error.";
  return "The request could not be completed.";
}
