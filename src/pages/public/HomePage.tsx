import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  Bell,
  BarChart3,
  CheckCircle,
  Calendar,
  MessageSquare,
  Shield,
  Clock,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Star,
} from 'lucide-react';
import { LandingNav } from '../../layouts/components/LandingNav';

export function HomePage() {
  const features = [
    {
      icon: Calendar,
      title: 'Smart Attendance',
      description: 'Automated attendance tracking with real-time notifications to parents and instant reporting.',
      color: 'bg-blue-500',
    },
    {
      icon: Bell,
      title: 'Instant Notifications',
      description: 'Keep everyone informed with automated alerts for attendance, assignments, and school events.',
      color: 'bg-green-500',
    },
    {
      icon: BarChart3,
      title: 'Powerful Analytics',
      description: 'Data-driven insights to track student performance, attendance patterns, and engagement metrics.',
      color: 'bg-purple-500',
    },
    {
      icon: Users,
      title: 'Multi-Role Access',
      description: 'Tailored dashboards for admins, teachers, parents, and students with appropriate permissions.',
      color: 'bg-orange-500',
    },
    {
      icon: MessageSquare,
      title: 'Communication Hub',
      description: 'Seamless communication between teachers, parents, and administrators in one platform.',
      color: 'bg-cyan-500',
    },
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'Enterprise-grade security with role-based access control and data encryption.',
      color: 'bg-red-500',
    },
  ];

  const packages = [
    {
      name: 'Starter',
      price: '29',
      description: 'Perfect for small schools getting started',
      features: [
        'Up to 200 students',
        'Basic attendance tracking',
        'Email notifications',
        'Parent portal access',
        'Mobile responsive',
        'Email support',
      ],
      highlighted: false,
    },
    {
      name: 'Professional',
      price: '79',
      description: 'Ideal for growing educational institutions',
      features: [
        'Up to 1,000 students',
        'Advanced attendance & analytics',
        'SMS & email notifications',
        'Custom branding',
        'API access',
        'Priority support',
        'Training sessions',
      ],
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large schools and districts',
      features: [
        'Unlimited students',
        'Full feature suite',
        'Multi-school management',
        'Dedicated account manager',
        'Custom integrations',
        '24/7 phone support',
        'On-site training',
      ],
      highlighted: false,
    },
  ];

  const benefits = [
    {
      icon: Clock,
      title: 'Save 10+ Hours Weekly',
      description: 'Automate routine administrative tasks',
    },
    {
      icon: TrendingUp,
      title: '40% Better Engagement',
      description: 'Improved parent-teacher communication',
    },
    {
      icon: CheckCircle,
      title: '99.9% Uptime',
      description: 'Reliable platform you can count on',
    },
    {
      icon: Sparkles,
      title: 'Easy to Use',
      description: 'Intuitive interface, minimal training',
    },
  ];

  const schools = [
    'Springfield Elementary',
    'Riverside High School',
    'Oakwood Academy',
    'Lincoln Prep',
    'Sunrise International',
    'Heritage School District',
  ];

  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white overflow-hidden pt-16">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:32px_32px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-500/30 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Trusted by 500+ schools nationwide</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Modern School Management
              <span className="block text-blue-200">Made Simple</span>
            </h1>

            <p className="text-xl sm:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
              Streamline attendance, engage parents, and gain insights with the all-in-one
              education CRM built for modern schools.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="group bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105">
                Request a Demo
                <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <Link
                to="/login"
                className="bg-blue-500/20 backdrop-blur-sm border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-500/30 transition-all"
              >
                Sign In
              </Link>
            </div>

            <div className="mt-16 flex flex-wrap justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-300" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-300" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-300" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-3">
                  <benefit.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{benefit.title}</h3>
                <p className="text-sm text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed to simplify school administration and enhance communication
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-1 group"
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 ${feature.color} rounded-xl mb-5 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Choose Your Perfect Plan
            </h2>
            <p className="text-xl text-gray-600">
              Flexible pricing to match your school's size and needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {packages.map((pkg, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl p-8 ${
                  pkg.highlighted
                    ? 'ring-4 ring-blue-500 shadow-2xl scale-105'
                    : 'border border-gray-200 shadow-lg'
                } hover:shadow-xl transition-all`}
              >
                {pkg.highlighted && (
                  <div className="bg-blue-500 text-white text-sm font-semibold px-4 py-1 rounded-full inline-block mb-4">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                <p className="text-gray-600 mb-6 h-12">{pkg.description}</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">
                    {pkg.price === 'Custom' ? pkg.price : `$${pkg.price}`}
                  </span>
                  {pkg.price !== 'Custom' && (
                    <span className="text-gray-600 ml-2">/month</span>
                  )}
                </div>
                <ul className="space-y-4 mb-8">
                  {pkg.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                    pkg.highlighted
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {pkg.price === 'Custom' ? 'Contact Sales' : 'Start Free Trial'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Leading Schools
            </h2>
            <p className="text-lg text-gray-600">
              Join hundreds of educational institutions already using our platform
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {schools.map((school, index) => (
              <div
                key={index}
                className="flex items-center justify-center p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="text-center">
                  <GraduationCap className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">{school}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-blue-50 border border-blue-100 rounded-2xl p-8 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-lg text-gray-700 italic mb-2">
                  "This platform transformed how we manage our school. Attendance tracking is now effortless,
                  and parent engagement has increased significantly."
                </p>
                <p className="font-semibold text-gray-900">
                  - Principal Sarah Johnson, Oakwood Academy
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Ready to Transform Your School?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join hundreds of schools already saving time and improving engagement.
            Start your free 14-day trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all shadow-xl hover:scale-105">
              Get Started Free
            </button>
            <button className="bg-blue-500/30 backdrop-blur-sm border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-500/40 transition-all">
              Schedule a Demo
            </button>
          </div>
          <p className="mt-6 text-sm text-blue-200">
            No credit card required • Setup in minutes • Cancel anytime
          </p>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-8 h-8 text-blue-400" />
                <span className="text-xl font-bold text-white">Education CRM</span>
              </div>
              <p className="text-sm text-gray-400">
                Modern school management software for the digital age.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © 2026 Education CRM. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
