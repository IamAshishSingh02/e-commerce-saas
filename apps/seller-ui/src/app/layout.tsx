import './global.css';
import Providers from './providers';

export const metadata = {
  title: 'ShopVerse Seller',
  description:
    'ShopVerse Seller Dashboard - Manage products, track orders, monitor revenue, and grow your online store with powerful multi-vendor tools.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers> 
          {children}
        </Providers>
      </body>
    </html>
  )
}