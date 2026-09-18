import { InventoryProvider } from "@/context/InventoryContext";
import { ReservationProvider } from "@/context/ReservationContext";
import { PanelSidebar } from "@/components/panel/PanelSidebar";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReservationProvider>
      <InventoryProvider>
        <div className="mesh-warm flex h-screen overflow-hidden">
          <PanelSidebar />
          <main className="min-h-0 flex-1 overflow-y-auto p-6 sm:p-8">{children}</main>
        </div>
      </InventoryProvider>
    </ReservationProvider>
  );
}
