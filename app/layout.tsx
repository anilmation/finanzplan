import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

export const metadata: Metadata = {
  title: 'Finanzplan',
  description: 'Persönliche Budgetplanung & Bankbeleg-Analyse',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var theme = localStorage.getItem('fp-theme');
              var font = localStorage.getItem('fp-font');
              var themes = {
                slate: {'--background':'210 40% 96%','--foreground':'222 47% 11%','--card':'0 0% 100%','--primary':'243 75% 59%','--primary-foreground':'0 0% 100%','--accent':'199 89% 37%','--muted':'210 40% 93%','--muted-foreground':'215 16% 47%','--border':'214 32% 87%','--secondary':'210 40% 90%'},
                rose: {'--background':'350 100% 98%','--foreground':'240 10% 10%','--card':'0 0% 100%','--primary':'347 77% 50%','--primary-foreground':'0 0% 100%','--accent':'25 95% 53%','--muted':'350 50% 95%','--muted-foreground':'240 5% 50%','--border':'350 30% 88%','--secondary':'350 50% 92%'},
                emerald: {'--background':'138 76% 97%','--foreground':'160 30% 10%','--card':'0 0% 100%','--primary':'160 84% 39%','--primary-foreground':'0 0% 100%','--accent':'199 89% 37%','--muted':'138 40% 93%','--muted-foreground':'160 15% 45%','--border':'138 30% 85%','--secondary':'138 40% 90%'},
                amber: {'--background':'48 100% 97%','--foreground':'30 20% 10%','--card':'0 0% 100%','--primary':'38 92% 50%','--primary-foreground':'0 0% 100%','--accent':'0 84% 60%','--muted':'48 50% 93%','--muted-foreground':'30 10% 45%','--border':'48 30% 85%','--secondary':'48 50% 90%'},
                violet: {'--background':'250 100% 98%','--foreground':'260 20% 10%','--card':'0 0% 100%','--primary':'263 70% 50%','--primary-foreground':'0 0% 100%','--accent':'330 81% 60%','--muted':'250 50% 95%','--muted-foreground':'260 10% 50%','--border':'250 30% 88%','--secondary':'250 50% 92%'},
                midnight: {'--background':'222 47% 8%','--foreground':'210 40% 95%','--card':'222 47% 12%','--primary':'199 89% 61%','--primary-foreground':'222 47% 8%','--accent':'158 64% 52%','--muted':'222 30% 16%','--muted-foreground':'215 20% 60%','--border':'222 30% 22%','--secondary':'222 30% 18%'},
                forest: {'--background':'130 40% 6%','--foreground':'120 20% 92%','--card':'130 35% 10%','--primary':'120 60% 60%','--primary-foreground':'130 40% 6%','--accent':'45 93% 58%','--muted':'130 25% 14%','--muted-foreground':'120 10% 55%','--border':'130 25% 20%','--secondary':'130 25% 16%'},
              };
              var fonts = {
                inter: '"Inter", system-ui, sans-serif',
                system: 'system-ui, -apple-system, sans-serif',
                mono: '"Fira Code", "Cascadia Code", monospace',
                serif: '"Georgia", "Times New Roman", serif',
                rounded: '"Nunito", "Varela Round", system-ui, sans-serif',
              };
              if (theme && themes[theme]) {
                var vars = themes[theme];
                for (var k in vars) document.documentElement.style.setProperty(k, vars[k]);
                if (theme === 'midnight' || theme === 'forest') document.documentElement.classList.add('dark');
              }
              var displayFonts = {
                inter: '"Inter", system-ui, sans-serif',
                system: 'system-ui, -apple-system, sans-serif',
                playfair: 'Georgia, "Times New Roman", serif',
                mono: '"Courier New", Courier, monospace',
                rounded: '"Trebuchet MS", Arial, sans-serif',
              };
              if (font && fonts[font]) {
                document.body && (document.body.style.fontFamily = fonts[font]);
                var displayFont = displayFonts[font] || null;
                if (displayFont) {
                  var s = document.createElement('style');
                  s.id = 'fp-font-style';
                  s.textContent = 'body { font-family: ' + fonts[font] + ' !important; } h1,h2,h3 { font-family: ' + displayFont + ' !important; }';
                  document.head.appendChild(s);
                }
              }
            } catch(e) {}
          })();
        ` }} />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
