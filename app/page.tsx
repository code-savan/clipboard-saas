'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clipboard, Check, ArrowRight, Star, Zap, Clock, Shield, Sparkles, MessageSquare, Mail, CheckCheck, Loader2, MousePointer, ArrowDownToLine, Layers } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { validateEmail } from '@/lib/utils';
import { saveEmail, createUser } from '@/lib/db';
import ClipboardWidget from '@/components/ClipboardWidget';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ModeToggle } from '@/components/ModeToggle';
import { Navbar } from '@/components/Navbar';
import { Element } from 'react-scroll';
import Image from 'next/image';
import Footer from '@/components/Footer';

export default function Home() {
  const [email, setEmail] = useState('');
  const [isWidgetUnlocked, setIsWidgetUnlocked] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      setIsWidgetUnlocked(true);
      setEmail(storedEmail);

      // Make sure this email is also in our subscription list
      const addEmail = async () => {
        await saveEmail(storedEmail, 'login');
      };
      addEmail();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      // Save to localStorage for widget access
      localStorage.setItem('userEmail', email);

      // Get device information
      const device = navigator.userAgent;

      // Try to get country information using a simple IP-based API
      let country = '';
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        country = data.country_name || '';
      } catch (err) {
        console.warn('Could not get country information:', err);
      }

      // First try to save the email
      const emailResult = await saveEmail(email, 'hero');

      if (!emailResult) {
        throw new Error('Failed to save email');
      }

      // Then try to create the user record with device and country
      const userResult = await createUser(email, device, country);

      if (!userResult) {
        console.warn('User creation might have failed, but continuing...');
      }

      setIsWidgetUnlocked(true);
      toast({
        title: 'Welcome!',
        description: 'Your clipboard organizer is now active.',
      });
    } catch (error) {
      console.error('Error during submission:', error);
      // Even if there's an error with backend, let the user proceed in demo mode
      localStorage.setItem('userEmail', email);
      setIsWidgetUnlocked(true);

      toast({
        title: 'Demo Mode Activated',
        description: 'Your clipboard organizer is now active in demo mode.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: <Clock className="h-5 w-5 text-blue-500" />,
      title: "Time-saving History",
      description: "Access your complete clipboard history with a single click."
    },
    {
      icon: <Zap className="h-5 w-5 text-purple-500" />,
      title: "Instant Search",
      description: "Find any copied text, link, or image in seconds."
    },
    {
      icon: <Shield className="h-5 w-5 text-emerald-500" />,
      title: "Private & Secure",
      description: "Your data stays on your device with end-to-end encryption."
    },
    {
      icon: <Sparkles className="h-5 w-5 text-amber-500" />,
      title: "Smart Organization",
      description: "Automatically categorizes your clipboard items."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Software Developer",
      company: "TechCorp",
      quote: "ClipSaaS has transformed my workflow. I save at least an hour each day by not having to re-copy things.",
      stars: 5
    },
    {
      name: "Mark Williams",
      role: "Content Creator",
      company: "CreativeStudio",
      quote: "As someone who constantly copies snippets for my content, this tool is absolutely essential.",
      stars: 5
    },
    {
      name: "Elena Rodriguez",
      role: "UX Designer",
      company: "DesignHub",
      quote: "The image handling is amazing! I can keep all my design references organized without effort.",
      stars: 5
    }
  ];

  return (
    <div className="flex min-h-screen flex-col">
          <Navbar />

          {/* Hero Section */}
      <section className="relative py-12 md:py-20 lg:py-32 overflow-hidden bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto px-4 sm:px-6">
              <div className="flex flex-col md:flex-row items-center justify-between ">
                <div className="md:w-1/2 md:pr-12 mb-10 md:mb-0">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 leading-tight"
              >
                Instant <span className="text-indigo-600 dark:text-indigo-500">ClipBoard</span>: <br/>
                Your Smart Clipboard History
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-6 sm:mb-8"
              >
                Never lose important text, code or links again. Our intelligent clipboard manager keeps track of everything you copy, making it instantly accessible when you need it.
              </motion.p>

              {isWidgetUnlocked ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Button className="w-full sm:w-auto" size="lg">
                    <Check className="mr-2 h-4 w-4" />
                    Accessed with {email}
                  </Button>
                  <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Double-tap Tab to open the clipboard history panel ↓
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  onSubmit={handleSubmit}
                  className="w-full sm:max-w-md space-y-2"
                >
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-grow">
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                        }}
                        className={`h-10 sm:h-12 text-sm sm:text-base ${error ? 'border-red-500' : ''}`}
                      />
                      {error && <p className="text-red-500 text-xs sm:text-sm mt-1">{error}</p>}
                    </div>
                    <Button type="submit" size="default" className="h-10 sm:h-12" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          Accessing...
                        </>
                      ) : (
                        <>
                      Get Started <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Free to try. No credit card required.
                  </p>
                </motion.form>
              )}
                </div>

                <div className="md:w-1/2 w-full max-w-full mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden md:w-[450px] w-full float-right"
              >
                <div className="p-2">
                  <Image
                    src="/hero.png"
                    alt="Instant ClipBoard Demo"
                    className="rounded-lg w-full"
                    width={450}
                    height={500}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

          {/* Features Section */}
      <Element name="features">
        <section className="py-12 sm:py-16 md:py-20 bg-white dark:bg-slate-900">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4"
              >
                Powerful Clipboard Management
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-base sm:text-lg text-slate-600 dark:text-slate-300"
              >
                Designed for professionals who rely on efficient data transfer between applications
              </motion.p>
              </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {[
                {
                  icon: <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-500" />,
                  title: "Clipboard History",
                  description: "Access your complete clipboard history with a simple keyboard shortcut"
                },
                {
                  icon: <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-500" />,
                  title: "Instant Search",
                  description: "Quickly find any previously copied text with our powerful search feature"
                },
                {
                  icon: <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-500" />,
                  title: "Secure Storage",
                  description: "Your clipboard data is encrypted and never leaves your device"
                },
                {
                  icon: <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-500" />,
                  title: "Smart Categorization",
                  description: "Automatically organizes clipboard items by type (text, code, links, etc.)"
                },
                {
                  icon: <CheckCheck className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-500" />,
                  title: "Cross-Platform",
                  description: "Works seamlessly across all your devices and operating systems"
                },
                {
                  icon: <Layers className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-500" />,
                  title: "Multi-Item Clipboard",
                  description: "Store multiple items and paste them in sequence when needed"
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-slate-50 dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <div className="mb-3 sm:mb-4 inline-block p-2 sm:p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </Element>

      {/* How It Works Section */}
      <Element name="how-it-works">
        <section className="py-12 sm:py-16 md:py-20 bg-slate-50 dark:bg-slate-800">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4"
              >
                How It Works
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-base sm:text-lg text-slate-600 dark:text-slate-300"
              >
                Get started with Instant ClipBoard in three simple steps
              </motion.p>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                {
                  icon: <ArrowDownToLine className="h-8 w-8 sm:h-10 sm:w-10 text-indigo-500" />,
                  title: "Install ClipBoard",
                  description: "Download and install our lightweight app on your computer or mobile device"
                },
                {
                  icon: <MousePointer className="h-8 w-8 sm:h-10 sm:w-10 text-indigo-500" />,
                  title: "Copy as Usual",
                  description: "Continue using copy and paste as you normally would - we work in the background"
                },
                {
                  icon: <Clipboard className="h-8 w-8 sm:h-10 sm:w-10 text-indigo-500" />,
                  title: "Access Your History",
                  description: "Press double-tap Tab to open the clipboard history panel and select any item"
                },
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center relative"
                >
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/4 right-0 w-full h-0.5 bg-indigo-200 dark:bg-indigo-800 transform translate-x-1/2">
                      <div className="absolute top-1/2 right-0 h-3 w-3 bg-indigo-400 dark:bg-indigo-600 rounded-full transform -translate-y-1/2"></div>
                    </div>
                  )}
                  <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 relative z-10">
                    <div className="mx-auto mb-3 sm:mb-4 w-16 sm:w-20 h-16 sm:h-20 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                      {step.icon}
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">{step.description}</p>
                  </div>
                  <div className="mt-3 sm:mt-4 text-xl sm:text-2xl font-bold text-indigo-500">
                    {index + 1}
                  </div>
                </motion.div>
              ))}
                    </div>
                  </div>
        </section>
      </Element>

      {/* Demo Section - If unlocked */}
      {isWidgetUnlocked && (
        <section className="py-12 sm:py-16 md:py-20 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4"
              >
                Try It Out
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-4 sm:mb-8"
              >
                Here&apos;s an interactive demo of the Instant ClipBoard in action
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-4xl mx-auto"
            >
              <ClipboardWidget />
            </motion.div>
          </div>
        </section>
      )}

      {/* Testimonials section */}
      <Element name="testimonials">
        <section className="py-12 sm:py-16 md:py-20 bg-slate-50 dark:bg-slate-800">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4"
              >
                Loved by Professionals
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-base sm:text-lg text-slate-600 dark:text-slate-300"
              >
                Don&apos;t just take our word for it
              </motion.p>
                </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
              {[
                {
                  name: "Sarah Johnson",
                  role: "Software Developer",
                  quote: "ClipBoard has transformed my workflow. I save at least an hour each day by not having to re-copy things.",
                  stars: 5
                },
                {
                  name: "Mark Williams",
                  role: "Content Creator",
                  quote: "As someone who constantly copies snippets for my content, this tool is absolutely essential.",
                  stars: 5
                },
                {
                  name: "Elena Rodriguez",
                  role: "UX Designer",
                  quote: "The image handling is amazing! I can keep all my design references organized without effort.",
                  stars: 5
                }
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  <div className="flex mb-3 sm:mb-4">
                    {Array(testimonial.stars).fill(0).map((_, i) => (
                      <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 mb-4 sm:mb-6 italic">&quot;{testimonial.quote}&quot;</p>
                  <div className="flex items-center">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-slate-900 dark:text-white text-sm sm:text-base">{testimonial.name}</p>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">{testimonial.role}</p>
                    </div>
                  </div>
                  </motion.div>
              ))}
            </div>
          </div>
        </section>
      </Element>

          {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-indigo-600 dark:bg-indigo-900">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="text-center max-w-3xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6"
            >
              Ready to boost your productivity?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg sm:text-xl text-indigo-100 mb-6 sm:mb-10"
            >
              Join thousands of professionals who trust Instant ClipBoard to manage their clipboard history.
            </motion.p>

            {!isWidgetUnlocked && (
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                onSubmit={handleSubmit}
                className="max-w-md mx-auto flex flex-col sm:flex-row gap-3 mb-6 sm:mb-8"
              >
                  <div className="flex-grow">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      className={`h-10 sm:h-12 text-sm sm:text-base bg-white text-slate-900 ${error ? 'border-red-300' : 'border-white'}`}
                    />
                    {error && (
                      <p className="text-xs sm:text-sm text-red-200 mt-1 text-left">{error}</p>
                    )}
                  </div>
                  <Button type="submit" className="h-10 sm:h-12 px-4 sm:px-6 bg-white hover:bg-indigo-50 text-indigo-600">
                    Get Started <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
              </motion.form>
            )}

                <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-6">
                  <div className="flex items-center justify-center text-indigo-100">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 mr-2" /> Free to start
                  </div>
                  <div className="flex items-center justify-center text-indigo-100">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 mr-2" /> No credit card required
                  </div>
                </div>
              </div>
            </div>
      </section>

      {/* Footer */}
      <Footer />

      {isWidgetUnlocked && <ClipboardWidget />}
    </div>
  );
}
