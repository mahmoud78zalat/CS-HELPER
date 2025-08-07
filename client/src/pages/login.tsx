import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmail } from '@/lib/supabase';

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [mascotState, setMascotState] = useState<'idle' | 'success' | 'error'>('idle');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Mouse tracking for eye movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Calculate relative position and constrain eye movement
        const deltaX = (e.clientX - centerX) / 30;
        const deltaY = (e.clientY - centerY) / 30;
        
        setMousePosition({
          x: Math.max(-8, Math.min(8, deltaX)),
          y: Math.max(-6, Math.min(6, deltaY))
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMascotState('idle');

    try {
      const { data, error } = await signInWithEmail(email, password);
      
      if (error) {
        setError(error.message);
        setMascotState('error');
        // Reset to idle after animation
        setTimeout(() => setMascotState('idle'), 2000);
        return;
      }

      if (data.user) {
        setMascotState('success');
        toast({
          title: "Login Successful",
          description: `Welcome back, ${data.user.email}!`,
        });
        
        // Navigate after success animation
        setTimeout(() => setLocation('/'), 1500);
      }
    } catch (err) {
      console.error('[Login] Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
      setMascotState('error');
      setTimeout(() => setMascotState('idle'), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 flex items-center justify-center p-4 overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-purple-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-10 w-16 h-16 bg-pink-200 rounded-full opacity-20 animate-pulse delay-500"></div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-md w-full">
        
        {/* Yeti Mascot */}
        <div className="relative mb-8">
          <svg
            width="200"
            height="240"
            viewBox="0 0 200 240"
            className="drop-shadow-lg"
          >
            {/* Yeti Body */}
            <ellipse
              cx="100"
              cy="160"
              rx="65"
              ry="80"
              fill="#f8fafc"
              stroke="#e2e8f0"
              strokeWidth="2"
            />
            
            {/* Yeti Head */}
            <ellipse
              cx="100"
              cy="70"
              rx="50"
              ry="45"
              fill="#f8fafc"
              stroke="#e2e8f0"
              strokeWidth="2"
            />
            
            {/* Left Arm holding the sign */}
            <ellipse
              cx="45"
              cy="140"
              rx="18"
              ry="35"
              fill="#f8fafc"
              stroke="#e2e8f0"
              strokeWidth="2"
              transform="rotate(-20 45 140)"
              className={`transition-all duration-500 ${
                isPasswordFocused ? 'translate-x-6 -translate-y-8 rotate-12' : ''
              }`}
            />
            
            {/* Right Arm holding the sign */}
            <ellipse
              cx="155"
              cy="140"
              rx="18"
              ry="35"
              fill="#f8fafc"
              stroke="#e2e8f0"
              strokeWidth="2"
              transform="rotate(20 155 140)"
              className={`transition-all duration-500 ${
                isPasswordFocused ? '-translate-x-6 -translate-y-8 -rotate-12' : ''
              }`}
            />
            
            {/* Hands covering eyes when password focused */}
            {isPasswordFocused && (
              <>
                <circle
                  cx="85"
                  cy="60"
                  r="12"
                  fill="#f1f5f9"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                  className="animate-in slide-in-from-left duration-300"
                />
                <circle
                  cx="115"
                  cy="60"
                  r="12"
                  fill="#f1f5f9"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                  className="animate-in slide-in-from-right duration-300"
                />
              </>
            )}
            
            {/* Eyes - follow mouse when not covered */}
            {!isPasswordFocused && (
              <>
                <circle cx="85" cy="60" r="8" fill="white" />
                <circle cx="115" cy="60" r="8" fill="white" />
                <circle
                  cx={85 + mousePosition.x}
                  cy={60 + mousePosition.y}
                  r="4"
                  fill="#1e293b"
                  className="transition-all duration-100 ease-out"
                />
                <circle
                  cx={115 + mousePosition.x}
                  cy={60 + mousePosition.y}
                  r="4"
                  fill="#1e293b"
                  className="transition-all duration-100 ease-out"
                />
              </>
            )}
            
            {/* Nose */}
            <ellipse cx="100" cy="75" rx="3" ry="4" fill="#f59e0b" />
            
            {/* Mouth - changes based on mascot state */}
            {mascotState === 'success' && (
              <path
                d="M 90 85 Q 100 95 110 85"
                stroke="#22c55e"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                className="animate-in zoom-in duration-300"
              />
            )}
            {mascotState === 'error' && (
              <path
                d="M 90 90 Q 100 80 110 90"
                stroke="#ef4444"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                className="animate-in zoom-in duration-300"
              />
            )}
            {mascotState === 'idle' && (
              <ellipse cx="100" cy="85" rx="4" ry="2" fill="#64748b" />
            )}
            
            {/* Success animation elements */}
            {mascotState === 'success' && (
              <>
                <circle cx="70" cy="45" r="2" fill="#fbbf24" className="animate-ping" />
                <circle cx="130" cy="40" r="1.5" fill="#fbbf24" className="animate-ping delay-200" />
                <circle cx="60" cy="55" r="1" fill="#fbbf24" className="animate-ping delay-400" />
              </>
            )}
            
            {/* Error animation - head shake effect */}
            <g className={mascotState === 'error' ? 'animate-bounce' : ''}>
              {/* Fur details */}
              <circle cx="75" cy="45" r="4" fill="#f1f5f9" opacity="0.7" />
              <circle cx="125" cy="45" r="4" fill="#f1f5f9" opacity="0.7" />
              <circle cx="100" cy="35" r="6" fill="#f1f5f9" opacity="0.7" />
            </g>
          </svg>
        </div>

        {/* Login Form as a Sign */}
        <div className="relative">
          {/* Sign Background */}
          <div className="bg-amber-50 border-4 border-amber-800 rounded-lg p-6 shadow-2xl transform rotate-1 relative">
            {/* Sign posts */}
            <div className="absolute -top-4 left-4 w-2 h-8 bg-amber-800 rounded-sm"></div>
            <div className="absolute -top-4 right-4 w-2 h-8 bg-amber-800 rounded-sm"></div>
            
            {/* Rope details */}
            <div className="absolute -top-2 left-6 w-6 h-1 bg-amber-700 rounded-full"></div>
            <div className="absolute -top-2 right-6 w-6 h-1 bg-amber-700 rounded-full"></div>
            
            <div className="transform -rotate-1">
              <h1 className="text-2xl font-bold text-amber-900 text-center mb-4 font-serif">
                Welcome Back!
              </h1>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-amber-800 font-semibold">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/90 border-amber-300 focus:border-amber-500 focus:ring-amber-500"
                    data-testid="input-email"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-amber-800 font-semibold">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    className="bg-white/90 border-amber-300 focus:border-amber-500 focus:ring-amber-500"
                    data-testid="input-password"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-2 px-4 rounded shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                  data-testid="button-submit"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Enter the Portal'
                  )}
                </Button>
              </form>
            </div>
          </div>
          
          {/* Sign shadow */}
          <div className="absolute inset-0 bg-amber-900 rounded-lg transform translate-x-1 translate-y-1 -z-10 opacity-20"></div>
        </div>

        {/* Success/Error Messages */}
        {mascotState === 'success' && (
          <div className="mt-4 text-green-600 font-semibold text-center animate-in fade-in duration-500">
            🎉 Welcome back, friend!
          </div>
        )}
        
        {mascotState === 'error' && (
          <div className="mt-4 text-red-600 font-semibold text-center animate-in fade-in duration-500">
            😞 Oops! Please try again
          </div>
        )}
      </div>
    </div>
  );
}