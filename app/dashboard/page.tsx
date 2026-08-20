import { DashboardUser } from "@/components/dashboard/dashboard-user";
import GetRepos from "@/components/dashboard/get-repos";

export default function TestHome() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center font-sans">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 sm:items-start">
        <h1>Welcome</h1>

        <DashboardUser />
        <GetRepos />
      </main>
    </div>
  );
}
