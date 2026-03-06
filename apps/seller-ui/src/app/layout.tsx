import './global.css';
import Providers from './providers';
import {Poppins} from 'next/font/google'

export const metadata = {
  title: 'ShopVerse Seller',
  description:
    'ShopVerse Seller Dashboard - Manage products, track orders, monitor revenue, and grow your online store with powerful multi-vendor tools.',
}

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`min-h-screen bg-slate-900 font-sans antialiased ${poppins.variable}`}>
        <Providers> 
          {children}
        </Providers>
      </body>
    </html>
  )
}