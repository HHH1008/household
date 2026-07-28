import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

const title = "家务档案｜家庭维护打卡";
const description =
  "支持四套独立视觉模式的中文家务计划、打卡与家庭维护记录小程序。";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    title,
    description,
    applicationName: "家务档案",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "家务档案",
    },
    formatDetection: {
      telephone: false,
    },
    openGraph: {
      type: "website",
      locale: "zh_CN",
      url: origin,
      title,
      description,
      siteName: "家务档案",
      images: [
        {
          url: `${origin}/og.png`,
          width: 1731,
          height: 909,
          alt: "家务档案，你的私人家庭维护计划",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${origin}/og.png`],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta content="#f5f5f3" id="pwa-theme-color" name="theme-color" />
        <link
          href="/manifest-industrial.webmanifest"
          id="pwa-manifest"
          rel="manifest"
        />
        <link
          href="/icons/industrial-180.png"
          id="pwa-apple-icon"
          rel="apple-touch-icon"
          sizes="180x180"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                try {
                  const allowed = ["imagine", "industrial", "journal", "pixel"];
                  const stored = localStorage.getItem("household-archive-skin");
                  const migrated =
                    stored === "blueprint" ? "imagine" :
                    stored === "warm" ? "journal" :
                    stored === "forest" ? "pixel" :
                    stored;
                  const skin = allowed.includes(migrated) ? migrated : "industrial";
                  const colors = {
                    imagine: "#f4f4f1",
                    industrial: "#f5f5f3",
                    journal: "#eceff2",
                    pixel: "#d6e3d5"
                  };
                  document.documentElement.dataset.startupSkin = skin;
                  document.getElementById("pwa-manifest")?.setAttribute(
                    "href",
                    "/manifest-" + skin + ".webmanifest"
                  );
                  document.getElementById("pwa-apple-icon")?.setAttribute(
                    "href",
                    "/icons/" + skin + "-180.png"
                  );
                  document.getElementById("pwa-theme-color")?.setAttribute(
                    "content",
                    colors[skin]
                  );
                } catch {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <div aria-hidden="true" className="pwa-launch-screen">
          <div className="pwa-launch-inner">
            <div className="pwa-launch-mark">
              <i className="launch-tile launch-tile-a" />
              <i className="launch-tile launch-tile-b" />
              <i className="launch-tile launch-tile-c" />
              <i className="launch-tile launch-tile-d" />
            </div>
            <div className="pwa-launch-copy">
              <strong>家务档案</strong>
              <p>你的私人家庭维护计划</p>
            </div>
            <div className="pwa-launch-progress">
              <span />
            </div>
          </div>
        </div>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                const finish = () => {
                  window.setTimeout(() => {
                    document.documentElement.classList.add("pwa-ready");
                  }, 620);
                };
                if (document.readyState === "complete") finish();
                else window.addEventListener("load", finish, { once: true });
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
