import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex">
      {/* Left: white (light) / black (dark) brand panel */}
      <div className="hidden lg:flex lg:w-1/2 lg:relative overflow-hidden bg-white dark:bg-black">
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-gray-900 dark:text-gray-100">
          <Link href="/feed" className="flex flex-col items-center mb-8">
            {/* Colored logo (light backgrounds) */}
            <Image
              src="/images/bingewise.png"
              alt="BingeWise"
              width={160}
              height={160}
              className="object-contain drop-shadow-lg dark:hidden"
            />
            {/* Light logo (dark backgrounds) */}
            <Image
              src="/images/bingewise_light.png"
              alt="BingeWise"
              width={160}
              height={160}
              className="hidden object-contain drop-shadow-lg dark:block"
            />
          </Link>
          <p className="text-lg text-gray-500 dark:text-gray-400 text-center max-w-sm leading-relaxed">
            Discover your next favorite. Curate your watchlist. Connect with fans.
          </p>
        </div>
      </div>

      {/* Right: blue panel (both modes) with form card */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12 brand-gradient">
        <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
