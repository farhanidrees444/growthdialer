import './auth-theme.css';
import { AuthTheme } from '@/components/auth/AuthTheme';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthTheme>{children}</AuthTheme>;
}
