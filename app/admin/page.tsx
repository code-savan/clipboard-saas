'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Loader2, MailIcon, MessageSquare, LogOut, UserPlus, Shield, X, Star, Check, Award } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { validateEmail } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Admin } from '@/update_db_types';
import type { Email, ForumPost, Testimonial } from '@/update_db_types';
import { Toggle } from '@/components/ui/toggle';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboard() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [adminUsers, setAdminUsers] = useState<Admin[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<{email: string, isSuperAdmin: boolean} | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Check for localStorage admin auth (development mode)
    const checkLocalAdminAuth = () => {
      try {
        const localAuth = localStorage.getItem('admin_auth');
        if (localAuth) {
          const authData = JSON.parse(localAuth);
          // Validate timestamp - require login every 24 hours
          if (authData.timestamp && Date.now() - authData.timestamp < 24 * 60 * 60 * 1000) {
            setIsDevelopmentMode(true);
            setCurrentAdmin({
              email: authData.email,
              isSuperAdmin: authData.isSuperAdmin
            });
            fetchData();
            return true;
          } else {
            // Clear expired auth
            localStorage.removeItem('admin_auth');
          }
        }
      } catch (error) {
        console.error('Error checking local admin auth:', error);
      }
      return false;
    };

    const checkAuth = async () => {
      // Try local auth for development mode
      if (checkLocalAdminAuth()) {
        // Already authenticated via localStorage
        return;
      }

      // If no local auth, redirect to login
      router.push('/admin/login');
    };

    checkAuth();
  }, []); // Removed dependencies for simpler auth flow

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch emails
      const { data: emailsData, error: emailsError } = await supabase
        .from('emails')
        .select('*')
        .order('created_at', { ascending: false });

      if (emailsError) throw emailsError;
      setEmails(emailsData || []);

      // Fetch forum posts
      const { data: postsData, error: postsError } = await supabase
        .from('forum_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      setForumPosts(postsData || []);

      // Fetch testimonials
      const { data: testimonialsData, error: testimonialsError } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });

      if (testimonialsError) throw testimonialsError;
      setTestimonials(testimonialsData || []);

      // Fetch admin users
      const { data: adminsData, error: adminsError } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false });

      if (adminsError) throw adminsError;
      setAdminUsers(adminsData || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      // Mock data for development if API fails
      setEmails([
        {
          id: 'mock1',
          email: 'user1@example.com',
          source: 'hero',
          created_at: new Date().toISOString()
        },
        {
          id: 'mock2',
          email: 'user2@example.com',
          source: 'login',
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ]);
      setForumPosts([
        {
          id: 'mock1',
          name: 'John Smith',
          email: 'john@example.com',
          message: 'This is a sample forum post.',
          likes: 5,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
      setTestimonials([
        {
          id: 'mock1',
          name: 'Jane Cooper',
          role: 'CEO',
          company: 'Acme Inc',
          quote: 'This clipboard tool has been a game-changer for our team. We use it daily!',
          stars: 5,
          is_verified: true,
          is_featured: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'mock2',
          name: 'Mike Wilson',
          role: 'Developer',
          company: 'Tech Solutions',
          quote: 'Great tool, saves me hours each week.',
          stars: 4,
          is_verified: true,
          is_featured: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
      setAdminUsers([
        {
          id: 'mock1',
          email: 'admin@clipboardapp.com',
          is_super: false,
          password: 'hashed-password',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    // Clear local admin auth
    localStorage.removeItem('admin_auth');
    setIsDevelopmentMode(false);
    router.push('/admin/login');
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(newAdminEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsAddingAdmin(true);
    setEmailError('');

    try {
      // Generate a temporary password - in real app, send email with reset link
      const tempPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

      // Hash the password
      const bcrypt = await import('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(tempPassword, salt);

      // Add the admin
      const { error } = await supabase.from('admins').insert([
        {
          email: newAdminEmail,
          password: hashedPassword,
          is_super: false
        }
      ]);

      if (error) {
        throw error;
      }

      // Refresh admin users list
      const { data: adminsData } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false });

      setAdminUsers(adminsData || []);
      setNewAdminEmail('');

      toast({
        title: "Admin Added",
        description: `${newAdminEmail} has been added as an admin user with temporary password: ${tempPassword}`,
      });
    } catch (error) {
      console.error('Error adding admin:', error);
      toast({
        title: "Error",
        description: "Failed to add admin user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    try {
      // Don't allow removing current admin
      if (currentAdmin?.email === email) {
        toast({
          title: "Cannot Remove",
          description: "You cannot remove your own admin privileges.",
          variant: "destructive",
        });
        return;
      }

      // Don't allow non-super admins to remove other admins
      if (!currentAdmin?.isSuperAdmin) {
        toast({
          title: "Permission Denied",
          description: "Only super admins can remove other admin users.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('admins')
        .delete()
        .eq('email', email);

      if (error) {
        throw error;
      }

      // Refresh admin users list
      const { data: adminsData } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false });

      setAdminUsers(adminsData || []);

      toast({
        title: "Admin Removed",
        description: `${email} has been removed from admin users.`,
      });
    } catch (error) {
      console.error('Error removing admin:', error);
      toast({
        title: "Error",
        description: "Failed to remove admin user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleTestimonialStatus = async (id: string, field: 'is_featured' | 'is_verified', currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('testimonials')
        .update({ [field]: !currentValue })
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Update local state
      setTestimonials(prevTestimonials =>
        prevTestimonials.map(testimonial =>
          testimonial.id === id
            ? { ...testimonial, [field]: !currentValue }
            : testimonial
        )
      );

      toast({
        title: field === 'is_featured' ? 'Featured Status Updated' : 'Verification Status Updated',
        description: `Testimonial ${field === 'is_featured' ? (currentValue ? 'removed from' : 'added to') + ' featured section' : (currentValue ? 'marked as unverified' : 'verified')}.`,
      });
    } catch (error) {
      console.error(`Error updating testimonial ${field}:`, error);
      toast({
        title: "Error",
        description: `Failed to update testimonial status. Please try again.`,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading admin dashboard...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Instant ClipBoard Admin</h1>
          {currentAdmin?.email && (
            <p className="text-sm text-muted-foreground">
              Logged in as: {currentAdmin.email}
              {currentAdmin.isSuperAdmin && " (Super Admin)"}
            </p>
          )}
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

      <Tabs defaultValue="emails">
        <TabsList className="mb-4">
          <TabsTrigger value="emails">
            <MailIcon className="h-4 w-4 mr-2" />
            Email Subscriptions
          </TabsTrigger>
          <TabsTrigger value="forum">
            <MessageSquare className="h-4 w-4 mr-2" />
            Forum Posts
          </TabsTrigger>
          <TabsTrigger value="testimonials">
            <Star className="h-4 w-4 mr-2" />
            Testimonials
          </TabsTrigger>
          <TabsTrigger value="admins">
            <Shield className="h-4 w-4 mr-2" />
            Admin Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="emails">
          <Card>
            <CardHeader>
              <CardTitle>Email Subscriptions</CardTitle>
              <CardDescription>Manage email subscribers for newsletters and updates</CardDescription>
            </CardHeader>
            <CardContent>
              {emails.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No email subscriptions yet.</p>
              ) : (
                <div className="border rounded-md">
                  <div className="grid grid-cols-3 font-medium p-3 border-b bg-muted/50">
                    <div>Email</div>
                    <div>Source</div>
                    <div>Date</div>
                  </div>
                  <div className="divide-y">
                    {emails.map((sub) => (
                      <div key={sub.id} className="grid grid-cols-3 p-3">
                        <div className="font-medium">{sub.email}</div>
                        <div className="capitalize">{sub.source}</div>
                        <div>{new Date(sub.created_at).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forum">
          <Card>
            <CardHeader>
              <CardTitle>Forum Posts</CardTitle>
              <CardDescription>Manage forum posts and discussions</CardDescription>
            </CardHeader>
            <CardContent>
              {forumPosts.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No forum posts yet.</p>
              ) : (
                <div className="space-y-4">
                  {forumPosts.map((post) => (
                    <Card key={post.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">{post.name}</CardTitle>
                            <CardDescription>{post.email || 'Anonymous'}</CardDescription>
                          </div>
                          <div className="flex items-center space-x-2 text-muted-foreground text-sm">
                            <span>❤️ {post.likes}</span>
                            <span>•</span>
                            <span>{new Date(post.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p>{post.message}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testimonials">
          <Card>
            <CardHeader>
              <CardTitle>Testimonials</CardTitle>
              <CardDescription>Manage customer testimonials and reviews</CardDescription>
            </CardHeader>
            <CardContent>
              {testimonials.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No testimonials yet.</p>
              ) : (
                <div className="space-y-4">
                  {testimonials.map((testimonial) => (
                    <Card key={testimonial.id} className={testimonial.is_featured ? "border-primary" : ""}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2">
                              <CardTitle className="text-base">{testimonial.name}</CardTitle>
                              {testimonial.is_verified && (
                                <Badge variant="outline" className="text-blue-500 border-blue-300 bg-blue-50 dark:bg-blue-900/20">
                                  <Check className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                              {testimonial.is_featured && (
                                <Badge variant="outline" className="text-amber-500 border-amber-300 bg-amber-50 dark:bg-amber-900/20">
                                  <Award className="h-3 w-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                            </div>
                            <CardDescription>
                              {testimonial.role}{testimonial.company ? `, ${testimonial.company}` : ''}
                            </CardDescription>
                          </div>
                          <div className="flex items-center space-x-1 text-amber-400">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < testimonial.stars ? 'fill-current' : 'text-muted-foreground/30'}`}
                              />
                            ))}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="mb-4">{testimonial.quote}</p>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className={testimonial.is_verified ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800" : ""}
                            onClick={() => toggleTestimonialStatus(testimonial.id, 'is_verified', testimonial.is_verified)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            {testimonial.is_verified ? 'Unverify' : 'Verify'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className={testimonial.is_featured ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:border-amber-800" : ""}
                            onClick={() => toggleTestimonialStatus(testimonial.id, 'is_featured', testimonial.is_featured)}
                          >
                            <Award className="h-4 w-4 mr-1" />
                            {testimonial.is_featured ? 'Unfeature' : 'Feature'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Frontend testimonial submission functionality will be available soon.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="admins">
          <Card>
            <CardHeader>
              <CardTitle>Admin Users</CardTitle>
              <CardDescription>Manage admin users and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border rounded-md">
                  <div className="grid grid-cols-3 font-medium p-3 border-b bg-muted/50">
                    <div>Email</div>
                    <div>Type</div>
                    <div>Actions</div>
                  </div>
                  <div className="divide-y">
                    {adminUsers.map((admin) => (
                      <div key={admin.id} className="grid grid-cols-3 p-3">
                        <div className="font-medium">{admin.email}</div>
                        <div>{admin.is_super ? 'Super Admin' : 'Admin'}</div>
                        <div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-destructive"
                            onClick={() => handleRemoveAdmin(admin.email)}
                            disabled={admin.email === currentAdmin?.email || !currentAdmin?.isSuperAdmin}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {currentAdmin?.isSuperAdmin && (
                  <form onSubmit={handleAddAdmin} className="space-y-4">
                    <h3 className="text-lg font-medium">Add New Admin</h3>
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <Input
                          placeholder="admin@example.com"
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                        />
                        {emailError && (
                          <p className="text-destructive text-sm mt-1">{emailError}</p>
                        )}
                      </div>
                      <Button type="submit" disabled={isAddingAdmin}>
                        {isAddingAdmin ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <UserPlus className="h-4 w-4 mr-2" />
                        )}
                        Add Admin
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      New admin will receive a temporary password that they should change immediately.
                    </p>
                  </form>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
