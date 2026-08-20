'use client'
import { useCurrentUser } from "@/lib/auth-client";

export default function testHome() {
  const user = useCurrentUser();

  return (
    <div className="flex flex-col flex-1 items-center justify-center font-sans">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 sm:items-start">        <h1>welcome</h1>

        <p>{user?.name}</p>
        {user?.image && (
          <img
            src={user.image}
            alt={user.name ?? "User avatar"}
          />
        )}
      </main>
    </div>
  );
}
