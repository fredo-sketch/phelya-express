import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { OrderStoreProvider } from "@/components/order-store";
import SessionGuard from "@/components/session-guard";

export const metadata = {
  title: {
    default: "Phelya Express — Kirim Paket Cepat, Sampai dengan Selamat",
    template: "%s · Phelya Express",
  },
  description:
    "Phelya Express: layanan kirim paket dan lacak resi seluruh Indonesia dengan tarif transparan dan notifikasi real-time.",
};

const themeScript = `(function(){try{var t=localStorage.getItem('phelya-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <ToastProvider>
            <OrderStoreProvider>
              <SessionGuard />
              {children}
            </OrderStoreProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
