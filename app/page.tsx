'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TopBanner from '@/components/TopBanner';
import { 
  ArrowRight, 
  BarChart3, 
  Link2, 
  Palette, 
  Zap, 
  Users, 
  TrendingUp,
  CheckCircle2,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Instagram,
  Youtube,
  Twitter,
  Mail,
  MousePointerClick,
  Globe,
  Rocket
} from 'lucide-react';

export default function Home() {
  const { data: session, status } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [username, setUsername] = useState('');

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const features = [
    {
      icon: Link2,
      title: 'Unlimited Links',
      description: 'Add as many links as you want to your bio page. No restrictions, no limits.',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Palette,
      title: 'Custom Templates',
      description: 'Choose from beautiful templates or create your own unique design.',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Track clicks, views, and engagement with powerful analytics tools.',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized for speed. Your page loads instantly everywhere.',
      gradient: 'from-green-500 to-emerald-500',
    },
  ];

  const stats = [
    { label: 'Active Users', value: '50K+' },
    { label: 'Links Created', value: '1M+' },
    { label: 'Click-through Rate', value: '94%' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Top Banner */}
        <TopBanner />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image src="/imgs/logo.png" alt="HereMyLinks" width={180} height={45} priority className="h-10 w-auto" />
          </div>

            <div className="flex items-center gap-3">
            {status === 'loading' ? (
                <div className="h-10 w-32 bg-slate-200 animate-pulse rounded-lg" />
            ) : session ? (
                <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  onBlur={() => setTimeout(() => setShowUserMenu(false), 200)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  {session.user?.image || (session.user as any)?.profileImage ? (
                    <Image
                      src={session.user?.image || (session.user as any)?.profileImage}
                      alt={session.user?.name || 'User'}
                        width={32}
                        height={32}
                        className="rounded-full"
                    />
                  ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                      {session.user?.name?.charAt(0).toUpperCase() || session.user?.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                    <span className="text-sm font-medium hidden sm:block">{session.user?.name || session.user?.email}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1">
                      <Link 
                        href="/dashboard" 
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                      <button 
                        onClick={handleLogout} 
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                  <Button asChild variant="ghost">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    <Link href="/login">Get Started</Link>
                  </Button>
              </>
            )}
          </div>
        </div>
      </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 py-20 lg:py-32">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <Badge className="mb-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 px-4 py-2 text-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              Trusted by 50,000+ creators worldwide
            </Badge>
            
            {/* Main Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
              <span className="block mb-2">Your Links,</span>
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
                All in One Place
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Create a stunning landing page for your links in minutes. 
              <span className="font-semibold text-slate-900"> Share everywhere, grow faster.</span>
            </p>

            {/* Username Input with Integrated Button */}
            <div className="max-w-3xl mx-auto mb-8">
              <div className="relative flex items-center bg-white rounded-2xl p-2 shadow-2xl border-2 border-slate-200 focus-within:border-purple-400 focus-within:shadow-purple-200 transition-all duration-300 hover:shadow-purple-100">
                {/* Input Section */}
                <div className="flex items-center flex-1 px-4 min-w-0">
                  <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold whitespace-nowrap select-none">
                    <Globe className="w-5 h-5 text-purple-500 flex-shrink-0" />
                    <span className="hidden sm:inline">heremylinks.com/</span>
                    <span className="sm:hidden">hml.com/</span>
                  </div>
                  <input
                    type="text"
                    placeholder="yourname"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="flex-1 outline-none py-3 px-3 text-lg font-bold text-slate-900 placeholder:text-slate-400 bg-transparent min-w-0"
                  />
                </div>

                {/* Integrated Button */}
                <Button 
                  asChild 
                  className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-bold text-base px-6 py-6 whitespace-nowrap group flex-shrink-0"
                >
                  <Link href="/login" className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    <span className="hidden sm:inline">Get Started Free</span>
                    <span className="sm:hidden">Start</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
                </Button>
              </div>

              {/* Helper Text Below */}
              <p className="text-center text-sm text-slate-500 mt-3">
                ✨ Create your link in <span className="font-semibold text-slate-700">under 2 minutes</span> • No credit card required
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                </div>
                <span className="font-medium">Free forever</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                </div>
                <span className="font-medium">No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                </div>
                <span className="font-medium">Setup in 2 minutes</span>
              </div>
            </div>

            {/* Visual Elements - Link Cards Preview */}
            <div className="mt-16 relative">
              <div className="flex items-center justify-center gap-4 flex-wrap">
                {/* Mock Link Cards */}
                <div className="w-64 h-16 bg-white rounded-2xl shadow-lg border-2 border-slate-200 flex items-center gap-3 px-4 hover:scale-105 transition-transform">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="h-2.5 bg-slate-300 rounded w-3/4 mb-1.5" />
                    <div className="h-2 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
                
                <div className="w-64 h-16 bg-white rounded-2xl shadow-lg border-2 border-purple-200 flex items-center gap-3 px-4 hover:scale-105 transition-transform">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Instagram className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="h-2.5 bg-slate-300 rounded w-3/4 mb-1.5" />
                    <div className="h-2 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
                
                <div className="w-64 h-16 bg-white rounded-2xl shadow-lg border-2 border-slate-200 flex items-center gap-3 px-4 hover:scale-105 transition-transform">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <Youtube className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="h-2.5 bg-slate-300 rounded w-3/4 mb-1.5" />
                    <div className="h-2 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CSS for animations */}
        <style jsx>{`
          @keyframes blob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(20px, -50px) scale(1.1); }
            50% { transform: translate(-20px, 20px) scale(0.9); }
            75% { transform: translate(20px, 50px) scale(1.05); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
          @keyframes gradient {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          .animate-gradient {
            background-size: 200% auto;
            animation: gradient 3s linear infinite;
          }
        `}</style>
      </section>

      {/* Stats Section - Redesigned */}
      <section className="relative py-16 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-white/5" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Stat Card 1 - Active Users */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all group">
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="text-5xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-2">
                  50K+
                </div>
                <div className="text-slate-300 font-semibold text-lg">Active Users</div>
                <p className="text-slate-400 text-sm mt-2">Growing every day</p>
              </CardContent>
            </Card>

            {/* Stat Card 2 - Links Created */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all group">
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-4 group-hover:scale-110 transition-transform">
                  <Link2 className="w-8 h-8 text-white" />
                </div>
                <div className="text-5xl font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent mb-2">
                  1M+
                </div>
                <div className="text-slate-300 font-semibold text-lg">Links Created</div>
                <p className="text-slate-400 text-sm mt-2">And counting...</p>
              </CardContent>
            </Card>

            {/* Stat Card 3 - Click Rate */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all group">
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 mb-4 group-hover:scale-110 transition-transform">
                  <MousePointerClick className="w-8 h-8 text-white" />
                </div>
                <div className="text-5xl font-bold bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent mb-2">
                  94%
                </div>
                <div className="text-slate-300 font-semibold text-lg">Click-through Rate</div>
                <p className="text-slate-400 text-sm mt-2">Industry leading</p>
              </CardContent>
            </Card>
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <p className="text-slate-300 text-lg mb-4">
              Join thousands of creators who trust HereMyLinks
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-slate-900" />
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 border-2 border-slate-900" />
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 border-2 border-slate-900" />
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-400 border-2 border-slate-900" />
                <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-white">
                  +50K
                </div>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          .bg-grid-white\/5 {
            background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
            background-size: 50px 50px;
          }
        `}</style>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="outline">Features</Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Grow Online
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Powerful features designed to help you connect with your audience and achieve your goals.
            </p>
      </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-slate-200 hover:shadow-lg transition-shadow duration-300 group">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-slate-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Analytics CTA Section */}
      <section className="py-24 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Analytics Card */}
            <div className="order-2 lg:order-1">
              <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-0 shadow-2xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <TrendingUp className="w-5 h-5" />
                      <span className="text-sm font-semibold">Analytics Dashboard</span>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="text-5xl font-bold text-white mb-2">43,500</div>
                        <div className="text-slate-400">Total Clicks This Month</div>
                      </div>
                      
                      {/* Simple Chart Visualization */}
                      <div className="h-32 flex items-end gap-2">
                        {[40, 60, 45, 80, 55, 90, 70, 95, 75, 100].map((height, i) => (
                          <div key={i} className="flex-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-lg opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${height}%` }} />
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
                        <div>
                          <div className="text-2xl font-bold text-white">2.4K</div>
                          <div className="text-xs text-slate-400">New Visitors</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-white">94%</div>
                          <div className="text-xs text-slate-400">Engagement</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-white">5.2K</div>
                          <div className="text-xs text-slate-400">Conversions</div>
              </div>
              </div>
            </div>
                  </div>
                </CardContent>
              </Card>
          </div>

            {/* Text Content */}
            <div className="order-1 lg:order-2">
              <Badge className="mb-4" variant="outline">Analytics</Badge>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                Understand Your{' '}
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Audience
                </span>
              </h2>
              <p className="text-xl text-slate-600 mb-6">
                Track your engagement over time, monitor revenue, and learn what's converting your audience. Make informed updates on the fly to keep them coming back.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-600">Real-time click tracking and visitor analytics</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-600">Geographic and device breakdown insights</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-600">Revenue tracking for digital products</span>
                </li>
              </ul>
              <Button asChild size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Link href="/login">
                  Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-br from-purple-600 to-pink-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-white/20 text-white border-0">
            <Sparkles className="w-3 h-3 mr-1" />
            Start for Free
          </Badge>
          <h2 className="text-4xl lg:text-6xl font-bold mb-6">
            Ready to Build Your Link Hub?
          </h2>
          <p className="text-xl text-purple-100 mb-10 max-w-2xl mx-auto">
            Join thousands of creators who use HereMyLinks to connect with their audience. Create your personalized link page in seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-8">
            <div className="flex-1 flex items-center bg-white rounded-lg px-4 shadow-lg">
              <span className="text-slate-500 text-sm font-medium whitespace-nowrap">heremylinks.com/</span>
              <input
                type="text"
                placeholder="yourname"
                className="flex-1 outline-none py-4 px-2 text-sm font-semibold text-slate-900"
              />
              </div>
            <Button asChild size="lg" className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg">
              <Link href="/login">
                Create My Link <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            </div>
            
          <div className="flex flex-wrap gap-6 justify-center text-sm text-purple-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
                <span>No credit card required</span>
              </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
                <span>Setup in 2 minutes</span>
              </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
                <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center">
              <Image src="/imgs/logo.png" alt="HereMyLinks" width={160} height={40} className="brightness-0 invert" />
          </div>

            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors">
                <Mail className="w-5 h-5" />
            </a>
          </div>

            <div className="flex items-center gap-6 text-sm text-slate-400">
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <span>© 2025 HereMyLinks</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
