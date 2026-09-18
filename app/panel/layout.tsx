import { InventoryProvider } from "@/context/InventoryContext";
import { ReservationProvider } from "@/context/ReservationContext";
import { PanelShell } from "@/components/panel/PanelShell";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReservationProvider>
      <InventoryProvider>
        <PanelShell>{children}</PanelShell>
      </InventoryProvider>
    </ReservationProvider>
  );
}
