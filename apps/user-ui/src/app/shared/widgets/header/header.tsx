import React from 'react'
import Link from 'next/link'
import { SearchIcon } from 'lucide-react'
import ProfileIcon from '../../../../assets/svg/profile-icon'
import WishlistIcon from '../../../../assets/svg/wishlist-icon'
import CartIcon from '../../../../assets/svg/cart-icon'
import HeaderBottom from './header-bottom'

const Header = () => {
  return (
    <>
      {/* Top part - Sticky header that stays on scroll */}
      <div className="sticky top-0 z-[200] bg-white border-b border-slate-300">

        {/* Main header content */}
        <div className="w-[80%] py-5 m-auto flex items-center justify-between">

          {/* 1st - Logo section */}
          <div>
            {/* Branding */}
            <Link href={'/'} className="text-2xl font-bold tracking-tight">
              Shop<span className="text-emerald-600">Verse</span>
            </Link>
          </div>

          {/* 2nd - Search bar section */}
          <div className='w-[50%] relative'>

            {/* Input box */}
            <input type="text" placeholder='Search for products...' 
            className='w-full px-4 font-Poppins font-medium border-[2px] border-[#047857] outline-none h-[45px] rounded-md focus:ring-2 focus:ring-[#047857] focus:outline-none'
            />

            {/* Search icon */}
            <div className='w-[60px] cursor-pointer flex items-center justify-center h-[41.5px] bg-[#059669] rounded-r absolute top-[1.6px] right-[1.6px]'>
              <SearchIcon color='#fff' />
            </div>

          </div>

          {/* 3rd - User actions section */}
          <div className='flex items-center gap-8'>

            {/* Login */}
            <div className='flex items-center gap-2'>

              {/* Profile icon */}
              <Link href={'/login'}>
                <ProfileIcon />
              </Link>

              {/* Welcome text */}
              <Link href={'/login'} className='flex flex-col'>
                <span className="text-xs text-slate-700">Hi there,</span>
                <span className="text-sm font-semibold text-slate-800 hover:text-emerald-600 transition">
                  Sign In
                </span>
              </Link>

            </div>

            {/* Wishlist */}
            <Link href={'/wishlist'} className='relative'>

              {/* Heart icon */}
              <WishlistIcon />

              {/* Wishlist counter */}
              <div className='w-5 h-5 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute -top-2 -right-2'>
                <span className='text-white font-medium text-xs'>0</span>
              </div>

            </Link>

            {/* Cart */}
            <Link href={'/cart'} className='relative'>

              {/* Cart icon */}
              <CartIcon />

              {/* Cart counter */}
              <div className='w-5 h-5 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute -top-2 -right-2'>
                <span className='text-white font-medium text-xs'>0</span>
              </div>

            </Link>

          </div>

        </div>

      </div>

      {/* Bottom part - Navigation section that scrolls away */}
      <HeaderBottom />
    </>
  )
}

export default Header