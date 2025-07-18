import { useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    const { error } = await signUp(email, password, name);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
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
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>
              Sign up to get started with Dairy Friend
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {success ? (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md space-y-3">
                <p>🎉 Account created successfully! Please check your email and verify your account before signing in.</p>
                <Button
                  onClick={() => router.push('/auth/login')}
                  className="w-full"
                >
                  Go to Sign In
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="Enter your email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Create a password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={!name || !email || !password || !confirmPassword || loading}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="text-primary hover:underline"
                  >
                    Sign in
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 