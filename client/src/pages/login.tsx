import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmail } from '@/lib/supabase';
import { useSiteName } from '@/hooks/useSiteName';
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
  const [showingAnimation, setShowingAnimation] = useState(false);
  
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
  const { data: siteName, isLoading: isSiteNameLoading } = useSiteName();

  // Cleanup global flag on component unmount
  useEffect(() => {
    return () => {
      (window as any).showingLoginAnimation = false;
    };
  }, []);

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
      
      // Constrain eye movement based on distance with much more downward movement
      const constraintFactor = Math.min(distance / maxDistance, 1);
      const maxEyeMovementX = 6; // Allow more horizontal movement
      const maxEyeMovementY = 8; // Allow much more downward movement to look at bottom
      const eyeX = Math.max(-maxEyeMovementX, Math.min(maxEyeMovementX, (deltaX / maxDistance) * maxEyeMovementX * constraintFactor));
      const eyeY = Math.max(-maxEyeMovementY, Math.min(maxEyeMovementY, (deltaY / maxDistance) * maxEyeMovementY * constraintFactor));
      
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
      
      // Look down at email field naturally (positioned lower)
      gsap.to([leftEyeRef.current, rightEyeRef.current], {
        x: 0,
        y: 8, // Look much further down to see email input at bottom
        duration: 0.8,
        ease: "power2.inOut"
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
      
      // Create character tracking animation - eyes follow typing naturally
      const emailLength = email.length;
      const maxEyeMovementX = 6; // Allow more horizontal movement
      const maxEyeMovementY = 8; // Allow more downward movement
      const eyeX = Math.min((emailLength * 0.2), maxEyeMovementX);
      
      gsap.to([leftEyeRef.current, rightEyeRef.current], {
        x: Math.max(-maxEyeMovementX, Math.min(maxEyeMovementX, eyeX)),
        y: Math.max(-maxEyeMovementY, Math.min(maxEyeMovementY, 8)), // Look down at email input at bottom
        duration: 0.3,
        ease: "power2.inOut"
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

  // Password field - hide hands and close eyes animation
  useEffect(() => {
    if (!leftArmRef.current || !rightArmRef.current || !leftEyeRef.current || !rightEyeRef.current) return;

    if (isPasswordFocused) {
      // Only close eyes when password is focused (keep arms visible)
      const tl = gsap.timeline();
      
      // Close eyes for privacy - FORCE the animation
      tl.to([leftEyeRef.current, rightEyeRef.current], {
        scaleY: 0.05, // Close eyes completely
        transformOrigin: "center center",
        duration: 0.4,
        ease: "power2.out",
        force3D: true
      })
      // Sleepy eyebrows
      .to(eyebrowRef.current, {
        y: 4, // More sleepy eyebrows
        duration: 0.3,
        ease: "power2.out"
      }, "-=0.2");
      
    } else {
      // Open eyes when password field loses focus
      const tl = gsap.timeline();
      
      // Open eyes first
      tl.to([leftEyeRef.current, rightEyeRef.current], {
        scaleY: 1, // Open eyes fully
        x: 0,
        y: 0, // Return eyes to center
        transformOrigin: "center center",
        duration: 0.5,
        ease: "back.out(1.7)",
        force3D: true
      })
      // Normal eyebrows
      .to(eyebrowRef.current, {
        y: 1,
        duration: 0.5,
        ease: "power2.out"
      }, "-=0.3");
    }
  }, [isPasswordFocused]);

  // Enhanced success animation with more celebration
  const playSuccessAnimation = () => {
    if (!yetiRef.current || !signRef.current || !mouthRef.current) return;
    
    const tl = gsap.timeline();
    
    // Initial happy bounce - bigger and more visible
    tl.to(yetiRef.current, {
      y: -50, // Higher bounce for more excitement
      duration: 0.5,
      ease: "power2.out"
    })
    .to(yetiRef.current, {
      y: -2,
      duration: 0.8,
      ease: "bounce.out"
    })
    // Multiple sign wiggles for celebration
    .to(signRef.current, {
      rotation: 8, // More rotation for excitement
      duration: 0.15,
      yoyo: true,
      repeat: 7, // More wiggles
      ease: "power2.inOut"
    }, "-=1.2")
    // Very happy eyebrows
    .to(eyebrowRef.current, {
      y: -5, // More movement
      duration: 0.4,
      ease: "power2.out"
    }, "-=1.3")
    // Big smile
    .to(mouthRef.current, {
      scaleY: 1.5, // Bigger smile
      duration: 0.4,
      ease: "power2.out"
    }, "-=1.1")
    // Add a second celebration bounce after 1.5 seconds
    .to(yetiRef.current, {
      y: -25,
      duration: 0.3,
      ease: "power2.out"
    }, "+=0.5")
    .to(yetiRef.current, {
      y: -2,
      duration: 0.5,
      ease: "bounce.out"
    });
  };

  // Enhanced error animation with proper angry expression
  const playErrorAnimation = () => {
    if (!yetiRef.current || !signRef.current || !mouthRef.current) return;
    
    const tl = gsap.timeline();
    
    // Fast head shake (angry gesture)
    tl.to(yetiRef.current, {
      x: -6,
      duration: 0.08,
      yoyo: true,
      repeat: 5,
      ease: "power2.inOut"
    })
    // Sign drops slightly showing frustration
    .to(signRef.current, {
      y: 12,
      rotation: -2,
      duration: 0.3,
      ease: "power2.out"
    }, "-=0.3")
    .to(signRef.current, {
      y: 0,
      rotation: 0,
      duration: 0.5,
      ease: "bounce.out"
    })
    // Angry eyebrows
    .to(eyebrowRef.current, {
      y: 6,
      rotation: -5,
      duration: 0.4,
      ease: "power2.out"
    }, "-=0.8")
    // Sad/angry mouth (frown)
    .to(mouthRef.current, {
      scaleY: 0.5,
      rotation: 180,
      duration: 0.4,
      ease: "power2.out"
    }, "-=0.6")
    // Eyes show disappointment
    .to([leftEyeRef.current, rightEyeRef.current], {
      scaleX: 0.8,
      y: 2,
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
      // Set the animation flag BEFORE calling signInWithEmail to prevent immediate redirect
      (window as any).showingLoginAnimation = true;
      
      const { data, error } = await signInWithEmail(email, password);
      
      if (error) {
        console.error('[Login] Sign in error:', error);
        setError(error.message);
        setMascotState('error');
        playErrorAnimation();
        
        // Clear the animation flag on error
        (window as any).showingLoginAnimation = false;
        
        // Reset animations after 3 seconds for better visibility
        setTimeout(() => {
          setMascotState('idle');
          gsap.to([yetiRef.current, signRef.current, eyebrowRef.current, mouthRef.current, leftEyeRef.current, rightEyeRef.current], {
            x: 0,
            y: yetiRef.current ? -2 : 0,
            rotation: 0,
            scaleY: 1,
            scaleX: 1,
            duration: 1,
            ease: "power2.out"
          });
        }, 3000);
        return;
      }

      if (data.user) {
        setShowingAnimation(true);
        
        // Set global flag to prevent App.tsx from redirecting immediately
        (window as any).showingLoginAnimation = true;
        
        setMascotState('success');
        playSuccessAnimation();
        
        toast({
          title: "Login Successful! 🎉",
          description: `Welcome back, ${data.user.email}!`,
        });
        
        // Navigate after success animation (3 seconds to fully see the happy yeti animation)
        setTimeout(() => {
          setShowingAnimation(false);
          // Clear the global flag so normal routing resumes
          (window as any).showingLoginAnimation = false;
          setLocation('/');
        }, 3000);
      }
    } catch (err) {
      console.error('[Login] Unexpected error:', err);
      const errorMessage = 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      setMascotState('error');
      playErrorAnimation();
      
      setTimeout(() => {
        setMascotState('idle');
        gsap.to([yetiRef.current, signRef.current, eyebrowRef.current, mouthRef.current, leftEyeRef.current, rightEyeRef.current], {
          x: 0,
          y: yetiRef.current ? -2 : 0,
          rotation: 0,
          scaleY: 1,
          scaleX: 1,
          duration: 1,
          ease: "power2.out"
        });
      }, 3000);
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

      {/* Main Container with Yeti behind the sign */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-2xl w-full">
        
        {/* Container for Yeti + Sign - Yeti positioned behind */}
        <div className="relative flex flex-col items-center">
          
          {/* Professional Yeti Mascot - Positioned behind the sign */}
          <div className="relative">
            <svg
              ref={yetiRef}
              width="300"
              height="320"
              viewBox="0 0 175 240"
              className="drop-shadow-lg"
            >
            {/* Complete Body with Torso and Shoulders */}
            <g className="body">
              {/* Main torso */}
              <ellipse cx="87.5" cy="155" rx="50" ry="60" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2.5"/>
              
              {/* Shoulders */}
              <ellipse cx="87.5" cy="125" rx="60" ry="25" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2"/>
              
              {/* Chest detail */}
              <ellipse cx="87.5" cy="140" rx="35" ry="25" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5"/>
              
              {/* Belly */}
              <ellipse cx="87.5" cy="175" rx="30" ry="20" fill="#e2e8f0" strokeWidth="0"/>
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

            {/* Hair/Fur Details - Fixed */}
            <g className="hair">
              <circle cx="65" cy="50" r="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.8"/>
              <circle cx="85" cy="45" r="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.9"/>
              <circle cx="105" cy="48" r="7" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.8"/>
              <circle cx="75" cy="35" r="5" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.7"/>
              <circle cx="95" cy="38" r="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.8"/>
            </g>

            {/* Eyebrows - Simplified */}
            <g ref={eyebrowRef} className="eyebrow">
              <ellipse cx="72" cy="70" rx="8" ry="3" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.9"/>
              <ellipse cx="103" cy="70" rx="8" ry="3" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" opacity="0.9"/>
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

            {/* Left Arm - Connected to shoulder, hand covers left eye */}
            <g ref={leftArmRef} className="armL" style={{transformOrigin: "55px 125px"}}>
              {/* Upper arm from shoulder */}
              <ellipse 
                cx="55" 
                cy="135" 
                rx="12" 
                ry="25" 
                fill="#f1f5f9" 
                stroke="#cbd5e1" 
                strokeWidth="2"
                transform="rotate(-20 55 135)"
              />
              {/* Forearm */}
              <ellipse 
                cx="48" 
                cy="115" 
                rx="8" 
                ry="18" 
                fill="#f1f5f9" 
                stroke="#cbd5e1" 
                strokeWidth="2"
                transform="rotate(-30 48 115)"
              />
              {/* Hand - will move to cover left eye at cx="75" cy="82" */}
              <circle cx="45" cy="100" r="11" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2"/>
            </g>

            {/* Right Arm - Connected to shoulder, hand covers right eye */}
            <g ref={rightArmRef} className="armR" style={{transformOrigin: "120px 125px"}}>
              {/* Upper arm from shoulder */}
              <ellipse 
                cx="120" 
                cy="135" 
                rx="12" 
                ry="25" 
                fill="#f1f5f9" 
                stroke="#cbd5e1" 
                strokeWidth="2"
                transform="rotate(20 120 135)"
              />
              {/* Forearm */}
              <ellipse 
                cx="127" 
                cy="115" 
                rx="8" 
                ry="18" 
                fill="#f1f5f9" 
                stroke="#cbd5e1" 
                strokeWidth="2"
                transform="rotate(30 127 115)"
              />
              {/* Hand - will move to cover right eye at cx="105" cy="82" */}
              <circle cx="130" cy="100" r="11" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2"/>
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

          {/* Login Form as Professional Sign - Positioned in front of Yeti */}
          <div ref={signRef} className="relative -mt-24 z-10">
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
                {/* Site Name Display - Clean styling replacing Welcome Back */}
                <h1 className="text-3xl font-bold text-amber-900 text-center mb-6 font-serif drop-shadow-sm">
                  {isSiteNameLoading ? (
                    <div className="animate-pulse">
                      <div className="h-8 bg-amber-200 rounded-lg w-3/4 mx-auto"></div>
                    </div>
                  ) : (
                    siteName
                  )}
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
                      Signing in...
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