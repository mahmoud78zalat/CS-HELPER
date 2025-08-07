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
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [mascotState, setMascotState] = useState<'idle' | 'success' | 'error'>('idle');
  
  // SVG element refs
  const yetiRef = useRef<SVGSVGElement>(null);
  const leftEyeRef = useRef<SVGGElement>(null);
  const rightEyeRef = useRef<SVGGElement>(null);
  const leftArmRef = useRef<SVGGElement>(null);
  const rightArmRef = useRef<SVGGElement>(null);
  const mouthRef = useRef<SVGGElement>(null);
  const eyebrowRef = useRef<SVGGElement>(null);
  const signRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const emailFieldRef = useRef<HTMLInputElement>(null);
  const passwordFieldRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();

  // Initialize GSAP timeline for complex animations
  useEffect(() => {
    // Set initial states
    gsap.set([leftArmRef.current, rightArmRef.current], {
      rotation: 0,
      transformOrigin: "50% 100%"
    });
    
    // Idle breathing animation
    gsap.to(yetiRef.current, {
      y: -2,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut"
    });
    
    // Subtle eyebrow animation
    gsap.to(eyebrowRef.current, {
      y: 1,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut"
    });
  }, []);

  // Advanced mouse tracking for realistic eye movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!leftEyeRef.current || !rightEyeRef.current || !containerRef.current || isPasswordFocused || isEmailFocused) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2 - 100;
      
      // Calculate distance and angle
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxDistance = 150; // Maximum tracking distance
      
      // Constrain eye movement based on distance
      const constraintFactor = Math.min(distance / maxDistance, 1);
      const eyeX = (deltaX / maxDistance) * 4 * constraintFactor;
      const eyeY = (deltaY / maxDistance) * 3 * constraintFactor;
      
      // Animate eyes with realistic easing
      gsap.to([leftEyeRef.current, rightEyeRef.current], {
        x: eyeX,
        y: eyeY,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isPasswordFocused, isEmailFocused]);

  // Email field character tracking
  useEffect(() => {
    const handleEmailFocus = () => {
      setIsEmailFocused(true);
      if (!leftEyeRef.current || !rightEyeRef.current) return;
      
      // Look at email field
      gsap.to([leftEyeRef.current, rightEyeRef.current], {
        x: 2,
        y: 8,
        duration: 0.6,
        ease: "back.out(1.7)"
      });
      
      // Happy expression when focusing email
      gsap.to(eyebrowRef.current, {
        y: -2,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    const handleEmailBlur = () => {
      setIsEmailFocused(false);
      gsap.to(eyebrowRef.current, {
        y: 1,
        duration: 0.5,
        ease: "power2.out"
      });
    };

    const handleEmailInput = () => {
      if (!isEmailFocused || !leftEyeRef.current || !rightEyeRef.current) return;
      
      // Create character tracking animation
      const emailLength = email.length;
      const maxMovement = 6;
      const eyeX = Math.min((emailLength * 0.5), maxMovement);
      
      gsap.to([leftEyeRef.current, rightEyeRef.current], {
        x: 2 + eyeX,
        y: 8,
        duration: 0.2,
        ease: "power2.out"
      });
    };

    emailFieldRef.current?.addEventListener('focus', handleEmailFocus);
    emailFieldRef.current?.addEventListener('blur', handleEmailBlur);
    emailFieldRef.current?.addEventListener('input', handleEmailInput);
    
    return () => {
      emailFieldRef.current?.removeEventListener('focus', handleEmailFocus);
      emailFieldRef.current?.removeEventListener('blur', handleEmailBlur);
      emailFieldRef.current?.removeEventListener('input', handleEmailInput);
    };
  }, [email, isEmailFocused]);

  // Password field cover eyes animation
  useEffect(() => {
    if (!leftArmRef.current || !rightArmRef.current || !leftEyeRef.current || !rightEyeRef.current) return;

    if (isPasswordFocused) {
      // Cover eyes with arms - properly positioned
      const tl = gsap.timeline();
      
      // Position left arm to cover left eye at cx="70"
      tl.to(leftArmRef.current, {
        x: 20,
        y: -45,
        rotation: -45,
        duration: 0.6,
        ease: "back.out(1.7)"
      })
      // Position right arm to cover right eye at cx="105" 
      .to(rightArmRef.current, {
        x: -25,
        y: -45,
        rotation: 45,
        duration: 0.6,
        ease: "back.out(1.7)"
      }, "<")
      .to([leftEyeRef.current, rightEyeRef.current], {
        scaleY: 0.1,
        duration: 0.3,
        ease: "power2.out"
      }, "-=0.2")
      .to(eyebrowRef.current, {
        y: 3,
        duration: 0.3,
        ease: "power2.out"
      }, "-=0.4");
      
    } else {
      // Uncover eyes
      const tl = gsap.timeline();
      
      tl.to([leftArmRef.current, rightArmRef.current], {
        x: 0,
        y: 0,
        rotation: 0,
        duration: 0.8,
        ease: "elastic.out(1, 0.5)"
      })
      .to([leftEyeRef.current, rightEyeRef.current], {
        scaleY: 1,
        duration: 0.4,
        ease: "back.out(1.7)"
      }, "-=0.4")
      .to(eyebrowRef.current, {
        y: 1,
        duration: 0.5,
        ease: "power2.out"
      }, "-=0.6");
    }
  }, [isPasswordFocused]);

  // Success animation
  const playSuccessAnimation = () => {
    if (!yetiRef.current || !signRef.current || !mouthRef.current) return;
    
    const tl = gsap.timeline();
    
    // Happy bounce with sign
    tl.to(yetiRef.current, {
      y: -30,
      duration: 0.4,
      ease: "power2.out"
    })
    .to(yetiRef.current, {
      y: -2,
      duration: 0.6,
      ease: "bounce.out"
    })
    .to(signRef.current, {
      rotation: 5,
      duration: 0.2,
      yoyo: true,
      repeat: 3,
      ease: "power2.inOut"
    }, "-=0.8")
    .to(eyebrowRef.current, {
      y: -3,
      duration: 0.3,
      ease: "power2.out"
    }, "-=1")
    .to(mouthRef.current, {
      scaleY: 1.3,
      duration: 0.3,
      ease: "power2.out"
    }, "-=0.8");
  };

  // Error animation
  const playErrorAnimation = () => {
    if (!yetiRef.current || !signRef.current || !mouthRef.current) return;
    
    const tl = gsap.timeline();
    
    // Sad head shake
    tl.to(yetiRef.current, {
      x: -8,
      duration: 0.1,
      yoyo: true,
      repeat: 5,
      ease: "power2.inOut"
    })
    .to(signRef.current, {
      y: 8,
      duration: 0.4,
      yoyo: true,
      repeat: 1,
      ease: "power2.out"
    }, "-=0.4")
    .to(eyebrowRef.current, {
      y: 4,
      rotation: 2,
      duration: 0.4,
      ease: "power2.out"
    }, "-=0.6")
    .to(mouthRef.current, {
      scaleY: 0.7,
      duration: 0.4,
      ease: "power2.out"
    }, "-=0.5");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMascotState('idle');

    try {
      console.log('[Login] Attempting to sign in:', email);
      const { data, error } = await signInWithEmail(email, password);
      
      if (error) {
        console.error('[Login] Sign in error:', error);
        setError(error.message);
        setMascotState('error');
        playErrorAnimation();
        
        // Reset animations after 2 seconds
        setTimeout(() => {
          setMascotState('idle');
          gsap.to([yetiRef.current, signRef.current, eyebrowRef.current, mouthRef.current], {
            x: 0,
            y: yetiRef.current ? -2 : 0,
            rotation: 0,
            scaleY: 1,
            duration: 0.8,
            ease: "power2.out"
          });
        }, 2000);
        return;
      }

      if (data.user) {
        console.log('[Login] User signed in:', data.user.email);
        setMascotState('success');
        playSuccessAnimation();
        
        toast({
          title: "Login Successful! 🎉",
          description: `Welcome back, ${data.user.email}!`,
        });
        
        // Navigate after success animation
        setTimeout(() => setLocation('/'), 2500);
      }
    } catch (err) {
      console.error('[Login] Unexpected error:', err);
      const errorMessage = 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      setMascotState('error');
      playErrorAnimation();
      
      setTimeout(() => {
        setMascotState('idle');
        gsap.to([yetiRef.current, signRef.current, eyebrowRef.current, mouthRef.current], {
          x: 0,
          y: yetiRef.current ? -2 : 0,
          rotation: 0,
          scaleY: 1,
          duration: 0.8,
          ease: "power2.out"
        });
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 flex items-center justify-center p-4 overflow-hidden relative"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating snow particles */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-70 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${4 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        ))}
        
        {/* Mountain silhouettes */}
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-slate-200/20 to-transparent"></div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-2xl w-full">
        
        {/* Professional Yeti Mascot */}
        <div className="relative mb-8 flex justify-center">
          <svg
            ref={yetiRef}
            width="280"
            height="300"
            viewBox="0 0 200 220"
            className="drop-shadow-2xl mx-auto"
          >
            {/* Body */}
            <g className="body">
              <path 
                fill="#f8fafc" 
                stroke="#cbd5e1" 
                strokeWidth="2.5" 
                d="M160,120c-5-8-15-14-26-14H125V65c0-28-22-50-50-50S25,37,25,65v41H15c-10,0-20,5-26,13v65h171V120z"
              />
              <path 
                fill="#e2e8f0" 
                d="M75,140c-23,0-43,11-54,28c16,10,34,16,54,16s39-6,54-16C118,151,98,140,75,140z"
              />
            </g>

            {/* Left Ear */}
            <g className="earL">
              <circle cx="40" cy="75" r="12" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2.5"/>
              <path d="M39 70c-2 0-4 2-4 4s2 4 4 4" stroke="#cbd5e1" strokeWidth="1.5" fill="none"/>
            </g>

            {/* Right Ear */}
            <g className="earR">
              <circle cx="135" cy="75" r="12" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2.5"/>
              <path d="M136 70c2 0 4 2 4 4s-2 4-4 4" stroke="#cbd5e1" strokeWidth="1.5" fill="none"/>
            </g>

            {/* Face */}
            <ellipse cx="87.5" cy="90" rx="40" ry="45" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2"/>

            {/* Hair/Fur Details */}
            <path 
              fill="#ffffff" 
              stroke="#cbd5e1" 
              strokeWidth="2"
              d="M55,45c2-4,6-8,11-12c1,3,2,5,3,8c3-4,9-8,16-11c-1,3-2,7-3,10c5-2,11-4,18-4c-2,3-5,6-8,9"
            />

            {/* Eyebrows */}
            <g ref={eyebrowRef} className="eyebrow">
              <path 
                fill="#ffffff" 
                stroke="#cbd5e1" 
                strokeWidth="2"
                d="M55,65c6,5,13,10,21,15c2-3,4-6,6-8c5,4,10,7,15,10c1-3,2-6,3-9c4,2,8,4,13,5c1-3,1-7,1-10c5-1,10-1,15-3"
              />
            </g>

            {/* Left Eye - Properly positioned for covering animation */}
            <g ref={leftEyeRef} className="eyeL">
              <circle cx="75" cy="82" r="6" fill="white" stroke="#cbd5e1" strokeWidth="1"/>
              <circle cx="75" cy="82" r="3.5" fill="#1e293b"/>
              <circle cx="76" cy="80" r="1" fill="white" opacity="0.9"/>
            </g>

            {/* Right Eye - Properly positioned for covering animation */}
            <g ref={rightEyeRef} className="eyeR">
              <circle cx="105" cy="82" r="6" fill="white" stroke="#cbd5e1" strokeWidth="1"/>
              <circle cx="105" cy="82" r="3.5" fill="#1e293b"/>
              <circle cx="106" cy="80" r="1" fill="white" opacity="0.9"/>
            </g>

            {/* Nose */}
            <ellipse cx="87.5" cy="90" rx="3" ry="5" fill="#f59e0b"/>

            {/* Mouth */}
            <g ref={mouthRef} className="mouth">
              <path 
                d="M 80 100 Q 87.5 105 95 100" 
                stroke="#64748b" 
                strokeWidth="2.5" 
                fill="none" 
                strokeLinecap="round"
              />
            </g>

            {/* Left Arm - Positioned to properly cover left eye */}
            <g ref={leftArmRef} className="armL" style={{transformOrigin: "50px 125px"}}>
              <ellipse 
                cx="50" 
                cy="125" 
                rx="16" 
                ry="32" 
                fill="#f1f5f9" 
                stroke="#cbd5e1" 
                strokeWidth="2"
                transform="rotate(-15 50 125)"
              />
              <circle cx="42" cy="110" r="14" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2"/>
            </g>

            {/* Right Arm - Positioned to properly cover right eye */}
            <g ref={rightArmRef} className="armR" style={{transformOrigin: "130px 125px"}}>
              <ellipse 
                cx="130" 
                cy="125" 
                rx="16" 
                ry="32" 
                fill="#f1f5f9" 
                stroke="#cbd5e1" 
                strokeWidth="2"
                transform="rotate(15 130 125)"
              />
              <circle cx="138" cy="110" r="14" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2"/>
            </g>

            {/* Success sparkles */}
            {mascotState === 'success' && (
              <>
                <circle cx="50" cy="50" r="2" fill="#fbbf24" className="animate-ping"/>
                <circle cx="125" cy="45" r="1.5" fill="#fbbf24" className="animate-ping" style={{animationDelay: '0.2s'}}/>
                <circle cx="45" cy="60" r="1" fill="#fbbf24" className="animate-ping" style={{animationDelay: '0.4s'}}/>
              </>
            )}
          </svg>
        </div>

        {/* Login Form as Professional Sign */}
        <div ref={signRef} className="relative mx-auto">
          {/* Wooden Sign Background */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-4 border-amber-800 rounded-xl p-8 shadow-2xl relative overflow-hidden w-full max-w-md mx-auto">
            {/* Wood grain texture */}
            <div className="absolute inset-0 opacity-10">
              <div className="w-full h-0.5 bg-amber-700 absolute top-6"></div>
              <div className="w-full h-0.5 bg-amber-700 absolute top-12"></div>
              <div className="w-full h-0.5 bg-amber-700 absolute bottom-12"></div>
              <div className="w-full h-0.5 bg-amber-700 absolute bottom-6"></div>
            </div>
            
            {/* Sign posts */}
            <div className="absolute -top-8 left-8 w-4 h-16 bg-amber-900 rounded-sm shadow-lg"></div>
            <div className="absolute -top-8 right-8 w-4 h-16 bg-amber-900 rounded-sm shadow-lg"></div>
            
            {/* Metal corner reinforcements */}
            <div className="absolute top-3 left-3 w-4 h-4 bg-gray-600 rounded-sm transform rotate-45"></div>
            <div className="absolute top-3 right-3 w-4 h-4 bg-gray-600 rounded-sm transform rotate-45"></div>
            <div className="absolute bottom-3 left-3 w-4 h-4 bg-gray-600 rounded-sm transform rotate-45"></div>
            <div className="absolute bottom-3 right-3 w-4 h-4 bg-gray-600 rounded-sm transform rotate-45"></div>
            
            <div className="relative z-10">
              <h1 className="text-3xl font-bold text-amber-900 text-center mb-6 font-serif drop-shadow-sm">
                🏔️ Welcome Back! 🏔️
              </h1>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-amber-800 font-bold text-lg">
                    Email
                  </Label>
                  <Input
                    ref={emailFieldRef}
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/95 border-2 border-amber-400 focus:border-amber-600 focus:ring-amber-500 text-lg p-4 rounded-lg shadow-inner transition-all duration-300"
                    data-testid="input-email"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-amber-800 font-bold text-lg">
                    Password
                  </Label>
                  <Input
                    ref={passwordFieldRef}
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    className="bg-white/95 border-2 border-amber-400 focus:border-amber-600 focus:ring-amber-500 text-lg p-4 rounded-lg shadow-inner transition-all duration-300"
                    data-testid="input-password"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-100/90 border-2 border-red-400 text-red-800 px-4 py-3 rounded-lg text-sm font-medium shadow-inner animate-in fade-in duration-300">
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
                      Entering the Mountain...
                    </div>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </form>
              
              <div className="mt-4 text-center text-amber-700 text-sm font-medium">
                🔐 Use your registered email and password
              </div>
            </div>
          </div>
          
          {/* Sign shadow */}
          <div className="absolute inset-0 bg-amber-900/30 rounded-xl transform translate-x-2 translate-y-2 -z-10"></div>
        </div>

        {/* Status Messages */}
        {mascotState === 'success' && (
          <div className="mt-6 text-green-600 font-bold text-lg text-center animate-in fade-in duration-500">
            🎉 Welcome back, friend!
          </div>
        )}
        
        {mascotState === 'error' && (
          <div className="mt-6 text-red-600 font-bold text-lg text-center animate-in fade-in duration-500">
            😞 Oops! Please try again
          </div>
        )}
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