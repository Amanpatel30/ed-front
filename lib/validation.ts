/**
 * Client-side usability checks, shared by the sign-in and registration forms.
 * The backend re-validates everything; none of this is a security boundary.
 */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mirrors MIN_PASSWORD_LENGTH in the backend's createUserService. */
export const MIN_PASSWORD_LENGTH = 8;
