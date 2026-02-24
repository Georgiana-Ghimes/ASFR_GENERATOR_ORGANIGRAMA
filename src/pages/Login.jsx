import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Turnstile from 'react-turnstile';
import logo from '@/assets/ASFR-emboss.png';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileKey, setTurnstileKey] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!turnstileToken) {
      setErrorMessage('Vă rugăm să completați verificarea de securitate');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage(''); // Clear previous errors

    try {
      const result = await login(email, password, turnstileToken);
      if (result.success) {
        toast.success('Autentificare reușită!');
        navigate('/');
      } else {
        // Display the error message from backend
        setErrorMessage(result.error || 'Email sau parolă incorectă');
        // Reset Turnstile on error by changing key
        setTurnstileToken('');
        setTurnstileKey(prev => prev + 1);
      }
    } catch (error) {
      setErrorMessage('Eroare la autentificare');
      // Reset Turnstile on error by changing key
      setTurnstileToken('');
      setTurnstileKey(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="ASFR Logo" className="w-32 h-32 object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold">Organigrama Administrativă</CardTitle>
          <CardDescription>
            Introduceți credențialele pentru a accesa aplicația
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <Alert variant="destructive" className="mb-4 [&>svg]:top-1/2 [&>svg]:-translate-y-1/2 [&>svg+div]:translate-y-0">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}!</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="admin@organigrama.ro"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Parolă</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remember" 
                checked={rememberMe}
                onCheckedChange={setRememberMe}
                disabled={isLoading}
              />
              <Label 
                htmlFor="remember" 
                className="text-sm font-normal cursor-pointer"
              >
                Ține-mă minte
              </Label>
            </div>
            <div className="flex justify-center">
              <Turnstile
                key={turnstileKey}
                sitekey="0x4AAAAAAChSWo8mCM9XyW3m"
                onVerify={(token) => setTurnstileToken(token)}
                onError={() => setTurnstileToken('')}
                onExpire={() => setTurnstileToken('')}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !turnstileToken}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Se autentifică...
                </>
              ) : (
                'Autentificare'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
