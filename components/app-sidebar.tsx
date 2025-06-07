"use client"

import { Database, Calendar, FileText, Mail, Settings, Terminal, Plus, LogOut } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { ConfirmationModal } from "@/components/confirmation-modal"

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Terminal,
  },
  {
    title: "Applications",
    url: "/applications",
    icon: Database,
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
  },
  {
    title: "Documents",
    url: "/documents",
    icon: FileText,
  },
  {
    title: "Gmail Sync",
    url: "/gmail",
    icon: Mail,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  useEffect(() => {
    const gmailConnected = localStorage.getItem("void-gmail-connected")
    setIsAuthenticated(gmailConnected === "true")
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("void-gmail-connected")
    localStorage.removeItem("void-gmail-connected-date")
    localStorage.removeItem("void-user-email")
    localStorage.removeItem("void-applications")
    localStorage.removeItem("void-documents")
    localStorage.removeItem("void-settings")
    window.location.href = "/auth"
  }

  return (
    <>
      <Sidebar className="border-r border-gray-800">
        <SidebarHeader className="border-b border-gray-800 p-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-6 w-6 text-[#00F57A]" />
            <div>
              <h1 className="font-mono text-lg font-medium text-white">The Void</h1>
              <p className="text-xs text-gray-400 font-mono">/dev/null {">"} applications</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="font-mono text-gray-400">Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      className="hover:bg-gray-900 data-[active=true]:bg-[#00F57A] data-[active=true]:text-black"
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="font-mono text-gray-400">Quick Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="hover:bg-gray-900">
                    <Link href="/applications/new">
                      <Plus className="h-4 w-4" />
                      <span>Log Application</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Only show footer with logout if authenticated */}
        {isAuthenticated && (
          <SidebarFooter className="border-t border-gray-800 p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="hover:bg-gray-900">
                  <Link href="/settings">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setShowLogoutModal(true)}
                  className="hover:bg-gray-900 text-red-400 hover:text-red-300"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        )}
      </Sidebar>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Sign Out"
        description={`Are you sure you want to sign out?\n\nThis will:\n• End your current session\n• Clear all local data (applications, documents, settings)\n• Return you to the login screen\n\nAll your data will be lost unless you've exported it.`}
        confirmText="Sign Out"
        destructive={true}
      />
    </>
  )
}
