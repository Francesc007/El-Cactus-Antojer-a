"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { privacyHref } from "@/lib/privacy-link";

type PrivacyLinkProps = {
  className?: string;
  children: React.ReactNode;
};

export function PrivacyLink({ className, children }: PrivacyLinkProps) {
  const pathname = usePathname();

  return (
    <Link href={privacyHref(pathname)} className={className}>
      {children}
    </Link>
  );
}
