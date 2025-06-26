"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Home,
  FileText,
  Users,
  Building2,
  BarChart3,
  Settings,
  Bell,
  User,
  LogOut,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Shield,
  Database,
  Mail,
  ChevronRight,
  ListCollapseIcon as Collapsible,
} from "lucide-react"

/**
 * Navigation configuration for different user roles
 */
const getNavigationConfig = (role, unreadCount = 0) => {
  const configs = {
    student: [
      {
        title: "Overview",
        items: [
          {
            title: "Dashboard",
            url: "/student/dashboard",
            icon: Home,
            description: "View your clearance status and recent activity",
          },
          {
            title: "Apply for Clearance",
            url: "/student/apply",
            icon: FileText,
            description: "Submit new clearance application",
          },
        ],
      },
      {
        title: "Track & Manage",
        items: [
          {
            title: "Status Tracking",
            url: "/student/status",
            icon: Clock,
            description: "Track your application progress",
          },
          {
            title: "Profile",
            url: "/student/profile",
            icon: User,
            description: "Manage your personal information",
          },
        ],
      },
      {
        title: "Communication",
        items: [
          {
            title: "Notifications",
            url: "/student/notifications",
            icon: Bell,
            badge: unreadCount > 0 ? unreadCount : null,
            description: "View messages and updates",
          },
        ],
      },
    ],
    department: [
      {
        title: "Overview",
        items: [
          {
            title: "Dashboard",
            url: "/department",
            icon: Home,
            description: "Department overview and statistics",
          },
          {
            title: "Student Lookup",
            url: "/department/lookup",
            icon: Search,
            description: "Search and view student information",
          },
        ],
      },
      {
        title: "Approvals",
        items: [
          {
            title: "Pending Approvals",
            url: "/department/approvals",
            icon: Clock,
            description: "Review pending clearance requests",
          },
          {
            title: "Approved Applications",
            url: "/department/approved",
            icon: CheckCircle,
            description: "View approved applications",
          },
          {
            title: "Rejected Applications",
            url: "/department/rejected",
            icon: AlertCircle,
            description: "View rejected applications",
          },
        ],
      },
      {
        title: "Management",
        items: [
          {
            title: "Profile",
            url: "/department/profile",
            icon: User,
            description: "Manage officer profile and settings",
          },
          {
            title: "Notifications",
            url: "/department/notifications",
            icon: Bell,
            badge: unreadCount > 0 ? unreadCount : null,
            description: "View messages and updates",
          },
        ],
      },
    ],
    admin: [
      {
        title: "Overview",
        items: [
          {
            title: "Dashboard",
            url: "/admin/dashboard",
            icon: Home,
            description: "System overview and analytics",
          },
          {
            title: "Reports",
            url: "/admin/reports",
            icon: BarChart3,
            description: "Generate and view system reports",
          },
        ],
      },
      {
        title: "User Management",
        items: [
          {
            title: "Students",
            url: "/admin/students",
            icon: Users,
            description: "Manage student accounts and data",
          },
          {
            title: "Departments",
            url: "/admin/departments",
            icon: Building2,
            description: "Manage departments and officers",
          },
        ],
      },
      {
        title: "System",
        items: [
          {
            title: "Settings",
            url: "/admin/settings",
            icon: Settings,
            description: "Configure system settings",
            subItems: [
              {
                title: "General",
                url: "/admin/settings/general",
                icon: Settings,
              },
              {
                title: "Permissions",
                url: "/admin/settings/permissions",
                icon: Shield,
              },
              {
                title: "Database",
                url: "/admin/settings/database",
                icon: Database,
              },
              {
                title: "Email",
                url: "/admin/settings/email",
                icon: Mail,
              },
            ],
          },
          {
            title: "Notifications",
            url: "/admin/notifications",
            icon: Bell,
            badge: unreadCount > 0 ? unreadCount : null,
            description: "System notifications and alerts",
          },
        ],
      },
    ],
  }

  return configs[role] || []
}

/**
 * Sidebar Menu Item Component
 */
const SidebarMenuItemComponent = ({ item, isActive, hasSubItems = false }) => {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  // Check if any sub-item is active
  const isSubItemActive = item.subItems?.some((subItem) => location.pathname === subItem.url)

  useEffect(() => {
    if (isSubItemActive) {
      setIsOpen(true)
    }
  }, [isSubItemActive])

  if (hasSubItems && item.subItems) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            isActive={isActive || isSubItemActive}
            className="w-full justify-between"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex items-center justify-between w-full cursor-pointer">
              <div className="flex items-center">
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </div>
              <div className="flex items-center space-x-2">
                {item.badge && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {item.badge > 99 ? "99+" : item.badge}
                  </Badge>
                )}
                <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`} />
              </div>
            </div>
          </SidebarMenuButton>
          <SidebarMenuSub>
            {item.subItems.map((subItem) => (
              <SidebarMenuSubItem key={subItem.url}>
                <SidebarMenuSubButton asChild isActive={location.pathname === subItem.url}>
                  <Link to={subItem.url} className="flex items-center">
                    <subItem.icon className="h-4 w-4" />
                    <span>{subItem.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </SidebarMenuItem>
      </Collapsible>
    )
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={item.description}>
        <Link to={item.url} className="flex items-center justify-between">
          <div className="flex items-center">
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </div>
          {item.badge && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {item.badge > 99 ? "99+" : item.badge}
            </Badge>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

/**
 * App Sidebar Component
 */
const AppSidebar = ({ unreadCount = 0 }) => {
  const { user, logout, getUserDisplayName } = useAuth()
  const { showNotification } = useNotification()
  const navigate = useNavigate()
  const location = useLocation()

  const navigationConfig = getNavigationConfig(user?.role, unreadCount)

  /**
   * Handle user logout
   */
  const handleLogout = async () => {
    try {
      await logout()
      showNotification({
        type: "success",
        title: "Logged Out",
        message: "You have been successfully logged out",
      })
      navigate("/login")
    } catch (error) {
      console.error("Logout error:", error)
      showNotification({
        type: "error",
        title: "Logout Error",
        message: "There was an error logging you out",
      })
    }
  }

  /**
   * Get user initials for avatar
   */
  const getUserInitials = () => {
    const name = getUserDisplayName()
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  /**
   * Get role display color
   */
  const getRoleColor = (role) => {
    const colors = {
      student: "bg-blue-100 text-blue-800",
      department: "bg-green-100 text-green-800",
      admin: "bg-purple-100 text-purple-800",
    }
    return colors[role] || "bg-gray-100 text-gray-800"
  }

  if (!user) return null

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader>
        <div className="flex items-center space-x-2 px-2 py-2">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">BIU Clearance System</h1>
            <p className="text-xs text-gray-500 truncate">University System</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navigationConfig.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItemComponent
                    key={item.url}
                    item={item}
                    isActive={location.pathname === item.url}
                    hasSubItems={item.subItems && item.subItems.length > 0}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={getUserDisplayName()} />
                    <AvatarFallback className="rounded-lg bg-blue-100 text-blue-600">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{getUserDisplayName()}</span>
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  </div>
                  <Badge className={`text-xs ${getRoleColor(user.role)}`}>{user.role}</Badge>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link to={`/${user.role}/profile`} className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={`/${user.role}/notifications`} className="flex items-center">
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

/**
 * Main Sidebar Provider Component
 */
const SidebarComponent = ({ children, unreadCount = 0 }) => {
  return (
    <SidebarProvider>
      <AppSidebar unreadCount={unreadCount} />
      <main className="flex-1 overflow-hidden">
        <div className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </div>
        <div className="flex-1 overflow-auto p-4">{children}</div>
      </main>
    </SidebarProvider>
  )
}

export default SidebarComponent
