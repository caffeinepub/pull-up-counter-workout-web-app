import { Outlet, Link, useRouterState } from '@tanstack/react-router';
import LoginButton from '../auth/LoginButton';
import ProfileSetupDialog from '../auth/ProfileSetupDialog';

export default function AppLayout() {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-accent/5">
      {/* Background texture */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none bg-repeat"
        style={{
          backgroundImage: 'url(/assets/generated/gym-texture-bg.dim_1920x1080.png)',
          backgroundSize: '400px',
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <img
                src="/assets/generated/pullup-icon.dim_256x256.png"
                alt="Pull-up Counter"
                className="w-10 h-10"
              />
              <h1 className="text-xl font-bold tracking-tight">Pull-Up Tracker</h1>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1">
              <Link
                to="/"
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPath === '/'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                Counter
              </Link>
              <Link
                to="/stats"
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPath === '/stats'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                Stats
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <LoginButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-8 relative z-10">
        <ProfileSetupDialog />
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-6 relative z-10">
        <div className="container text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Built with ❤️ using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                window.location.hostname
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
