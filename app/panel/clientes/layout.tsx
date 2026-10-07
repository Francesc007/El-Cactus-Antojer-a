import type { ReactNode } from "react";
import { LoyaltySubNav } from "@/components/panel/loyalty/LoyaltySubNav";

export default function ClientesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4">
      <LoyaltySubNav />
      {children}
    </div>
  );
}
