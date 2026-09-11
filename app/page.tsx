import { Footer } from "@/components/landing/Footer";
import { GallerySection } from "@/components/landing/GallerySection";
import { SmartHeader } from "@/components/landing/SmartHeader";
import { Hero } from "@/components/landing/Hero";
import { HoursSection } from "@/components/landing/HoursSection";

export default function HomePage() {
  return (
    <div className="mesh-warm">
      <SmartHeader />
      <main>
        <Hero />
        <GallerySection />
        <HoursSection />
      </main>
      <Footer />
    </div>
  );
}
