'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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

// Fix reload duplication by adding a global variable outside of component
let lastClipboardContent = '';

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClipContent, setNewClipContent] = useState('');
  const [clipCount, setClipCount] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  useEffect(() => {
    // Register service worker for PWA functionality
    registerServiceWorker();

    // Set loading state
    setIsLoading(true);

    // Check if user is logged in
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      setEmail(storedEmail);
      setIsLoggedIn(true);
    }

    // Load saved clipboard items
    const savedItems = localStorage.getItem('clipboardItems');
    if (savedItems) {
      try {
        const parsedItems = JSON.parse(savedItems);
        // Convert string dates back to Date objects and filter out expired items (older than 48 hours)
        const currentTime = new Date().getTime();
        const maxAge = 48 * 60 * 60 * 1000; // 48 hours in milliseconds

        const validItems = parsedItems
          .map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          }))
          .filter((item: ClipboardItem) => {
            const itemAge = currentTime - item.timestamp.getTime();
            return itemAge <= maxAge;
          });

        // Get the most recent item and set it as last clipboard content to prevent duplication
        if (validItems.length > 0) {
          // Explicitly cast the array to ensure TypeScript recognizes the correct types
          const typedItems = validItems as ClipboardItem[];
          const mostRecentItem = typedItems.sort((a, b) =>
            b.timestamp.getTime() - a.timestamp.getTime()
          )[0];
          lastClipboardContent = mostRecentItem.content;
        }

        setItems(validItems);
        setClipCount(validItems.length);
      } catch (error) {
        console.error('Error parsing saved clipboard items:', error);
      }
    }

    setIsLoading(false);

    // Set up clipboard monitoring
    const checkClipboard = async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text && text.trim() !== '' && text !== lastClipboardContent) {
          // Check if this text is already in the items
          const exists = items.some(item => item.content === text);
          if (!exists) {
            lastClipboardContent = text;
            addNewItem(text);
          }
        }
      } catch (error) {
        console.error('Failed to read clipboard:', error);
      }
    };

    // Call once on mount and then set up interval
    checkClipboard();
    const intervalId = setInterval(checkClipboard, 5000); // Check every 5 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, []); // Remove items dependency to prevent frequent refreshes

  // Save items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('clipboardItems', JSON.stringify(items));
    setClipCount(items.length);
  }, [items]);

  // Function to add a new clipboard item
  const addNewItem = (content: string) => {
    // Check if content already exists in items
    const existingItem = items.find(item => item.content === content);

    if (existingItem) {
      // Move the existing item to the top of the list instead of creating a new one
      setItems(prevItems => [
        ...prevItems.filter(item => item.content !== content),
        {...existingItem, timestamp: new Date()} // Update timestamp to current time
      ]);

      toast({
        title: "Moved to Top",
        description: "Item already exists and was moved to the top",
        duration: 2000,
      });
      return;
    }

    const type = content.startsWith('http') && !content.match(/\s/) ? 'link' : 'text';

    // Create new item
    const newItem: ClipboardItem = {
      id: Date.now().toString(),
      content,
      type,
      timestamp: new Date(),
      pinned: false
    };

    // Add to items list with pinned items limitation
    setItems(prevItems => {
      // Count current pinned items
      const pinnedCount = prevItems.filter(item => item.pinned).length;

      // If adding a pinned item and already at max, unpin the oldest
      if (newItem.pinned && pinnedCount >= 3) {
        // Find the oldest pinned item
        const oldestPinned = [...prevItems]
          .filter(item => item.pinned)
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0];

        // Unpin it
        if (oldestPinned) {
          return [
            newItem,
            ...prevItems.map(item =>
              item.id === oldestPinned.id ? { ...item, pinned: false } : item
            )
          ];
        }
      }

      return [newItem, ...prevItems];
    });

    toast({
      title: "Added to Clipboard",
      description: "New content saved to your clipboard history",
      duration: 2000,
    });
  };

  // Function to handle manual adding of content
  const handleAddClip = () => {
    if (newClipContent.trim() !== '') {
      addNewItem(newClipContent);
      setNewClipContent('');
      setShowAddModal(false);
    }
  };

  // Update the filteredItems to only show relevant items for each tab
  const filteredItems = useMemo(() => {
    // First filter by tab/page type
    let filtered = [...items];

    // Filter based on active tab
    if (activeTab === 'pinned') {
      filtered = filtered.filter(item => item.pinned);
    } else if (activeTab === 'text') {
      filtered = filtered.filter(item => item.type === 'text');
    } else if (activeTab === 'code') {
      filtered = filtered.filter(item => item.type === 'code');
    } else if (activeTab === 'link') {
      filtered = filtered.filter(item => item.type === 'link');
    } else if (activeTab === 'image') {
      filtered = filtered.filter(item => item.type === 'image');
    }
    // For 'all' tab, we don't filter

    // Then filter by search query if there is one
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(item =>
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort with pinned at top for non-history views
    return filtered.sort((a, b) => {
      // First sort by pinned status (except in pinned tab where all are pinned)
      if (activeTab !== 'pinned') {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
      }

      // Then sort by timestamp (newest first)
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [items, searchQuery, activeTab]);

  const togglePin = (id: string) => {
    setItems(prevItems => {
      // Count current pinned items
      const pinnedCount = prevItems.filter(item => item.pinned).length;

      // Find the item we're toggling
      const targetItem = prevItems.find(item => item.id === id);

      // If we're pinning and already at max, don't allow
      if (targetItem && !targetItem.pinned && pinnedCount >= 3) {
        toast({
          title: "Maximum Pins Reached",
          description: "You can only pin up to 3 items. Unpin something first.",
          variant: "destructive",
          duration: 3000,
        });
        return prevItems;
      }

      // Otherwise proceed with toggle
      return prevItems.map(item =>
        item.id === id ? { ...item, pinned: !item.pinned } : item
      );
    });

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

  const formatDetailedTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 5) {
      return "just now";
    } else if (diffSecs < 60) {
      return `${diffSecs} seconds ago`;
    } else if (diffSecs < 120) {
      return "1 minute ago";
    } else if (diffSecs < 3600) {
      return `${Math.floor(diffSecs / 60)} minutes ago`;
    } else if (diffSecs < 7200) {
      return "1 hour ago";
    } else if (diffSecs < 86400) {
      return `${Math.floor(diffSecs / 3600)} hours ago`;
    } else if (diffSecs < 172800) {
      return "1 day ago";
    } else {
      return `${Math.floor(diffSecs / 86400)} days ago`;
    }
  };

  const renderItemContent = (item: ClipboardItem, isExpanded: boolean = false) => {
    switch (item.type) {
      case 'link':
        return (
          <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg break-all">
            <a href={item.content} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              {isExpanded ? item.content : (item.content.length > 100 ? item.content.substring(0, 100) + '...' : item.content)}
            </a>
          </div>
        );
      case 'code':
        return (
          <pre className={`bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-xs overflow-x-auto ${!isExpanded ? 'max-h-32' : ''}`}>
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
        return (
          <div className={`whitespace-pre-wrap break-words ${!isExpanded ? 'max-h-32 overflow-hidden' : ''}`}>
            {isExpanded ? item.content : (item.content.length > 150 ? item.content.substring(0, 150) + '...' : item.content)}
          </div>
        );
    }
  };

  const renderClipboardItems = () => {
    if (isLoading) {
      // Loading skeletons
      return Array(3).fill(0).map((_, index) => (
        <div key={index} className="mb-6 p-5 border border-slate-200 dark:border-slate-700 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-12" />
          </div>
          <Skeleton className="h-16 w-full mb-4" />
          <div className="flex gap-3 mt-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
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
          className="flex flex-col items-center justify-center py-16 px-4 text-center"
        >
          <Clipboard className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-3">No items found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
            {searchQuery ? 'Try a different search term' :
             activeTab === 'pinned' ? 'Pin items to access them quickly here' :
             'Your clipboard history will appear here'}
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
        className={`mb-6 p-5 bg-white dark:bg-slate-900 border ${item.pinned ? 'border-indigo-200 dark:border-indigo-800' : 'border-slate-200 dark:border-slate-700'} rounded-xl shadow-sm ${item.pinned ? 'ring-1 ring-indigo-200 dark:ring-indigo-900' : ''} ${isMultiSelectMode ? 'cursor-pointer' : ''}`}
        onClick={() => isMultiSelectMode ? toggleItemSelection(item.id) : null}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isMultiSelectMode && (
              <div
                className={`h-7 w-7 flex items-center justify-center rounded-full ${selectedItems.includes(item.id) ? 'bg-indigo-600' : 'border-2 border-gray-300'}`}
              >
                {selectedItems.includes(item.id) && <Check className="h-3 w-3 text-white" />}
              </div>
            )}
            <Badge variant={
              item.type === 'code' ? "secondary" :
              item.type === 'link' ? "outline" :
              item.type === 'image' ? "default" : "default"
            }>
              {item.type}
            </Badge>
            {item.category && (
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                {item.category}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {formatDetailedTimestamp(item.timestamp)}
          </span>
        </div>

        <div className="mb-4" onClick={(e) => isMultiSelectMode ? e.stopPropagation() : null}>
          {renderItemContent(item)}
        </div>

        {item.content.length > 150 && (
          <div className="text-center mb-3" onClick={(e) => isMultiSelectMode ? e.stopPropagation() : null}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedItem(item.id)}
              className="text-xs text-slate-500"
            >
              Show more
            </Button>
          </div>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {item.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center mt-3" onClick={(e) => isMultiSelectMode ? e.stopPropagation() : null}>
          <div className="flex gap-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(item.content)}
              className="h-9 w-9 p-0 rounded-full"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditingItem(item)}
              className="h-9 w-9 p-0 rounded-full"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => togglePin(item.id)}
              className={`h-9 w-9 p-0 rounded-full ${item.pinned ? 'text-indigo-600 dark:text-indigo-400' : ''}`}
            >
              <Pin className="h-4 w-4" />
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => deleteItem(item.id)}
            className="h-9 w-9 p-0 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    ));
  };

  // Render history items (simpler view)
  const renderHistoryItems = () => {
    if (isLoading) {
      return Array(5).fill(0).map((_, index) => (
        <div key={index} className="mb-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
          <Skeleton className="h-5 w-full mb-2" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ));
    }

    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Clock className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-medium text-slate-700 dark:text-slate-300 mb-2">No history</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Your clipboard history will appear here
          </p>
        </div>
      );
    }

    return items.map((item: ClipboardItem) => (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="mb-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
      >
        <div className="text-sm mb-1 text-slate-900 dark:text-slate-100 line-clamp-1">
          {item.content}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {formatDetailedTimestamp(item.timestamp)}
          </span>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(item.content)}
              className="h-7 w-7 p-0 rounded-full"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpandedItem(item.id)}
              className="h-7 w-7 p-0 rounded-full"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </motion.div>
    ));
  };

  // Render profile view
  const renderProfileView = () => {
    return (
      <div className="py-8 px-4">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-24 w-24 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
            <User className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-xl font-semibold mb-1">User Profile</h2>
          {email ? (
            <p className="text-slate-600 dark:text-slate-300">{email}</p>
          ) : (
            <p className="text-slate-500 dark:text-slate-400">Not logged in</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="font-medium mb-2">App Information</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
              Instant ClipBoard PWA Version 1.0
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Total clips</span>
              <span className="font-medium">{items.length}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Header */}
      <header className={`sticky top-0 z-10 px-5 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-all ${scrollY > 20 ? 'shadow-sm' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Clipboard className="h-6 w-6 text-slate-400" />
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search clipboard..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 bg-slate-800 h-10 rounded-[45px] w-full border-0"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 rounded-full"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setActiveTab('profile')}
            className="h-10 w-10 p-0 rounded-full bg-slate-800 ml-3"
          >
            <User className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto px-5 overscroll-bounce"
        style={{
          scrollBehavior: 'smooth',
          scrollbarWidth: 'none', // Firefox
          WebkitOverflowScrolling: 'touch' // iOS momentum scrolling
        }}
      >
        {activeTab !== 'profile' && activeTab !== 'history' && (
          <div className="sticky -top-1 z-10 pt-6 pb-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-50 dark:border-slate-950">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800"
                  onClick={() => setActiveTab('text')}
                >
                  <div className="h-4 w-4 border-2 border-gray-200 rounded"></div>
                  <span className="text-gray-200 text-xs">Text</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800"
                  onClick={() => setActiveTab('link')}
                >
                  <div className="h-4 w-4 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-200">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                  </div>
                  <span className="text-gray-200 text-xs">Links</span>
                </Button>
                <Button
                  variant="ghost"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800"
                  onClick={() => setActiveTab('image')}
                >
                  <div className="h-4 w-4 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-200">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  </div>
                  <span className="text-gray-200 text-xs">Image</span>
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {isMultiSelectMode && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleBulkDelete}
                    className="h-7 w-7 p-0 rounded-full bg-slate-800 text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
                  className={`h-7 w-7 p-0 rounded-full bg-slate-800 ${isMultiSelectMode ? 'ring-2 ring-indigo-500' : ''}`}
                >
                  <div className={`h-5 w-5 rounded-full border-2 ${isMultiSelectMode ? 'border-indigo-500' : 'border-gray-200'}`}></div>
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className={activeTab === 'history' ? 'pt-8' : 'pt-4'}>
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === 'history' ? (
              <motion.div
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {renderHistoryItems()}
              </motion.div>
            ) : activeTab === 'profile' ? (
              <motion.div
                key="profile"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {renderProfileView()}
              </motion.div>
            ) : (
              <motion.div
                key="clipboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {renderClipboardItems()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Add a spacer at the bottom to ensure content is visible above the bottom nav */}
        <div className="h-24"></div>
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

      {/* Expanded Item Modal */}
      <AnimatePresence>
        {expandedItem && (
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
                <h3 className="text-lg font-semibold">Full Content</h3>
                <Button variant="ghost" size="sm" onClick={() => setExpandedItem(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                {items.find(item => item.id === expandedItem) &&
                  renderItemContent(
                    items.find(item => item.id === expandedItem)!,
                    true
                  )
                }
              </div>
              <div className="flex justify-end p-4 border-t border-slate-200 dark:border-slate-700">
                <Button variant="outline" onClick={() => setExpandedItem(null)}>
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add New Clip Modal */}
      <AnimatePresence>
        {showAddModal && (
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
              className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold">Add New Clip</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newContent">Content</Label>
                    <Textarea
                      id="newContent"
                      value={newClipContent}
                      onChange={(e) => setNewClipContent(e.target.value)}
                      placeholder="Enter text to save to clipboard..."
                      className="min-h-[150px]"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end p-4 border-t border-slate-200 dark:border-slate-700 gap-2">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddClip} disabled={!newClipContent.trim()}>
                  Save to Clipboard
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation - updated layout to match the provided image */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-3 px-6 z-20"
        style={{
          filter: 'drop-shadow(0px -2px 8px rgba(0,0,0,0.05))',
        }}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="h-16 w-16 p-0 flex flex-col items-center gap-1 rounded-full bg-transparent hover:bg-transparent"
            onClick={() => setActiveTab('all')}
          >
            <Home className={`h-5 w-5 ${activeTab === 'all' ? '' : 'text-gray-400'}`} />
            <span className={`text-xs ${activeTab === 'all' ? '' : 'text-gray-400'}`}>Home</span>
          </Button>

          <Button
            variant="ghost"
            className="h-16 w-16 p-0 flex flex-col items-center gap-1 rounded-full bg-transparent hover:bg-transparent"
            onClick={() => setActiveTab('history')}
          >
            <Clock className={`h-5 w-5 ${activeTab === 'history' ? '' : 'text-gray-400'}`} />
            <span className={`text-xs ${activeTab === 'history' ? '' : 'text-gray-400'}`}>History</span>
          </Button>

          <Button
            variant="ghost"
            className="h-16 w-16 p-0 flex flex-col items-center gap-1 rounded-full bg-white hover:bg-transparent"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="h-6 w-6 text-black" />
            {/* <span className="text-xs text-black">Add</span> */}
          </Button>

          <Button
            variant="ghost"
            className="h-16 w-16 p-0 flex flex-col items-center gap-1 rounded-full bg-transparent hover:bg-transparent"
            onClick={() => setActiveTab('pinned')}
          >
            <Pin className={`h-5 w-5 ${activeTab === 'pinned' ? '' : 'text-gray-400'}`} />
            <span className={`text-xs ${activeTab === 'pinned' ? '' : 'text-gray-400'}`}>Pinned</span>
          </Button>

          <Button
            variant="ghost"
            className="h-16 w-16 p-0 flex flex-col items-center gap-1 rounded-full bg-transparent hover:bg-transparent"
            onClick={() => setActiveTab('profile')}
          >
            <User className={`h-5 w-5 ${activeTab === 'profile' ? '' : 'text-gray-400'}`} />
            <span className={`text-xs ${activeTab === 'profile' ? '' : 'text-gray-400'}`}>Profile</span>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
