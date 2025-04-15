'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clipboard, Check, Home, User, Settings, Edit, Trash2, Copy, Clock, PlusCircle, Search, Pin, Filter, ArrowUp, X, Save, ChevronLeft, ChevronRight, MoreVertical, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { registerServiceWorker } from './_register-sw';

type ClipboardItem = {
  id: string;
  content: string;
  type: 'text' | 'code' | 'link' | 'image';
  timestamp: Date;
  pinned: boolean;
  category?: string;
  tags?: string[];
};

export default function MobilePWA() {
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [editingItem, setEditingItem] = useState<ClipboardItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Simulated data for the demo
  const demoClipboardItems: ClipboardItem[] = [
    {
      id: '1',
      content: 'https://example.com/important-article',
      type: 'link',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      pinned: true,
      category: 'Links',
      tags: ['article', 'important']
    },
    {
      id: '2',
      content: 'Just a simple text note to remember for later. Need to follow up with team about project deadline.',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      pinned: false,
      category: 'Notes',
      tags: ['reminder', 'work']
    },
    {
      id: '3',
      content: 'const getData = async () => {\n  try {\n    const response = await fetch(\'https://api.example.com/data\');\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error(\'Error fetching data:\', error);\n    return null;\n  }\n};',
      type: 'code',
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      pinned: true,
      category: 'Code',
      tags: ['javascript', 'fetch']
    },
    {
      id: '4',
      content: 'Remember to buy: eggs, milk, bread, vegetables',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
      pinned: false,
      category: 'Shopping',
      tags: ['groceries', 'personal']
    },
    {
      id: '5',
      content: 'https://images.unsplash.com/photo-1461988320302-91bde64fc8e4',
      type: 'image',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
      pinned: false,
      category: 'Images',
      tags: ['landscape', 'wallpaper']
    },
    {
      id: '6',
      content: 'Meeting notes: Discuss project timeline, assign tasks, review previous sprint',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
      pinned: false,
      category: 'Work',
      tags: ['meeting', 'notes']
    },
    {
      id: '7',
      content: '#ff5a5f',
      type: 'text',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      pinned: false,
      category: 'Colors',
      tags: ['design', 'red']
    },
    {
      id: '8',
      content: '<div className="flex items-center justify-between p-4">\n  <h2 className="text-xl font-bold">Dashboard</h2>\n  <Button variant="outline">Settings</Button>\n</div>',
      type: 'code',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      pinned: false,
      category: 'Code',
      tags: ['react', 'jsx']
    }
  ];

  useEffect(() => {
    // Register service worker for PWA functionality
    registerServiceWorker();

    // Simulate loading data
    const timer = setTimeout(() => {
      setItems(demoClipboardItems);
      setIsLoading(false);

      // Check if user is logged in
      const storedEmail = localStorage.getItem('userEmail');
      if (storedEmail) {
        setEmail(storedEmail);
        setIsLoggedIn(true);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Smooth scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        setScrollY(contentRef.current.scrollTop);
      }
    };

    const currentRef = contentRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const filteredItems = items.filter(item => {
    // First filter by tab
    if (activeTab !== 'all' && activeTab !== 'pinned' && item.type !== activeTab) return false;
    if (activeTab === 'pinned' && !item.pinned) return false;

    // Then filter by search query
    if (searchQuery.trim() === '') return true;
    return item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
           item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
           item.category?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const togglePin = (id: string) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, pinned: !item.pinned } : item
      )
    );

    toast({
      title: "Success",
      description: "Item pinned status updated",
      duration: 2000,
    });
  };

  const deleteItem = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));

    toast({
      title: "Deleted",
      description: "Item removed from clipboard",
      duration: 2000,
    });
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);

    toast({
      title: "Copied!",
      description: "Content copied to clipboard",
      duration: 2000,
    });
  };

  const saveEditedItem = () => {
    if (!editingItem) return;

    setItems(prevItems =>
      prevItems.map(item =>
        item.id === editingItem.id ? editingItem : item
      )
    );

    setEditingItem(null);

    toast({
      title: "Saved",
      description: "Changes saved successfully",
      duration: 2000,
    });
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    setItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
    setSelectedItems([]);
    setIsMultiSelectMode(false);

    toast({
      title: "Bulk Delete",
      description: `${selectedItems.length} items deleted`,
      duration: 2000,
    });
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMins > 0) {
      return `${diffMins}m ago`;
    } else {
      return 'Just now';
    }
  };

  const renderItemContent = (item: ClipboardItem) => {
    switch (item.type) {
      case 'link':
        return (
          <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg break-all">
            <a href={item.content} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              {item.content}
            </a>
          </div>
        );
      case 'code':
        return (
          <pre className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-xs overflow-x-auto">
            <code>{item.content}</code>
          </pre>
        );
      case 'image':
        return (
          <div className="relative h-40 w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
            <Image
              src={item.content}
              alt="Clipboard image"
              fill
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                target.className = "object-contain p-8";
              }}
            />
          </div>
        );
      default:
        return <p className="whitespace-pre-wrap break-words">{item.content}</p>;
    }
  };

  const renderClipboardItems = () => {
    if (isLoading) {
      // Loading skeletons
      return Array(5).fill(0).map((_, index) => (
        <div key={index} className="mb-4 p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-12" />
          </div>
          <Skeleton className="h-16 w-full mb-3" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      ));
    }

    if (filteredItems.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center py-12 px-4 text-center"
        >
          <Clipboard className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">No items found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
            {searchQuery ? 'Try a different search term' : 'Your clipboard history will appear here'}
          </p>
        </motion.div>
      );
    }

    return filteredItems.map((item) => (
      <motion.div
        key={item.id}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{
          type: "spring",
          damping: 30,
          stiffness: 400
        }}
        className={`mb-4 p-4 bg-white dark:bg-slate-900 border ${item.pinned ? 'border-indigo-200 dark:border-indigo-800' : 'border-slate-200 dark:border-slate-700'} rounded-xl shadow-sm ${item.pinned ? 'ring-1 ring-indigo-200 dark:ring-indigo-900' : ''}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isMultiSelectMode && (
              <Button
                variant={selectedItems.includes(item.id) ? "default" : "outline"}
                size="sm"
                className="h-6 w-6 p-0 rounded-full"
                onClick={() => toggleItemSelection(item.id)}
              >
                {selectedItems.includes(item.id) && <Check className="h-3 w-3" />}
              </Button>
            )}
            <Badge variant={
              item.type === 'code' ? "secondary" :
              item.type === 'link' ? "outline" :
              item.type === 'image' ? "default" : "default"
            }>
              {item.type}
            </Badge>
            {item.category && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {item.category}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {formatTimestamp(item.timestamp)}
          </span>
        </div>

        <div className="mb-3">
          {renderItemContent(item)}
        </div>

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(item.content)}
              className="h-8 px-2"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditingItem(item)}
              className="h-8 px-2"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => togglePin(item.id)}
              className={`h-8 px-2 ${item.pinned ? 'text-indigo-600 dark:text-indigo-400' : ''}`}
            >
              <Pin className="h-4 w-4" />
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => deleteItem(item.id)}
            className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    ));
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Header */}
      <header className={`sticky top-0 z-10 px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-all ${scrollY > 20 ? 'shadow-sm' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clipboard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-lg font-semibold">Instant ClipBoard</h1>
          </div>
          <div className="flex items-center gap-2">
            {isMultiSelectMode ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsMultiSelectMode(false);
                    setSelectedItems([]);
                  }}
                  className="h-8"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkDelete}
                  disabled={selectedItems.length === 0}
                  className="h-8"
                >
                  Delete ({selectedItems.length})
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsMultiSelectMode(true)}
                className="h-8"
              >
                Select
              </Button>
            )}
          </div>
        </div>

        {/* Search input */}
        <div className="mt-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search clipboard..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 bg-slate-50 dark:bg-slate-800"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full rounded-l-none"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start overflow-x-auto pb-1 scrollbar-hide">
              <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
              <TabsTrigger value="pinned" className="text-xs px-3">Pinned</TabsTrigger>
              <TabsTrigger value="text" className="text-xs px-3">Text</TabsTrigger>
              <TabsTrigger value="code" className="text-xs px-3">Code</TabsTrigger>
              <TabsTrigger value="link" className="text-xs px-3">Links</TabsTrigger>
              <TabsTrigger value="image" className="text-xs px-3">Images</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Main Content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto px-4 py-4 overscroll-bounce"
        style={{
          scrollBehavior: 'smooth',
          scrollbarWidth: 'none', // Firefox
          WebkitOverflowScrolling: 'touch' // iOS momentum scrolling
        }}
      >
        <AnimatePresence>
          {renderClipboardItems()}
        </AnimatePresence>

        {/* Add a spacer at the bottom to ensure content is visible above the bottom nav */}
        <div className="h-16"></div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold">Edit Item</h3>
                <Button variant="ghost" size="sm" onClick={() => setEditingItem(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-4 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={editingItem.content}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        content: e.target.value
                      })}
                      className="min-h-[150px]"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="pinned"
                      checked={editingItem.pinned}
                      onCheckedChange={(checked) => setEditingItem({
                        ...editingItem,
                        pinned: checked
                      })}
                    />
                    <Label htmlFor="pinned">Pin this item</Label>
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={editingItem.category || ''}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        category: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      value={editingItem.tags?.join(', ') || ''}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                      })}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end p-4 border-t border-slate-200 dark:border-slate-700 gap-2">
                <Button variant="outline" onClick={() => setEditingItem(null)}>
                  Cancel
                </Button>
                <Button onClick={saveEditedItem}>
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-2 px-6 z-20"
        style={{
          filter: 'drop-shadow(0px -2px 8px rgba(0,0,0,0.05))',
          borderTopLeftRadius: '1.5rem',
          borderTopRightRadius: '1.5rem',
        }}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-around">
          <Button variant="ghost" className="flex flex-col items-center h-auto py-2 px-1">
            <Home className="h-5 w-5 mb-1" />
            <span className="text-xs">Home</span>
          </Button>

          <Button variant="ghost" className="flex flex-col items-center h-auto py-2 px-1">
            <Clock className="h-5 w-5 mb-1" />
            <span className="text-xs">History</span>
          </Button>

          <div className="-mt-8">
            <Button className="h-14 w-14 rounded-full flex items-center justify-center shadow-lg">
              <Plus className="h-6 w-6" />
            </Button>
          </div>

          <Button variant="ghost" className="flex flex-col items-center h-auto py-2 px-1">
            <Filter className="h-5 w-5 mb-1" />
            <span className="text-xs">Categories</span>
          </Button>

          <Button variant="ghost" className="flex flex-col items-center h-auto py-2 px-1">
            <User className="h-5 w-5 mb-1" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
