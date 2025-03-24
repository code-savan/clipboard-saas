'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Loader2, MailIcon, MessageSquare, LogOut, UserPlus, Shield, X, Star, Check, Award, Menu } from 'lucide-react';
import { validateEmail } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Admin } from '@/update_db_types';
import type { Testimonial } from '@/update_db_types';
import type { EmailSubscription, ForumPost } from '@/lib/db';
import { Toggle } from '@/components/ui/toggle';
import { Badge } from '@/components/ui/badge';
import { getEmails, getForumPosts } from '@/lib/db';
import { toast } from 'sonner';

// Prevent relying on server-side API routes
// const checkAdminStatus = async () => {
//   try {
//     const { data: { session } } = await supabase.auth.getSession();

//     if (!session || !session.user) {
//       return { isAdmin: false, authenticated: false };
//     }

//     // Check local storage for admin status as a fallback
//     const adminData = localStorage.getItem('admin_auth');
//     if (adminData) {
//       const { isAdmin, email } = JSON.parse(adminData);
//       if (isAdmin && email === session.user.email) {
//         return { isAdmin: true, authenticated: true, email: session.user.email };
//       }
//     }

//     // Query the database directly instead of using API
//     const { data, error } = await supabase
//       .from('admins')
//       .select('*')
//       .eq('email', session.user.email)
//       .single();

//     if (error || !data) {
//       // Try users table as fallback (for compatibility)
//       const { data: userData, error: userError } = await supabase
//         .from('users')
//         .select('*')
//         .eq('email', session.user.email)
//         .eq('is_admin', true)
//         .single();

//       if (userError || !userData) {
//         return { isAdmin: false, authenticated: true };
//       }

//       return { isAdmin: true, authenticated: true, email: session.user.email };
//     }

//     return { isAdmin: true, authenticated: true, email: session.user.email };
//   } catch (error) {
//     console.error('Error checking admin status:', error);
//     return { isAdmin: false, authenticated: false };
//   }
// };

export default function AdminDashboard() {
  const [emails, setEmails] = useState<EmailSubscription[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [adminUsers, setAdminUsers] = useState<Admin[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState<{email: string, isSuperAdmin: boolean} | null>(null);
  const [currentTab, setCurrentTab] = useState('users');
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const adminData = localStorage.getItem('admin_auth');
        if (!adminData) {
          toast('You need to be an admin to access this page');
          router.push('/admin/login');
          return;
        }

        const { email, isSuperAdmin } = JSON.parse(adminData);
        setCurrentAdmin({ email, isSuperAdmin });

        // Fetch all data in parallel
        await Promise.all([
          fetchData(),
          fetchAdminData(),
          fetchTestimonials(),
          fetchUsers()
        ]);

        setLoading(false);
      } catch (error) {
        console.error('Error initializing admin dashboard:', error);
        toast('Failed to load admin dashboard data');
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchData = async () => {
    try {
      // Fetch email subscriptions
      const { data: emailData, error: emailError } = await supabase
        .from('emails')
        .select('*')
        .order('created_at', { ascending: false });

      if (emailError) {
        console.error('Error fetching emails:', emailError);
        throw emailError;
      }

      console.log('Fetched emails:', emailData); // Debug log

      // Fetch forum posts
      const { data: forumData, error: forumError } = await supabase
        .from('forum_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (forumError) {
        console.error('Error fetching forum posts:', forumError);
        throw forumError;
      }

      console.log('Fetched forum posts:', forumData); // Debug log

      setEmails(emailData || []);
      setForumPosts(forumData || []);
    } catch (error) {
      console.error('Error in fetchData:', error);
      toast('Failed to load data');
    }
  };

  const fetchAdminData = async () => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAdminUsers(data || []);

      // Check if current admin is super admin
      const adminData = localStorage.getItem('admin_auth');
      if (adminData) {
        const { email, isSuperAdmin } = JSON.parse(adminData);
        setCurrentAdmin(prev => ({
          ...prev!,
          isSuperAdmin: isSuperAdmin || false
        }));
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTestimonials(data || []);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      toast('Failed to load testimonials');
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      console.log('Fetched users:', data); // Debug log
      setUsers(data || []);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      toast('Failed to load users');
    }
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem('admin_auth');
      await supabase.auth.signOut();
      toast('Signed out successfully');
      router.push('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast('Failed to sign out');
    }
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
      fetchAdminData();
      setNewAdminEmail('');

      toast(`${newAdminEmail} has been added as an admin user with temporary password: ${tempPassword}`);
    } catch (error) {
      console.error('Error adding admin:', error);
      toast('Failed to add admin user. Please try again.');
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    try {
      // Don't allow removing current admin
      if (currentAdmin?.email === email) {
        toast('You cannot remove your own admin privileges.');
      return;
    }

      // Don't allow non-super admins to remove other admins
      if (!currentAdmin?.isSuperAdmin) {
        toast('Only super admins can remove other admin users.');
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
      fetchAdminData();
      toast(`${email} has been removed from admin users.`);
    } catch (error) {
      console.error('Error removing admin:', error);
      toast('Failed to remove admin user. Please try again.');
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

      const statusMessage = field === 'is_featured'
        ? `Testimonial ${currentValue ? 'removed from' : 'added to'} featured section`
        : `Testimonial ${currentValue ? 'marked as unverified' : 'verified'}`;

      toast(statusMessage);
    } catch (error) {
      console.error(`Error updating testimonial ${field}:`, error);
      toast('Failed to update testimonial status. Please try again.');
    }
  };

  const handleDeleteForumPost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('forum_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      // Update local state
      setForumPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      toast('Forum post deleted successfully');
    } catch (error) {
      console.error('Error deleting forum post:', error);
      toast('Failed to delete forum post');
    }
  };

  const handleDeleteTestimonial = async (testimonialId: string) => {
    try {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', testimonialId);

      if (error) throw error;

      // Update local state
      setTestimonials(prevTestimonials => prevTestimonials.filter(testimonial => testimonial.id !== testimonialId));
      toast('Testimonial deleted successfully');
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast('Failed to delete testimonial');
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
    <div className="flex h-screen bg-muted/40 dark:bg-transparent">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col border-r bg-background">
        <div className="p-6">
          <h2 className="text-lg font-semibold">Instant ClipBoard</h2>
          <p className="text-sm text-muted-foreground">Admin Dashboard</p>
            </div>
        <div className="flex-1 space-y-1 p-2">
          <Button
            variant={currentTab === 'users' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentTab('users')}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Users
          </Button>
          <Button
            variant={currentTab === 'emails' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentTab('emails')}
          >
            <MailIcon className="mr-2 h-4 w-4" />
            Emails
          </Button>
          <Button
            variant={currentTab === 'forum' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentTab('forum')}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Forum Posts
          </Button>
          <Button
            variant={currentTab === 'testimonials' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentTab('testimonials')}
          >
            <Star className="mr-2 h-4 w-4" />
            Testimonials
          </Button>
          <Button
            variant={currentTab === 'admins' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentTab('admins')}
          >
            <Shield className="mr-2 h-4 w-4" />
            Admins
          </Button>
                      </div>
        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">{currentAdmin?.email}</p>
              {currentAdmin?.isSuperAdmin && (
                <p className="text-xs text-muted-foreground">Super Admin</p>
                  )}
                </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
                </div>

      {/* Mobile Header */}
      <div className="md:hidden border-b bg-background">
        <div className="flex h-16 items-center px-4">
          <Button variant="ghost" size="sm" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="ml-2 text-lg font-semibold">Instant ClipBoard</h2>
          <div className="ml-auto flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
                      </div>
                    </div>
                  </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-8 px-4">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
            <div className="space-y-4">
              <TabsContent value="users" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Registered Users</CardTitle>
                    <CardDescription>Manage user accounts and permissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {users.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">No registered users yet.</p>
                    ) : (
                      <div className="border rounded-md">
                        <div className="grid grid-cols-2 font-medium p-3 border-b bg-muted/50">
                          <div>Email</div>
                          <div>Joined</div>
                        </div>
                        <div className="divide-y">
                          {users.map((user) => (
                            <div key={user.id} className="grid grid-cols-2 p-3">
                              <div className="font-medium">{user.email}</div>
                              <div>{new Date(user.created_at || '').toLocaleString()}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="emails" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Email Subscriptions</CardTitle>
                    <CardDescription>Newsletter and updates subscribers</CardDescription>
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
                              <div>{sub.source}</div>
                              <div>{new Date(sub.created_at || '').toLocaleString()}</div>
                            </div>
                          ))}
                        </div>
                    </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="forum" className="mt-6">
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
                          <Card key={post.id} className="overflow-hidden">
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-base">{post.name}</CardTitle>
                                  <CardDescription>{post.email || 'Anonymous'}</CardDescription>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center space-x-2 text-muted-foreground text-sm">
                                    <Badge variant="outline" className="text-rose-500">❤️ {post.likes}</Badge>
                                    <span>•</span>
                                    <span>{new Date(post.created_at || '').toLocaleString()}</span>
                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    onClick={() => post.id && handleDeleteForumPost(post.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                  </div>
                </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm">{post.message}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="testimonials" className="mt-6">
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
                          <Card key={testimonial.id} className={testimonial.is_featured ? " shadow-md" : ""}>
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
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center space-x-1 text-amber-400">
                                    {Array.from({ length: 5 }, (_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${i < testimonial.stars ? 'fill-current' : 'text-muted-foreground/30'}`}
                                      />
                                    ))}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteTestimonial(testimonial.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                    </div>
                  </div>
                            </CardHeader>
                            <CardContent>
                              <p className="mb-4 text-sm italic">{testimonial.quote}</p>
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

              <TabsContent value="admins" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Admin Users</CardTitle>
                    <CardDescription>Manage admin users and permissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="border rounded-md overflow-hidden">
                        <div className="grid grid-cols-3 font-medium p-3 border-b bg-muted/50">
                          <div>Email</div>
                          <div>Type</div>
                          <div>Actions</div>
                        </div>
                        <div className="divide-y">
                          {adminUsers.map((admin) => (
                            <div key={admin.id} className="grid grid-cols-3 p-3">
                              <div className="font-medium">{admin.email}</div>
                              <div>
                                {admin.is_super ? (
                                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800">
                                    Super Admin
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">Admin</Badge>
                                )}
                              </div>
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
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Add New Admin</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <form onSubmit={handleAddAdmin} className="space-y-4">
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
                              <CardDescription>
                                New admin will receive a temporary password that they should change immediately.
                              </CardDescription>
                            </form>
                          </CardContent>
                        </Card>
                      )}
                </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
            </Tabs>
        </div>
      </div>
    </div>
  );
}
