import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode, useState, useEffect } from 'react';
import { 
  Home, 
  Users, 
  IndianRupee, 
  Settings, 
  Truck,
  Menu,
  X,
  LogOut,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  hideBottomNav?: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function Layout({ children, title, hideBottomNav }: LayoutProps) {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const navItems: NavItem[] = [
    {
      href: '/',
      label: 'Deliveries',
      icon: Truck,
    },
    {
      href: '/customers',
      label: 'Customers',
      icon: Users,
    },
    {
      href: '/dues',
      label: 'Dues',
      icon: IndianRupee,
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const getUserInitials = () => {
    if (!user?.name) return 'DM';
    return user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Desktop Sidebar
  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-semibold">Dairy Delivery</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = router.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="mr-3 h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Menu */}
      <div className="border-t p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.name || 'Dairy Manager'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.role || 'User'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="h-8 w-8"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  // Mobile Bottom Navigation
  const MobileNavigation = () => (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="grid grid-cols-4 gap-1">
        {navItems.map((item) => {
          const isActive = router.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-1 min-h-[50px] transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );

  // Mobile Header
  const MobileHeader = () => (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold">{title || 'Dairy Delivery'}</h1>
        </div>

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="h-8 w-8"
          >
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
          </Button>
          
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-md border bg-popover p-1 shadow-md">
              <div className="px-3 py-2 border-b">
                <p className="text-sm font-medium">{user?.name || 'Dairy Manager'}</p>
                <p className="text-xs text-muted-foreground">{user?.role || 'User'}</p>
              </div>
              <Link
                href="/settings"
                className="flex items-center px-3 py-2 text-sm hover:bg-accent rounded-sm"
                onClick={() => setUserMenuOpen(false)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  signOut();
                }}
                className="flex w-full items-center px-3 py-2 text-sm hover:bg-accent rounded-sm"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );

  if (isMobile) {
    return (
      <div className="flex min-h-screen flex-col">
        <MobileHeader />
        
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <>
            <div 
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-background">
              <div className="flex h-14 items-center justify-between border-b px-4">
                <h2 className="text-lg font-semibold">Menu</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="flex-1 space-y-1 px-3 py-4">
                {navItems.map((item) => {
                  const isActive = router.pathname === item.href;
                  const Icon = item.icon;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </>
        )}

        {/* Main Content */}
        <main className={cn("flex-1 p-4", hideBottomNav ? "pb-4" : "pb-14")}>
          {children}
        </main>

        {hideBottomNav ? null : <MobileNavigation />}
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-1 flex-col border-r bg-background">
          <SidebarContent />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-12 items-center px-4 lg:px-6">
            <h1 className="text-base font-semibold">{title || 'Dashboard'}</h1>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 