import ProfileClient from "./profile-client";

/**
 * Opts out of instant-navigation validation: the profile page depends
 * on client-side authentication state.
 */
export const instant = false;

export default function ProfilePage() {
  return <ProfileClient />;
}

