import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import HelpFab from "@/components/layout/help-fab";

export default function SiteLayout({ children }) {
  return (
    <>
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:font-bold focus:text-white"
      >
        Lewati ke konten utama
      </a>
      <Navbar />
      <main id="konten">{children}</main>
      <Footer />
      <HelpFab />
    </>
  );
}
