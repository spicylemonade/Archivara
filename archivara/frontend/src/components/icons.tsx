import * as React from 'react';
import {
  ChevronDown,
  ChevronUp,
  Library,
  Search,
  FileText,
  Bot,
  Cpu,
  GitBranch,
  Code,
  FlaskConical,
  Loader2,
  Brain,
  Network,
  Volume2,
  Download,
  ExternalLink,
  Archive,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Flag,
  Plus,
  LogOut,
  X,
  Link,
  Menu,
  User,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ThemeAwareLogo = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const [isDark, setIsDark] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    // Set client-side flag to prevent hydration mismatch
    setIsClient(true);
    
    // Function to check if dark mode is active
    const checkDarkMode = () => {
      try {
        const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const currentTheme = localStorage.getItem("theme");
        const isDarkMode = currentTheme === "dark" || (!currentTheme && isSystemDark) || document.documentElement.classList.contains('dark');
        setIsDark(isDarkMode);
      } catch (error) {
        // Handle any errors gracefully
        console.warn('Failed to check dark mode:', error);
      }
    };

    // Initial check
    checkDarkMode();

    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Listen for localStorage changes
    window.addEventListener('storage', checkDarkMode);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', checkDarkMode);
    };
  }, []);

  // During SSR or before client hydration, show a neutral state
  if (!isClient) {
    return (
      <img 
        {...props} 
        src="/logo-black.png"
        alt="Archivara logo"
        className={cn("h-10 w-10", props.className)}
      />
    );
  }

  return (
    <img 
      {...props} 
      src={isDark ? "/logo-white.png" : "/logo-black.png"}
      alt="Archivara logo"
      className={cn("h-10 w-10", props.className)}
    />
  );
};

export const Icons = {
  logo: ThemeAwareLogo,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  search: Search,
  library: Library,
  paper: FileText,
  bot: Bot,
  cpu: Cpu,
  gitBranch: GitBranch,
  code: Code,
  experiment: FlaskConical,
  loader: Loader2,
  brain: Brain,
  network: Network,
  audioLines: Volume2,
  download: Download,
  externalLink: ExternalLink,
  archive: Archive,
  checkCircle: CheckCircle2,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
  flag: Flag,
  plus: Plus,
  logOut: LogOut,
  x: X,
  link: Link,
  menu: Menu,
  user: User,
  alertTriangle: AlertTriangle
}; 