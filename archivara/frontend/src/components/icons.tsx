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
  Plus,
  LogOut,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const Icons = {
  logo: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img 
      {...props} 
      src="/favicon.png" 
      alt="Archivara logo"
      className={cn("h-8 w-8", props.className)}
      style={{ filter: 'var(--logo-filter, none)' }}
    />
  ),
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
  plus: Plus,
  logOut: LogOut,
  x: X
}; 