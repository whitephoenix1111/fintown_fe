import { ReactNode } from 'react';
import '@/src/styles/globals.css';
import Providers from '@/src/components/Providers';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet' />
        <link rel="stylesheet" href="https://code.highcharts.com/css/stocktools/gui.css" />
        <link rel="stylesheet" href="https://code.highcharts.com/css/annotations/popup.css" />
        <link rel="icon" type="image/png" href="/imgs/logo.png" />
        <title>Fintown</title>
      </head>
      <body className="font-inter custom-scrollbar">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
