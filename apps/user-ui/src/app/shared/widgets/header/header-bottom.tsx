'use client'

import { navItems } from 'apps/user-ui/src/configs/constants'
import { AlignJustify, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const HeaderBottom = () => {
  const [show, setShow] = useState(false)

  return (
    <div className='w-full bg-white border-b border-slate-300'>
      
      {/* Navigation container */}
      <div className='w-[80%] m-auto flex items-center justify-between py-2 relative'>

        {/* All Categories dropdown button */}
        <div className='w-[260px] cursor-pointer flex items-center justify-between px-5 h-[50px] bg-emerald-700 hover:bg-emerald-600 transition' onClick={() => setShow(!show)}>

          {/* Icon + text */}
          <div className='flex items-center gap-2'>
            <AlignJustify color='#fff' />
            <span className='text-white font-medium'>All Categories</span>
          </div>

          {/* Chevron icon - rotates when dropdown is open */}
          <ChevronDown color='#fff' className={`text-white transition ${show ? 'rotate-180' : ''}`} />    

        </div>

        {/* Dropdown menu - Shows when 'show' state is true */}
        {show && (
          <div className='absolute left-0 top-[52px] w-[260px] h-[400px] bg-slate-100 shadow-lg z-50'>
            {/* Add your categories here */}
          </div>
        )}

        {/* Navigation links */}
        <div className='flex items-center'>
          {navItems.map((i: NavItemsType, index: number) => (
            <Link className='px-5 font-medium text-lg hover:text-emerald-600 transition' href={i.href} key={index}>
              {i.title}
            </Link>
          ))}
        </div>

      </div>
      
    </div>
  )
}

export default HeaderBottom