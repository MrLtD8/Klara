import { AuthProvider } from './useAuth';
import { AuthGate }    from './AuthGate';
import KlaraLayout     from './klara/Layout';

export default function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <KlaraLayout />
      </AuthGate>
    </AuthProvider>
  );
}
