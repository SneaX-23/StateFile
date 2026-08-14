import Image from "next/image";
import Link from "next/link";
export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <h1>Hello StateFile</h1>

        <Link href={"/login"}>
          <button
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#e24329]/10 hover:bg-[#e24329]/20 border border-[#e24329]/30 rounded-lg text-sm font-medium text-white transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            <span>Login</span>
          </button>
        </Link>

      </main>
    </div>
  );
}
