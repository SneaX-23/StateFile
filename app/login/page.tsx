import { SocialLoginButtons } from '@/components/auth/social-login-buttons';
import BlueprintLayout from '@/components/ui/blueprint-layout';

export default function LoginPage() {
  return (
    <BlueprintLayout>
      {/* no bg and border */}
      <div className="w-full max-w-md ">
        {/* with bg and border */}
        {/* <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900/90 p-8 shadow-2xl backdrop-blur-sm"> */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-sans text-xl tracking-tight text-blueprint-100">
            Welcome to
            <br />
            <span
              title="StateFile"
              className="
                relative inline-block animate-glitch-main 
                font-display text-4xl font-semibold tracking-tight text-blueprint-400 sm:text-6xl md:text-6xl
                before:absolute before:left-0 before:top-0 before:content-[attr(title)] 
                before:animate-glitch-top before:[clip-path:polygon(0_0,100%_0,100%_33%,0_33%)]
                after:absolute after:left-0 after:top-0 after:content-[attr(title)] 
                after:animate-glitch-bottom after:[clip-path:polygon(0_67%,100%_67%,100%_100%,0_100%)]
              "
            >
              StateFile
            </span>
          </h1>

          {/* <p className="font-sans text-sm text-gray-500"> */}
          {/*   Sign in to visualize your infrastructure. */}
          {/* </p> */}
        </div>

        <SocialLoginButtons />

        <p className="mt-8 text-center text-xs text-gray-500">
          By signing in, you grant read-only access to verify public repository
          metadata.
        </p>
      </div>
    </BlueprintLayout>
  );
}
