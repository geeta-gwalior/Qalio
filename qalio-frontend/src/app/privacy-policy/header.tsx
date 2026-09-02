import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="flex h-20 w-full shrink-0 items-center justify-center px-4 md:px-6 bg-white">
      <Link href="#" className="flex items-center" prefetch={false}>
        <Image
          src="/images/skill_access_logo.png"
          alt="Qalio Logo"
          width={160}
          height={40}
          className="mr-2"
        />
      </Link>
    </header>
  );
}
