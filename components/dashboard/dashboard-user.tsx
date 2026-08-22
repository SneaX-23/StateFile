'use client';

import { useCurrentUser } from "@/hooks/use-current-user";

export function DashboardUser() {
  const user = useCurrentUser();

  return (
    <>
      <p>{user?.name}</p>

      {user?.image && (
        <img
          src={user.image}
          alt={user.name ?? "User avatar"}
        />
      )}
    </>
  );
}
