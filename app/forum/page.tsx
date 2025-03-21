'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Clipboard, Heart, ThumbsUp, Send, MessageCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { validateEmail } from '@/lib/utils';
import { getForumPosts, saveForumPost, likeForumPost, ForumPost, initializeSampleData, getEmails } from '@/lib/db';
import Link from 'next/link';
import { formatDistance } from 'date-fns';
import { Navbar } from '@/components/Navbar';
import { motion, AnimatePresence } from "framer-motion";

export default function Forum() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [messageError, setMessageError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Initialize sample data if needed
        await initializeSampleData();

        // Load stored posts
        const forumPosts = await getForumPosts();
        setPosts(forumPosts);

        // Get subscriber count
        const emails = await getEmails();
        setSubscriberCount(emails.length);

        // Check if we have stored user info
        const storedEmail = localStorage.getItem('userEmail');
        if (storedEmail) {
          setEmail(storedEmail);
        }
      } catch (error) {
        console.error('Error loading forum data:', error);
        toast({
          title: "Error",
          description: "Could not load forum posts. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setNameError('');
    setEmailError('');
    setMessageError('');

    // Validate fields
    let hasError = false;

    if (!name.trim()) {
      setNameError('Name is required');
      hasError = true;
    }

    // Email is optional, but if provided, it should be valid
    if (email.trim() && !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      hasError = true;
    }

    if (!message.trim()) {
      setMessageError('Message is required');
      hasError = true;
    }

    if (hasError) return;

    // Save post
    setIsSubmitting(true);

    try {
      const newPost = await saveForumPost(name, email.trim() || null, message);

      if (newPost) {
        // Update posts list with the new post at the top
        setPosts([newPost, ...posts]);

        // Reset form
        setMessage('');

        // Store email for future use
        if (email.trim()) {
          localStorage.setItem('userEmail', email);
        }

        toast({
          title: "Success!",
          description: "Your message has been posted to the forum.",
        });
      }
    } catch (error) {
      console.error('Error posting to forum:', error);
      toast({
        title: "Error",
        description: "Could not post your message. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (id: string) => {
    try {
      const updatedPost = await likeForumPost(id);

      if (updatedPost) {
        // Update the post in our state
        setPosts(posts.map(post =>
          post.id === id ? { ...post, likes: updatedPost.likes } : post
        ));

        toast({
          title: "Thanks!",
          description: "Your like has been counted.",
        });
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return formatDistance(new Date(dateString), new Date(), { addSuffix: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Instant ClipBoard Community</h1>
          <p className="text-xl text-muted-foreground">
            Join our community of {subscriberCount} clipboard enthusiasts and share your thoughts!
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <MessageCircle className="mr-2" />
              Community Forum
            </h2>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading forum posts...</span>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-muted p-6 rounded-lg text-center">
                <p className="text-muted-foreground">No posts yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              <AnimatePresence>
                <div className="space-y-6">
                  {posts.map((post) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-card p-6 rounded-lg shadow-sm border"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg">{post.name}</h3>
                        <span className="text-sm text-muted-foreground">
                          {post.created_at ? formatDate(post.created_at) : ''}
                        </span>
                      </div>
                      <p className="mb-4">{post.message}</p>
                      <div className="flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(post.id!)}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <ThumbsUp className="mr-1 h-4 w-4" />
                          <span>{post.likes}</span>
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </div>

          <div>
            <div className="bg-card p-6 rounded-lg shadow-sm border sticky top-4">
              <h2 className="text-xl font-bold mb-4">Share Your Thoughts</h2>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className={nameError ? "border-red-500" : ""}
                    />
                    {nameError && <p className="text-red-500 text-sm mt-1">{nameError}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                      Email (optional - not displayed publicly)
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className={emailError ? "border-red-500" : ""}
                    />
                    {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-1">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Share your experience with Instant ClipBoard..."
                      rows={4}
                      className={messageError ? "border-red-500" : ""}
                    />
                    {messageError && <p className="text-red-500 text-sm mt-1">{messageError}</p>}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Post Message
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
