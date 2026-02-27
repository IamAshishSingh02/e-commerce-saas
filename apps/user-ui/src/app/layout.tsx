import './global.css';
import Header from './shared/widgets/header';
import { Poppins, Roboto } from 'next/font/google'

export const metadata = {
  title: 'ShopVerse',
  description: 'A scalable ShopVerse platform enabling multi-vendor storefronts, secure authentication, order management, and seamless payment integration.',
}

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-roboto'
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins'
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${roboto.variable} ${poppins.variable}`}>
        {/* Header component - top part is sticky */}
        <Header />
        
        {/* Main content area - this is what scrolls */}
        <main>
          {children}
        </main>
      </body>
    </html>
  )
}