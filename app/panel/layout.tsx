import { PanelSidebar } from "@/components/panel/PanelSidebar";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mesh-warm flex min-h-screen">
      <PanelSidebar />
      <main className="flex-1 overflow-auto p-6 sm:p-8">{children}</main>
    </div>
  );
}
