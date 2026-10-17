import type { Metadata } from 'next';
import '@fontsource/noto-sans-myanmar/400.css';
import '@fontsource/noto-sans-myanmar/500.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/500.css';
import './globals.css';
export const metadata: Metadata = { title: 'Anonymous Garden — A place to be heard', description: 'A quiet Myanmar and English garden for anonymous stories and human encouragement.', robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="my"><body>{children}</body></html>;
}
