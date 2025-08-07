import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmail } from '@/lib/supabase';
import gsap from 'gsap';

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  
  const yetiRef = useRef<SVGSVGElement>(null);
  const leftEyeRef = useRef<SVGCircleElement>(null);
  const rightEyeRef = useRef<SVGCircleElement>(null);
  const leftHandRef = useRef<SVGGElement>(null);
  const rightHandRef = useRef<SVGGElement>(null);
  const signRef = useRef<HTMLDivElement>(null);
  const mouthRef = useRef<SVGPathElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();

  // Mouse tracking for eye movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!leftEyeRef.current || !rightEyeRef.current || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2 - 100;
      
      const deltaX = (e.clientX - centerX) / 40;
      const deltaY = (e.clientY - centerY) / 40;
      
      const constrainedX = Math.max(-4, Math.min(4, deltaX));
      const constrainedY = Math.max(-3, Math.min(3, deltaY));
      
      if (!isPasswordFocused) {
        gsap.to([leftEyeRef.current, rightEyeRef.current], {
          x: constrainedX,
          y: constrainedY,
          duration: 0.3,
          ease: "power2.out"
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isPasswordFocused]);

  // Password focus animation
  useEffect(() => {
    if (!leftHandRef.current || !rightHandRef.current || !leftEyeRef.current || !rightEyeRef.current) return;

    if (isPasswordFocused) {
      // Cover eyes animation
      gsap.to(leftHandRef.current, {
        x: 25,
        y: -15,
        rotation: 15,
        duration: 0.6,
        ease: "back.out(1.7)"
      });
      gsap.to(rightHandRef.current, {
        x: -25,
        y: -15,
        rotation: -15,
        duration: 0.6,
        ease: "back.out(1.7)"
      });
      
      // Hide eyes
      gsap.to([leftEyeRef.current, rightEyeRef.current], {
        opacity: 0,
        duration: 0.3
      });
    } else {
      // Uncover eyes animation
      gsap.to([leftHandRef.current, rightHandRef.current], {
        x: 0,
        y: 0,
        rotation: 0,
        duration: 0.8,
        ease: "elastic.out(1, 0.5)"
      });
      
      // Show eyes
      gsap.to([leftEyeRef.current, rightEyeRef.current], {
        opacity: 1,
        duration: 0.3,
        delay: 0.2
      });
    }
  }, [isPasswordFocused]);

  // Success animation
  const playSuccessAnimation = () => {
    if (!yetiRef.current || !signRef.current || !mouthRef.current) return;
    
    // Happy bounce
    gsap.to(yetiRef.current, {
      y: -20,
      duration: 0.3,
      yoyo: true,
      repeat: 1,
      ease: "power2.out"
    });
    
    // Sign wiggle
    gsap.to(signRef.current, {
      rotation: 3,
      duration: 0.2,
      yoyo: true,
      repeat: 3,
      ease: "power2.inOut"
    });
    
    // Smile
    if (mouthRef.current) {
      mouthRef.current.setAttribute('d', 'M 85 95 Q 100 105 115 95');
      mouthRef.current.setAttribute('stroke', '#22c55e');
    }
  };

  // Error animation
  const playErrorAnimation = () => {
    if (!yetiRef.current || !signRef.current || !mouthRef.current) return;
    
    // Head shake
    gsap.to(yetiRef.current, {
      x: -10,
      duration: 0.1,
      yoyo: true,
      repeat: 5,
      ease: "power2.inOut"
    });
    
    // Sign drop slightly
    gsap.to(signRef.current, {
      y: 10,
      duration: 0.3,
      yoyo: true,
      repeat: 1,
      ease: "power2.out"
    });
    
    // Frown
    if (mouthRef.current) {
      mouthRef.current.setAttribute('d', 'M 85 100 Q 100 90 115 100');
      mouthRef.current.setAttribute('stroke', '#ef4444');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Reset mouth to neutral
    if (mouthRef.current) {
      mouthRef.current.setAttribute('d', 'M 95 95 L 105 95');
      mouthRef.current.setAttribute('stroke', '#64748b');
    }

    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      console.log('[Login] Attempting to sign in:', email);
      const { data, error } = await signInWithEmail(email, password);
      
      if (error) {
        console.error('[Login] Sign in error:', error);
        setError(error.message);
        playErrorAnimation();
        
        // Reset to neutral after error animation
        setTimeout(() => {
          if (mouthRef.current) {
            mouthRef.current.setAttribute('d', 'M 95 95 L 105 95');
            mouthRef.current.setAttribute('stroke', '#64748b');
          }
        }, 2000);
        return;
      }

      if (data.user) {
        console.log('[Login] User signed in:', data.user.email);
        playSuccessAnimation();
        
        toast({
          title: "Login Successful! 🎉",
          description: `Welcome back, ${data.user.email}!`,
        });
        
        // Navigate after success animation
        setTimeout(() => setLocation('/'), 2000);
      }
    } catch (err) {
      console.error('[Login] Unexpected error:', err);
      const errorMessage = 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      playErrorAnimation();
      
      // Reset to neutral after error animation
      setTimeout(() => {
        if (mouthRef.current) {
          mouthRef.current.setAttribute('d', 'M 95 95 L 105 95');
          mouthRef.current.setAttribute('stroke', '#64748b');
        }
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-100 to-indigo-200 flex items-center justify-center p-4 overflow-hidden relative"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating snow particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
        
        {/* Mountain silhouettes */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-300/30 to-transparent"></div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-lg w-full">
        
        {/* Yeti Mascot */}
        <div className="relative mb-6">
          <svg
            ref={yetiRef}
            width="280"
            height="320"
            viewBox="0 0 280 320"
            className="drop-shadow-2xl"
          >
            {/* Yeti Body */}
            <ellipse
              cx="140"
              cy="220"
              rx="75"
              ry="95"
              fill="url(#bodyGradient)"
              stroke="#cbd5e1"
              strokeWidth="2"
            />
            
            {/* Yeti Head */}
            <ellipse
              cx="140"
              cy="100"
              rx="60"
              ry="55"
              fill="url(#headGradient)"
              stroke="#cbd5e1"
              strokeWidth="2"
            />
            
            {/* Fur texture details */}
            <circle cx="110" cy="80" r="8" fill="#e2e8f0" opacity="0.7" />
            <circle cx="170" cy="75" r="6" fill="#e2e8f0" opacity="0.7" />
            <circle cx="140" cy="60" r="10" fill="#e2e8f0" opacity="0.7" />
            <circle cx="100" cy="110" r="5" fill="#e2e8f0" opacity="0.7" />
            <circle cx="180" cy="105" r="7" fill="#e2e8f0" opacity="0.7" />
            <circle cx="120" cy="200" r="12" fill="#e2e8f0" opacity="0.6" />
            <circle cx="160" cy="190" r="10" fill="#e2e8f0" opacity="0.6" />
            <circle cx="140" cy="240" r="8" fill="#e2e8f0" opacity="0.6" />
            
            {/* Left Arm/Hand */}
            <g ref={leftHandRef}>
              <ellipse
                cx="75"
                cy="180"
                rx="25"
                ry="45"
                fill="url(#armGradient)"
                stroke="#cbd5e1"
                strokeWidth="2"
                transform="rotate(-25 75 180)"
              />
              <circle cx="60" cy="155" r="18" fill="url(#handGradient)" stroke="#cbd5e1" strokeWidth="2" />
              <circle cx="55" cy="150" r="4" fill="#e2e8f0" opacity="0.8" />
              <circle cx="65" cy="160" r="3" fill="#e2e8f0" opacity="0.8" />
            </g>
            
            {/* Right Arm/Hand */}
            <g ref={rightHandRef}>
              <ellipse
                cx="205"
                cy="180"
                rx="25"
                ry="45"
                fill="url(#armGradient)"
                stroke="#cbd5e1"
                strokeWidth="2"
                transform="rotate(25 205 180)"
              />
              <circle cx="220" cy="155" r="18" fill="url(#handGradient)" stroke="#cbd5e1" strokeWidth="2" />
              <circle cx="225" cy="150" r="4" fill="#e2e8f0" opacity="0.8" />
              <circle cx="215" cy="160" r="3" fill="#e2e8f0" opacity="0.8" />
            </g>
            
            {/* Eyes */}
            <circle cx="120" cy="85" r="12" fill="white" stroke="#cbd5e1" strokeWidth="1" />
            <circle cx="160" cy="85" r="12" fill="white" stroke="#cbd5e1" strokeWidth="1" />
            <circle
              ref={leftEyeRef}
              cx="120"
              cy="85"
              r="6"
              fill="#1e293b"
            />
            <circle
              ref={rightEyeRef}
              cx="160"
              cy="85"
              r="6"
              fill="#1e293b"
            />
            <circle cx="122" cy="83" r="2" fill="white" opacity="0.8" />
            <circle cx="162" cy="83" r="2" fill="white" opacity="0.8" />
            
            {/* Nose */}
            <ellipse cx="140" cy="95" rx="4" ry="6" fill="#f59e0b" />
            <ellipse cx="140" cy="93" rx="1" ry="2" fill="#fbbf24" />
            
            {/* Mouth */}
            <path
              ref={mouthRef}
              d="M 95 95 L 105 95"
              stroke="#64748b"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            
            {/* Gradients */}
            <defs>
              <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor:'#f8fafc'}} />
                <stop offset="50%" style={{stopColor:'#e1f5fe'}} />
                <stop offset="100%" style={{stopColor:'#e3f2fd'}} />
              </linearGradient>
              <linearGradient id="headGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor:'#ffffff'}} />
                <stop offset="50%" style={{stopColor:'#f0f9ff'}} />
                <stop offset="100%" style={{stopColor:'#e0f2fe'}} />
              </linearGradient>
              <linearGradient id="armGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor:'#f1f5f9'}} />
                <stop offset="100%" style={{stopColor:'#e2e8f0'}} />
              </linearGradient>
              <linearGradient id="handGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor:'#f8fafc'}} />
                <stop offset="100%" style={{stopColor:'#f1f5f9'}} />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Login Form as Wooden Sign */}
        <div ref={signRef} className="relative">
          {/* Wooden Sign Background */}
          <div className="bg-gradient-to-br from-amber-100 to-amber-200 border-4 border-amber-800 rounded-xl p-8 shadow-2xl relative overflow-hidden">
            {/* Wood grain texture */}
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-1 bg-amber-700 absolute top-4"></div>
              <div className="w-full h-1 bg-amber-700 absolute top-8"></div>
              <div className="w-full h-1 bg-amber-700 absolute bottom-8"></div>
              <div className="w-full h-1 bg-amber-700 absolute bottom-4"></div>
            </div>
            
            {/* Sign posts/supports */}
            <div className="absolute -top-6 left-6 w-3 h-12 bg-amber-900 rounded-sm shadow-lg"></div>
            <div className="absolute -top-6 right-6 w-3 h-12 bg-amber-900 rounded-sm shadow-lg"></div>
            
            {/* Rope/chain details */}
            <div className="absolute -top-3 left-8 w-8 h-2 bg-amber-800 rounded-full"></div>
            <div className="absolute -top-3 right-8 w-8 h-2 bg-amber-800 rounded-full"></div>
            
            {/* Metal corner reinforcements */}
            <div className="absolute top-2 left-2 w-3 h-3 bg-gray-600 rounded-sm"></div>
            <div className="absolute top-2 right-2 w-3 h-3 bg-gray-600 rounded-sm"></div>
            <div className="absolute bottom-2 left-2 w-3 h-3 bg-gray-600 rounded-sm"></div>
            <div className="absolute bottom-2 right-2 w-3 h-3 bg-gray-600 rounded-sm"></div>
            
            <div className="relative z-10">
              <h1 className="text-3xl font-bold text-amber-900 text-center mb-6 font-serif drop-shadow-sm">
                🏔️ Welcome Back! 🏔️
              </h1>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-amber-800 font-bold text-lg">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/95 border-2 border-amber-400 focus:border-amber-600 focus:ring-amber-500 text-lg p-3 rounded-lg shadow-inner"
                    data-testid="input-email"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-amber-800 font-bold text-lg">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    className="bg-white/95 border-2 border-amber-400 focus:border-amber-600 focus:ring-amber-500 text-lg p-3 rounded-lg shadow-inner"
                    data-testid="input-password"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-100/90 border-2 border-red-400 text-red-800 px-4 py-3 rounded-lg text-sm font-medium shadow-inner">
                    ❌ {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white font-bold text-lg py-4 px-6 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-2 border-amber-900"
                  disabled={isLoading}
                  data-testid="button-submit"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Entering the Cave...
                    </div>
                  ) : (
                    '🚪 Enter the Mountain Portal'
                  )}
                </Button>
              </form>
              
              <div className="mt-4 text-center text-amber-700 text-sm font-medium">
                🔐 Use your registered email and password
              </div>
            </div>
          </div>
          
          {/* Sign shadow */}
          <div className="absolute inset-0 bg-amber-900/40 rounded-xl transform translate-x-2 translate-y-2 -z-10"></div>
        </div>
      </div>

      {/* Custom CSS for floating animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
      `}</style>
    </div>
  );
}