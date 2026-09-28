import Image from "next/image";
import Link from "next/link";
import { Progress } from "@/components/Progress";

export default function FlowLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[480px] px-4 pb-16 pt-5">
      <header className="mb-5">
        <Link href="/" aria-label="Flightback home" className="inline-block">
          <Image src="/logo.png" alt="Flightback" width={123} height={22} priority />
        </Link>
      </header>
      <Progress />
      <main>{children}</main>
    </div>
  );
}
