import Image from "next/image";
import Link from "next/link";
export function Brand() {
  return (
    <Link
      href="/"
      className="brand inline-flex items-center gap-2.5"
      aria-label="Panic Planner home"
    >
      <Image
        src="/panic-planner-logo.png"
        alt=""
        width={38}
        height={38}
        className="brand-mark size-10 object-contain"
        priority
      />
      <span>
        Panic<span className="font-normal">Planner</span>
        <span className="text-orange-500">.</span>
      </span>
    </Link>
  );
}
