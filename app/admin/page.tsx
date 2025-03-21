'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getEmails, getForumPosts, getAdminUsers, addAdminUser, removeAdminPrivilege, User } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { EmailSubscription, ForumPost } from '@/lib/db';
import { Loader2, MailIcon, MessageSquare, LogOut, UserPlus, Shield, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { validateEmail } from '@/lib/utils';

export default function AdminDashboard() {
  const [emails, setEmails] = useState<EmailSubscription[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin, signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Skip if still loading
    if (loading) return;

    const checkAuth = async () => {
      // Check authentication
      if (!user) {
        router.push('/admin/login');
        return;
      }

      if (user && !isAdmin) {
        // User is logged in via Supabase but not an admin
        await signOut();
        router.push('/admin/login');
        return;
      }

      // Fetch data if user is admin
      if (user && isAdmin) {
        fetchData();
      }
    };

    checkAuth();
  }, [user, isAdmin, loading]); // Don't include router here

  const fetchData = async () => {
    setLoading(true);
    try {
      const [emailsData, forumData, adminData] = await Promise.all([
        getEmails(),
        getForumPosts(),
        getAdminUsers()
      ]);

      setEmails(emailsData);
      setForumPosts(forumData);
      setAdminUsers(adminData);
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
          created_at: new Date().toISOString()
        }
      ]);
      setAdminUsers([
        {
          id: 'mock1',
          email: 'admin@clipboardapp.com',
          is_admin: true,
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
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
      const success = await addAdminUser(newAdminEmail);

      if (success) {
        // Refresh admin users list
        const adminData = await getAdminUsers();
        setAdminUsers(adminData);
        setNewAdminEmail('');

        toast({
          title: "Admin Added",
          description: `${newAdminEmail} has been added as an admin user.`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add admin user. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding admin:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    try {
      // Don't allow removing current admin
      if (user?.email === email) {
        toast({
          title: "Cannot Remove",
          description: "You cannot remove your own admin privileges.",
          variant: "destructive",
        });
        return;
      }

      const success = await removeAdminPrivilege(email);

      if (success) {
        // Refresh admin users list
        const adminData = await getAdminUsers();
        setAdminUsers(adminData);

        toast({
          title: "Admin Removed",
          description: `${email} has been removed from admin users.`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to remove admin user. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error removing admin:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
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
          {user?.email && (
            <p className="text-sm text-muted-foreground">Logged in as: {user.email}</p>
          )}
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

      <Tabs defaultValue="emails">
        <TabsList className="mb-4">
          <TabsTrigger value="emails">Email Subscriptions</TabsTrigger>
          <TabsTrigger value="forum">Forum Posts</TabsTrigger>
          <TabsTrigger value="admins">Admin Users</TabsTrigger>
        </TabsList>

        <TabsContent value="emails">
          <Card>
            <CardHeader>
              <CardTitle>Email Subscriptions</CardTitle>
              <CardDescription>
                All email subscriptions collected from the website ({emails.length} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {emails.length === 0 ? (
                <p className="text-muted-foreground">No email subscriptions yet.</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 font-bold border-b pb-2">
                    <div>Email</div>
                    <div>Source</div>
                    <div>Date</div>
                  </div>
                  {emails.map((subscription) => (
                    <div key={subscription.id} className="grid grid-cols-4 border-b py-2">
                      <div className="flex items-center">
                        <MailIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        {subscription.email}
                      </div>
                      <div>{subscription.source}</div>
                      <div>{new Date(subscription.created_at!).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forum">
          <Card>
            <CardHeader>
              <CardTitle>Forum Posts</CardTitle>
              <CardDescription>
                All forum posts from users ({forumPosts.length} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {forumPosts.length === 0 ? (
                <p className="text-muted-foreground">No forum posts yet.</p>
              ) : (
                <div className="space-y-6">
                  {forumPosts.map((post) => (
                    <div key={post.id} className="border rounded-lg p-4">
                      <div className="flex justify-between">
                        <h3 className="font-bold">{post.name}</h3>
                        <span className="text-sm text-muted-foreground">
                          {new Date(post.created_at!).toLocaleString()}
                        </span>
                      </div>
                      {post.email && (
                        <div className="text-sm text-muted-foreground mb-2">
                          {post.email}
                        </div>
                      )}
                      <p className="mt-2">{post.message}</p>
                      <div className="flex items-center mt-2 text-sm text-muted-foreground">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {post.likes} likes
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins">
          <Card>
            <CardHeader>
              <CardTitle>Admin Users</CardTitle>
              <CardDescription>
                Manage users with administrative access ({adminUsers.length} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddAdmin} className="mb-6">
                <div className="flex gap-3">
                  <div className="flex-grow">
                    <Input
                      type="email"
                      placeholder="Enter email to add as admin"
                      value={newAdminEmail}
                      onChange={(e) => {
                        setNewAdminEmail(e.target.value);
                        setEmailError('');
                      }}
                      className={emailError ? "border-red-500" : ""}
                    />
                    {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
                  </div>
                  <Button type="submit" disabled={isAddingAdmin}>
                    {isAddingAdmin ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Admin
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {adminUsers.length === 0 ? (
                <p className="text-muted-foreground">No admin users yet.</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 font-bold border-b pb-2">
                    <div>Email</div>
                    <div>Created</div>
                    <div>Actions</div>
                  </div>
                  {adminUsers.map((admin) => (
                    <div key={admin.id} className="grid grid-cols-3 border-b py-2">
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
                        {admin.email}
                        {admin.email === user?.email && (
                          <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">You</span>
                        )}
                      </div>
                      <div>{new Date(admin.created_at!).toLocaleString()}</div>
                      <div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAdmin(admin.email)}
                          disabled={admin.email === user?.email}
                          className={admin.email === user?.email ? "text-muted-foreground cursor-not-allowed" : "text-destructive hover:text-destructive/90"}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground border-t pt-4">
              <p>Admin users have full access to the admin dashboard and all administrative functions.</p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
