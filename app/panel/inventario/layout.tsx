import { InventorySubNav } from "@/components/panel/inventory/InventorySubNav";

export default function InventarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="section-eyebrow">Gestión interna</p>
      <h1 className="section-title mt-1">Inventario</h1>
      <div className="mt-6">
        <InventorySubNav />
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
