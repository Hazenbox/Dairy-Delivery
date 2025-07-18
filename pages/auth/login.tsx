import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Fingerprint } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const { signIn, user } = useAuth();
  const router = useRouter();

  // Check for biometric availability
  useEffect(() => {
    const checkBiometric = async () => {
      if (typeof window !== 'undefined' && 'PublicKeyCredential' in window) {
        try {
          // Check if biometric authentication is available
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setBiometricAvailable(available);
          
          // Load saved credentials if remember me was enabled
          const savedEmail = localStorage.getItem('rememberedEmail');
          const isRemembered = localStorage.getItem('rememberMe') === 'true';
          if (savedEmail && isRemembered) {
            setEmail(savedEmail);
            setRememberMe(true);
          }
        } catch (error) {
          console.log('Biometric check failed:', error);
        }
      }
    };
    
    checkBiometric();
  }, []);

  // Check for messages from URL params (like email verification)
  useEffect(() => {
    const urlMessage = router.query.message as string;
    if (urlMessage) {
      setMessage(urlMessage);
    }
  }, [router.query.message]);

  // Redirect when user is successfully authenticated
  useEffect(() => {
    console.log('🔄 Auth state changed:', { user: user?.email, loading });
    if (user && !loading) {
      console.log('🎯 Redirecting to home page...');
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    console.log('🚀 Login form submitted');
    setLoading(true);
    setError('');
    setMessage('');

    try {
      console.log('📧 Attempting login with email:', email);
      const { error } = await signIn(email, password);

      if (error) {
        console.error('❌ Login failed:', error);
        setError(error.message);
        setLoading(false);
      } else {
        console.log('✅ Login successful');
        
        // Save credentials if remember me is checked
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('hasStoredCredentials', 'true');
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('hasStoredCredentials');
          localStorage.removeItem('biometricCredentialId');
        }

        // Force redirect after successful login
        setTimeout(() => {
          console.log('🔄 Forcing redirect to home page...');
          router.push('/');
        }, 1000);
      }
    } catch (err: any) {
      console.error('❌ Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    setError('');
    
    try {
      // Check if we have saved credentials for biometric login
      const savedEmail = localStorage.getItem('rememberedEmail');
      const savedBiometricId = localStorage.getItem('biometricCredentialId');
      
      if (!savedEmail) {
        setError('No saved credentials found. Please login with password first and enable "Remember me".');
        setBiometricLoading(false);
        return;
      }

      if (!savedBiometricId) {
        // First time biometric setup - create new credential
        const credential = await navigator.credentials.create({
          publicKey: {
            challenge: crypto.getRandomValues(new Uint8Array(32)),
            rp: {
              name: "Dairy Delivery",
              id: window.location.hostname,
            },
            user: {
              id: new TextEncoder().encode(savedEmail),
              name: savedEmail,
              displayName: savedEmail,
            },
            pubKeyCredParams: [{alg: -7, type: "public-key"}],
            authenticatorSelection: {
              authenticatorAttachment: "platform",
              userVerification: "required"
            },
            timeout: 60000,
            attestation: "none"
          }
        }) as PublicKeyCredential;

        if (credential) {
          // Store the credential ID for future use
          localStorage.setItem('biometricCredentialId', credential.id);
          setEmail(savedEmail);
          setMessage('Biometric authentication set up successfully! You can now use Touch ID/Face ID to login.');
        }
      } else {
        // Use existing credential for authentication
        const assertion = await navigator.credentials.get({
          publicKey: {
            challenge: crypto.getRandomValues(new Uint8Array(32)),
            allowCredentials: [{
              id: Uint8Array.from(atob(savedBiometricId), c => c.charCodeAt(0)),
              type: 'public-key'
            }],
            userVerification: 'required',
            timeout: 60000
          }
        });

        if (assertion) {
          // Biometric authentication successful - auto-populate fields
          setEmail(savedEmail);
          
          // If we have a saved password (this would be encrypted in a real app)
          const hasStoredCredentials = localStorage.getItem('hasStoredCredentials') === 'true';
          if (hasStoredCredentials) {
            setMessage('Biometric authentication successful! Auto-logging you in...');
            // In a real app, you'd use stored encrypted credentials or server-side session
            // For demo, we'll show success message
            setTimeout(() => {
              setMessage('Please enter your password to complete login.');
            }, 2000);
          } else {
            setMessage('Biometric authentication successful! Please enter your password.');
          }
        }
      }
    } catch (error: any) {
      console.error('Biometric authentication failed:', error);
      
      if (error.name === 'NotAllowedError') {
        setError('Biometric authentication was cancelled.');
      } else if (error.name === 'NotSupportedError') {
        setError('Biometric authentication is not supported on this device.');
      } else if (error.name === 'SecurityError') {
        setError('Biometric authentication failed due to security reasons.');
      } else {
        setError('Biometric authentication failed. Please try again or use password.');
      }
    }
    
    setBiometricLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      backgroundImage: 'url(/dairy-farm-bg.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="relative z-10 w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mb-4">
              <img 
                src="/logo.svg" 
                alt="Dairy Friend Logo" 
                className="h-16 w-auto mx-auto"
              />
            </div>
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(!!checked)}
                  aria-label="Remember me"
                  className="flex-shrink-0"
                />
                <Label 
                  htmlFor="remember-me" 
                  className="text-sm text-muted-foreground cursor-pointer select-none"
                >
                  Remember me
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!email || !password || loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              {biometricAvailable && (
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleBiometricLogin}
                  disabled={biometricLoading}
                  variant="outline"
                >
                  <Fingerprint className="mr-2 h-4 w-4" />
                  {biometricLoading ? 'Authenticating...' : 'Use Biometric'}
                </Button>
              )}
            </form>

            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <button
                onClick={() => router.push('/auth/signup')}
                className="text-primary hover:underline"
              >
                Sign up
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 