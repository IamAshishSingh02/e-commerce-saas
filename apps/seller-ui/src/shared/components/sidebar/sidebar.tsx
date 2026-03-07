'use client'

import { usePathname } from "next/navigation"
import useSidebar from "../../../hooks/useSidebar"
import useSeller from "../../../hooks/useSeller"
import { useEffect } from "react"
import Box from "../box"
import { Sidebar } from "./sidebar.style"
import Link from 'next/link'
import Logo from "../../../../src/assets/svg/logo"
import SidebarItem from "./sidebar.item"
import SidebarMenu from "./sidebar.menu"
import { BellRing, CalendarCheck, CalendarPlus2, LayoutDashboard, LogOut, Logs, Mail, PackageSearch, Settings, SquarePlus, TicketPercent } from "lucide-react"
import PaymentIcon from "../../../assets/svg/payment-icon"

const SidebarComponent = () => {

  const {activeSidebar, setActiveSidebar} = useSidebar()
  const pathName = usePathname()
  const {seller} = useSeller()

  useEffect(() => {
    setActiveSidebar(pathName)
  }, [pathName, setActiveSidebar])

  const getIconColor = (route: string) => activeSidebar === route ? '#0085ff' : '#969696'

  return (
    <Box
      $css={{height: '100vh', zIndex: 202, position: 'sticky', padding: '8px', top: '0', overflowY: 'scroll',scrollbarWidth: 'none'}}
      className="sidebar-wrapper"
    >

      {/* Sidebar Header */}
      <Sidebar.Header>
        <Box>
          <Link href={'/'} className="flex justify-center text-center gap-2">
            <Logo />
            <Box className="text-xl font-medium text-[#ecedee]">
              <h3>
                {seller?.shop?.name}
              </h3>
              <h5 className="font-medium pl-2 text-xs text-[#ecedeecf] whitespace-nowrap overflow-hidden text-ellipsis max-w-[170px] ">
                {seller?.shop?.address}
              </h5>
            </Box>
          </Link>
        </Box>
      </Sidebar.Header>

      {/* Sidebar body */}
      <div className="block my-3 h-full">
        <Sidebar.Body className="body sidebar">

          {/*  */}
          <SidebarItem
            title="Dashboard"
            icon={<LayoutDashboard size={20} fill={getIconColor('/dashboard')} />}
            isActive={activeSidebar === '/dashboard'}
            href={'/dashboard'}
          />

          {/*  */}
          <div className="mt-2 block">

            {/* Main menu */}
            <SidebarMenu title="Main Menu">

              {/* Orders */}
              <SidebarItem
                title="Orders"
                icon={<Logs size={20} color={getIconColor('/dashboard/orders')} />}
                isActive={activeSidebar === '/dashboard/orders'}
                href={'/dashboard/orders'}
              />

              {/* Payments */}
              <SidebarItem
                title="Payments"
                icon={<PaymentIcon fill={getIconColor('/dashboard/payments')} />}
                isActive={activeSidebar === '/dashboard/payments'}
                href={'/dashboard/payments'}
              />

            </SidebarMenu>

            {/* Products */}
            <SidebarMenu title="Products">

              {/* Create product */}
              <SidebarItem
                title="Create Product"
                icon={<SquarePlus size={20} color={getIconColor('/dashboard/create-product')} />}
                isActive={activeSidebar === '/dashboard/create-product'}
                href={'/dashboard/create-product'}
              />

              {/* All products */}
              <SidebarItem
                title="All Products"
                icon={<PackageSearch size={20} color={getIconColor('/dashboard/all-products')} />}
                isActive={activeSidebar === '/dashboard/all-products'}
                href={'/dashboard/all-products'}
              />

            </SidebarMenu>

            {/* Events */}
            <SidebarMenu title="Events">

              {/* Create event */}
              <SidebarItem
                title="Create Event"
                icon={<CalendarPlus2 size={20} color={getIconColor('/dashboard/create-event')} />}
                isActive={activeSidebar === '/dashboard/create-event'}
                href={'/dashboard/create-event'}
              />

              {/* All events */}
              <SidebarItem
                title="All Events"
                icon={<CalendarCheck size={20} color={getIconColor('/dashboard/all-events')} />}
                isActive={activeSidebar === '/dashboard/all-events'}
                href={'/dashboard/all-events'}
              />

            </SidebarMenu>

            {/* Management */}
            <SidebarMenu title="Management">

              {/* Inbox */}
              <SidebarItem
                title="Inbox"
                icon={<Mail size={20} color={getIconColor('/dashboard/inbox')} />}
                isActive={activeSidebar === '/dashboard/inbox'}
                href={'/dashboard/inbox'}
              />

              {/* Settings */}
              <SidebarItem
                title="Settings"
                icon={<Settings size={20} color={getIconColor('/dashboard/settings')} />}
                isActive={activeSidebar === '/dashboard/settings'}
                href={'/dashboard/settings'}
              />

              {/* Notifications */}
              <SidebarItem
                title="Notifications"
                icon={<BellRing size={20} color={getIconColor('/dashboard/notifications')} />}
                isActive={activeSidebar === '/dashboard/notifications'}
                href={'/dashboard/notifications'}
              />

            </SidebarMenu>

            {/* Extras */}
            <SidebarMenu title="Extras">

              {/* Inbox */}
              <SidebarItem
                title="Discount Codes"
                icon={<TicketPercent size={20} color={getIconColor('/dashboard/discount-codes')} />}
                isActive={activeSidebar === '/dashboard/discount-codes'}
                href={'/dashboard/discount-codes'}
              />

              {/* Logout */}
              <SidebarItem
                title="Logout"
                icon={<LogOut size={20} color={getIconColor('/logout')} />}
                isActive={activeSidebar === '/logout'}
                href={'/'}
              />

            </SidebarMenu>

          </div>

        </Sidebar.Body>
      </div>

    </Box>
  )
}

export default SidebarComponent