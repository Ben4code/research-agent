import type { Metadata } from 'next';
import { Roboto, Roboto_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const roboto = Roboto({
  variable: '--font-roboto',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '900'],
  display: 'swap',
});

const robotoMono = Roboto_Mono({
  variable: '--font-roboto-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DroidSearch',
  description:
    'AI-powered research platform with durable workflow execution',
};

export default function RootLayout({
  children,
}: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <head>
        <meta
          name="impeccable-direction"
          content="THESIS: A durable research tool that earns trust by showing its work — warm Calcite mineral palette (charcoal ink, light neutral ground, orange energy, peach softness) instead of the old neutral-purple SaaS look; trust is demonstrated through live progress and cited sources, never hype. OWN-WORLD: Charcoal #3C4044 ink and headings, warm-light #DDDCDB panels and hairline borders, orange #FD7B41 for the single primary action and active state, peach #EDBF9B for soft surfaces; dark charcoal closes the page. Rounded 0.75rem tokens, soft offset shadows, dotted ground texture, dark text on orange (never white — contrast). STORY: Visitors land on a question, understand that research is durable and cited, then start one and watch steps unfold; the product is the evidence trail from question to source-backed report. FIRST VIEWPORT: Sticky warm nav with orange mark; centered charcoal display headline with a peach-marker highlight on the promise line; two CTAs (orange Get Started, outline See how it works); a charcoal-barred terminal card dramatizing a live research run below. FORM: Rebrand of the incumbent world; pinned by the Calcite style guide, applied across landing (Persuade), history, new-research and detail (Operate/Read) surfaces. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance."
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
