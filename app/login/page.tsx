import { SocialLoginButtons } from '@/components/auth/social-login-buttons';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100 p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-2xl">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
            Welcome to StateFile
          </h1>
          <p className="text-sm text-gray-400">
            Sign in to inspect and verify your infrastructure.
          </p>
        </div>

        <SocialLoginButtons />

        <p className="mt-8 text-center text-xs text-gray-500">
          By signing in, you grant read-only access to verify public repository metadata.
        </p>
      </div>
    </div>
  );
}
