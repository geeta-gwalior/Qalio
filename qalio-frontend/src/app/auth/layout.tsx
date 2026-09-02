import Image from "next/image";
import QalioLogo from "@/components/common/QalioLogo";
import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen w-full font-[jost]">
      {/* Left Side - Illustration */}
      <div className="w-1/2 hidden md:block m-4 relative bg-[#E4EEFF] rounded-[20px] overflow-hidden">
        <div className="absolute z-10 top-12 left-1/2 transform -translate-x-1/2">
          <QalioLogo size="lg" variant="glass" />
        </div>

        <Image
          src="/images/learning-illustration.png"
          alt="Student Illustration"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Right Side - Form */}
      <div className="w-full md:w-1/2 flex justify-center items-center px-6 py-10">
        <div className="w-full ">{children}</div>
      </div>
    </main>
  );
}
