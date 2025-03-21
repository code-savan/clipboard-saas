'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clipboard, X, Copy, Link, Image as ImageIcon, Check, Trash2, Moon, Sun, Pin, FileText, Power, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { Input } from '@/components/ui/input';

interface ClipboardItem {
  id: string;
  content: string;
  type: 'text' | 'link' | 'image';
  timestamp: number;
  isPinned: boolean;
}

export default function ClipboardWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [isTracking, setIsTracking] = useState(true);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const lastTabPressRef = useRef<number>(0);

  const tips = [
    "Click on any item to copy it to clipboard instantly",
    "Press Ctrl+F (⌘+F) to quickly search your clipboard history",
    "Double-tap Tab to quickly toggle the clipboard widget",
    "Hover over an item to see actions like pin, new tab, or delete",
    "Pin important items to keep them at the top of your history",
    "Search for text, links, or images using keywords",
    "Use ESC to clear search or close the widget",
    "Long text items can be expanded to show more",
    "Images and links are categorized for easy access",
    "Your clipboard history is stored locally for 48 hours",
    "Instant search finds any copied item in milliseconds"
  ];

  // Rotate through tips every 5 seconds when widget is open
  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setCurrentTipIndex(prevIndex => (prevIndex + 1) % tips.length);
      }, 7000);
      return () => clearInterval(interval);
    }
  }, [isOpen, tips.length]);

  // Add global keyboard event listener for double-tap Tab
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const now = Date.now();
        const timeDiff = now - lastTabPressRef.current;

        // Check if this is a double-tap (within 500ms)
        if (timeDiff < 500 && timeDiff > 0) {
          e.preventDefault();
          setIsOpen(prev => !prev);

          // Show toast notification for first few times
          const doubleTapCount = parseInt(localStorage.getItem('doubleTapTabCount') || '0');
          if (doubleTapCount < 3) {
            toast({
              description: isOpen ? 'Widget closed with double-tap Tab' : 'Widget opened with double-tap Tab',
              duration: 2000,
            });
            localStorage.setItem('doubleTapTabCount', (doubleTapCount + 1).toString());
          }
        }

        lastTabPressRef.current = now;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, toast]);

  useEffect(() => {
    const loadItems = () => {
      const storedItems = JSON.parse(localStorage.getItem('clipboardItems') || '[]');
      const now = Date.now();
      const validItems = storedItems.filter(
        (item: ClipboardItem) => now - item.timestamp < 48 * 60 * 60 * 1000
      );
      setItems(validItems);
      localStorage.setItem('clipboardItems', JSON.stringify(validItems));
    };

    loadItems();

    if (isTracking) {
      const readClipboard = async () => {
        try {
          if (document.hasFocus()) {
            const text = await navigator.clipboard.readText();
            if (text && text.trim()) {
              let type: 'text' | 'link' | 'image' = 'text';

              // Check if it's a URL
              if (text.startsWith('http')) {
                // First check obvious image extensions
                if (text.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i)) {
                  type = 'image';
                }
                // Check for image hosting patterns
                else if (
                  text.match(/\/(img|image|photo|pic|picture)\//i) ||
                  text.includes('imgur.com') ||
                  text.includes('ibb.co') ||
                  text.includes('postimg.cc') ||
                  text.includes('cloudinary.com') ||
                  text.includes('images.unsplash.com') ||
                  text.match(/\b(image|photo|picture|img)\b/i)
                ) {
                  // Try to fetch and check content type
                  try {
                    const response = await fetch(text, { method: 'HEAD' });
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.startsWith('image/')) {
                      type = 'image';
                    } else {
                      type = 'link';
                    }
                  } catch (error) {
                    // If fetch fails, default to link
                    type = 'link';
                  }
                } else {
                  type = 'link';
                }
              }

              const newItem: ClipboardItem = {
                id: Date.now().toString(),
                content: text,
                type,
                timestamp: Date.now(),
                isPinned: false
              };

              setItems((prev) => {
                if (prev.some(item => item.content === text)) {
                  return prev;
                }
                const updated = [newItem, ...prev];
                localStorage.setItem('clipboardItems', JSON.stringify(updated));
                return updated;
              });
            }
          }
        } catch (error) {
          console.debug('Clipboard access error:', error);
        }
      };

      const interval = setInterval(readClipboard, 1000);
      return () => clearInterval(interval);
    }
  }, [isTracking]);

  const copyToClipboard = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        description: 'Copied to clipboard!',
        duration: 200,
      });
    } catch (error) {
      toast({
        description: 'Failed to copy to clipboard',
        duration: 2000,
      });
    }
  };

  const removeItems = (ids: string[]) => {
    setItems((prev) => {
      const updated = prev.filter(item => !ids.includes(item.id));
      localStorage.setItem('clipboardItems', JSON.stringify(updated));

      // If we've deleted all items or specific important items,
      // temporarily pause tracking to prevent immediate re-adding
      if (updated.length === 0 || ids.some(id => {
        const item = prev.find(i => i.id === id);
        return item && (Date.now() - item.timestamp < 5000); // If recently added item is deleted
      })) {
        // Temporarily disable tracking for 1 second to prevent re-adding the last item
        setIsTracking(false);
        setTimeout(() => setIsTracking(true), 1000);
      }

      return updated;
    });
    if (ids.includes(expandedItem || '')) {
      setExpandedItem(null);
    }
    setSelectedItems(new Set());
  };

  const toggleItemSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      // Add subtle haptic feedback if available
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(30);
        } catch (e) {
          // Ignore if not supported
        }
      }
      return next;
    });
  };

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems((prev) => {
      const pinnedCount = prev.filter(item => item.isPinned).length;
      const item = prev.find(item => item.id === id);

      if (!item) return prev;

      if (!item.isPinned && pinnedCount >= 3) {
        toast({
          description: 'Maximum of 3 items can be pinned',
          duration: 2000,
        });
        return prev;
      }

      const updated = prev.map(item =>
        item.id === id ? { ...item, isPinned: !item.isPinned } : item
      );

      // Sort items: pinned first, then by timestamp
      updated.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.timestamp - a.timestamp;
      });

      localStorage.setItem('clipboardItems', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.clipboard-widget') && !target.closest('.clipboard-trigger')) {
      setIsOpen(false);
      setExpandedItem(null);
      setSelectedItems(new Set());
    }
  };

  useEffect(() => {
    if (isOpen) {
      const handleEscapeKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (searchQuery) {
            setSearchQuery('');
            e.preventDefault();
          } else {
            setIsOpen(false);
            setExpandedItem(null);
            setSelectedItems(new Set());
          }
        }
      };

      const handleKeyboard = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      document.addEventListener('keydown', handleKeyboard);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
        document.removeEventListener('keydown', handleKeyboard);
      };
    }
  }, [isOpen, searchQuery]);

  const handleItemClick = (item: ClipboardItem) => {
    if (selectedItems.size > 0) {
      toggleItemSelection(item.id, { stopPropagation: () => {} } as React.MouseEvent);
      return;
    }

    // Always copy the content on click, regardless of type
    copyToClipboard(item.content, item.id);
  };

  const filteredItems = items.filter(item => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const content = item.content.toLowerCase();

    return content.includes(query);
  });

  // Focus the search input when widget opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Small delay to allow the animation to complete
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  // Clear search when widget closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  return (
    <>
      <motion.button
        className="clipboard-trigger fixed bottom-6 right-6 w-[40px] h-[40px] bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full shadow-md flex items-center justify-center text-white hover:shadow-lg transition-all duration-300 dark:from-indigo-600 dark:to-violet-600"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        title="Click to open clipboard history (or double-tap Tab)"
      >
        <Clipboard className="w-4 h-4" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="clipboard-widget fixed bottom-24 right-6 w-[400px] h-[450px] rounded-xl shadow-lg bg-gray-50 dark:bg-gray-900/95 backdrop-blur-3xl z-50 overflow-visible flex flex-col"
          >
            <div className="p-3 border-b border-slate-200 rounded-t-xl dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 overflow-visible">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-300">Clipboard History</h3>
              </div>
              <div className="flex items-center gap-2">
                {selectedItems.size > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItems(Array.from(selectedItems))}
                    className="h-8 w-8 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4 text-gray-800 dark:text-gray-100" />
                  ) : (
                    <Moon className="h-4 w-4 text-gray-800 dark:text-gray-100" />
                  )}
                </Button>
                <div className="relative group">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full opacity-50 "
                    disabled={true}
                  >
                    <Power className="h-4 w-4 text-gray-400 dark:text-gray-500 cursor-not-allowed" />
                  </Button>
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    Coming soon
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4 text-gray-500 dark:text-gray-300" />
                </Button>
              </div>
            </div>

            {/* Search Input */}
            <div className="p-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search clipboard items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 w-full bg-white dark:bg-gray-800 text-sm border-slate-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 rounded-full text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  Press Ctrl+F to search (⌘+F on Mac)
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="h-full overflow-y-auto px-4 w-full">
                <div className="flex flex-col gap-4 py-2 w-full">
                  {searchQuery.trim() && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 mt-1 flex items-center justify-between">
                      <span>
                        {filteredItems.length > 0
                          ? `Found ${filteredItems.length} result${filteredItems.length === 1 ? '' : 's'}`
                          : 'No matches found'}
                      </span>
                      {filteredItems.length > 0 && (
                        <span className="text-purple-500 dark:text-purple-400">
                          {items.length > filteredItems.length && `${filteredItems.length} of ${items.length}`}
                        </span>
                      )}
                    </div>
                  )}

                  <AnimatePresence>
                    {filteredItems.length > 0 ? (
                      filteredItems.map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                          className={cn(
                            'clipboard-item relative group py-3 px-3 rounded-xl',
                            'transition-all duration-300 cursor-pointer',
                            'bg-white dark:bg-gray-800',
                            'border border-transparent overflow-visible',
                            // Special styling for links
                            item.type === 'link' && 'bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-800 dark:to-purple-900/20',
                            item.type === 'link' && 'hover:shadow-md dark:hover:shadow-none',
                            item.type === 'link' && !item.isPinned && 'hover:translate-y-[-2px]',
                            // Special styling for images
                            item.type === 'image' && 'bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-800 dark:to-indigo-900/20',
                            item.type === 'image' && 'hover:shadow-md dark:hover:shadow-none',
                            // Special styling for text
                            item.type === 'text' && 'hover:shadow-md dark:hover:shadow-none',
                            // Pinned items
                            item.isPinned && 'border-l-4 border-l-emerald-500 dark:border-l-purple-600 pl-3 bg-emerald-50/50 dark:bg-purple-900/10',
                            // Expanded and selected
                            expandedItem === item.id && 'shadow-md border-slate-200 dark:border-gray-700 dark:shadow-none',
                            expandedItem === item.id && 'pt-8',
                            !expandedItem && selectedItems.has(item.id) && 'bg-slate-50/90 dark:bg-slate-800/30 border-l-4 border-l-slate-800 dark:border-l-slate-300 pl-3',
                            // Highlight search results
                            searchQuery && 'border border-purple-200 dark:border-purple-800/30'
                          )}
                          onClick={() => handleItemClick(item)}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "flex-shrink-0 cursor-pointer p-1.5 rounded-full",
                                item.type === 'link' && "bg-blue-100 text-blue-600 dark:bg-gray-700 dark:text-blue-400",
                                item.type === 'image' && "bg-violet-100 text-violet-600 dark:bg-gray-700 dark:text-purple-400",
                                item.type === 'text' && "bg-emerald-100 text-emerald-600 dark:bg-gray-700 dark:text-emerald-400"
                              )}
                              onClick={(e) => toggleItemSelection(item.id, e)}
                            >
                              {item.type === 'link' && <Link className="h-3.5 w-3.5" />}
                              {item.type === 'image' && <ImageIcon className="h-3.5 w-3.5" />}
                              {item.type === 'text' && <FileText className="h-3.5 w-3.5" />}
                            </div>
                            <div className="flex-grow overflow-hidden">
                              <p className={cn(
                                "text-sm text-gray-800 dark:text-gray-300",
                                item.type === 'text' && expandedItem === item.id ? "whitespace-pre-wrap max-h-[300px] overflow-y-auto" : "line-clamp-4 overflow-hidden",
                                item.type === 'link' && "text-blue-700 dark:text-blue-400 font-medium truncate mt-[2px]"
                              )}>
                                {item.content}
                              </p>
                              {(item.type === 'image' || (item.type === 'link' &&
                                (item.content.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i) ||
                                 item.content.match(/\/(img|image|photo|pic|picture)\//i) ||
                                 item.content.includes('imgur.com') ||
                                 item.content.includes('ibb.co') ||
                                 item.content.includes('postimg.cc') ||
                                 item.content.includes('cloudinary.com') ||
                                 item.content.includes('images.unsplash.com')
                                ))) && (
                                <Image
                                  src={item.content}
                                  alt="Preview"
                                  width={300}
                                  height={300}
                                  className="mt-2 rounded-lg object-cover max-h-24 w-full"
                                  onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                />
                              )}
                            </div>
                          </div>
                          <div className={cn(
                            "absolute top-2 right-2 flex gap-1",
                            "transition-all duration-300",
                            expandedItem === item.id ? "opacity-100" : "opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0"
                          )}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-full bg-slate-700 dark:bg-gray-600 hover:bg-slate-600 dark:hover:bg-gray-500 transition-colors"
                              onClick={(e) => togglePin(item.id, e)}
                            >
                              <Pin className={cn(
                                "h-3 w-3 transition-colors",
                                item.isPinned ? "text-emerald-500 fill-emerald-500 dark:text-purple-300 dark:fill-purple-300" : "text-gray-50 dark:text-gray-200"
                              )} />
                            </Button>

                            {item.type === 'link' && (
                              <a
                                href={item.content}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="block"
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-full bg-blue-200 dark:bg-slate-200 hover:bg-blue-300 dark:hover:bg-blue-200 transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-blue-600 dark:text-blue-800">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                    <polyline points="15 3 21 3 21 9"></polyline>
                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                  </svg>
                                </Button>
                              </a>
                            )}

                            {(item.type === 'image' || (item.type === 'link' &&
                               (item.content.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i) ||
                                item.content.match(/\/(img|image|photo|pic|picture)\//i) ||
                                item.content.includes('imgur.com') ||
                                item.content.includes('ibb.co') ||
                                item.content.includes('postimg.cc') ||
                                item.content.includes('cloudinary.com') ||
                                item.content.includes('images.unsplash.com')))) && (
                              <a
                                href={item.content}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="block"
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-full bg-violet-300 dark:bg-purple-800 hover:bg-violet-400 dark:hover:bg-purple-700 transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-violet-600 dark:text-purple-200">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                  </svg>
                                </Button>
                              </a>
                            )}

                            {item.type === 'text' && item.content.length > 150 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-full bg-slate-600 dark:bg-gray-600 hover:bg-slate-600 dark:hover:bg-gray-500 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedItem(expandedItem === item.id ? null : item.id);
                                }}
                              >
                                {expandedItem === item.id ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-gray-100 dark:text-gray-200">
                                    <polyline points="4 14 10 14 10 20"></polyline>
                                    <polyline points="20 10 14 10 14 4"></polyline>
                                    <line x1="14" y1="10" x2="21" y2="3"></line>
                                    <line x1="3" y1="21" x2="10" y2="14"></line>
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-gray-100 dark:text-gray-200">
                                    <polyline points="15 3 21 3 21 9"></polyline>
                                    <polyline points="9 21 3 21 3 15"></polyline>
                                    <line x1="21" y1="3" x2="14" y2="10"></line>
                                    <line x1="3" y1="21" x2="10" y2="14"></line>
                                  </svg>
                                )}
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors",
                                selectedItems.has(item.id) && "bg-amber-200 dark:bg-amber-700/60"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleItemSelection(item.id, e);
                              }}
                            >
                              {selectedItems.has(item.id) ? (
                                <Check className="h-3 w-3 text-amber-600 dark:text-gray-200" />
                              ) : (
                                <div className="h-3 w-3 rounded-sm border border-gray-500 dark:border-slate-200" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-full bg-slate-100 dark:bg-red-900 hover:bg-red-100 dark:hover:bg-red-800 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeItems([item.id]);
                              }}
                            >
                              <Trash2 className="h-3 w-3 text-red-500 dark:text-red-200" />
                            </Button>
                          </div>
                          {copiedId === item.id && (
                            <div className="absolute bottom-1 right-2 bg-emerald-50 dark:bg-slate-800 shadow-md text-emerald-600 dark:text-emerald-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 animate-fade-in">
                              <Check className="h-3 w-3" />
                              <span>{item.type === 'link' ?
                                (item.content.length > 20 ? item.content.substring(0, 20) + '...' : item.content)
                                : 'Copied'}</span>
                            </div>
                          )}
                        </motion.div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[300px] text-center">
                        {searchQuery ? (
                          // No search results state
                          <>
                            <div className="rounded-full bg-slate-100 dark:bg-gray-800 p-3 mb-3">
                              <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                            </div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-1">No matches found</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[250px]">
                              No clipboard items match your search. Try different keywords or clear the search.
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-4 text-xs h-8"
                              onClick={() => setSearchQuery('')}
                            >
                              Clear search
                            </Button>
                          </>
                        ) : (
                          // Empty clipboard state
                          <>
                            <div className="rounded-full bg-slate-100 dark:bg-gray-800 p-3 mb-3">
                              <Clipboard className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                            </div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-1">Clipboard is empty</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[250px]">
                              Copy some text or an image to see it appear here. Your clipboard history will be stored for 48 hours.
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Fixed Rotating Tips */}
              <div className="border-t border-slate-200 dark:border-slate-800 py-2.5 px-4 bg-white dark:bg-gray-900 rounded-b-xl">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentTipIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center justify-center"
                  >
                    <div className="h-5 w-5 flex-shrink-0 mr-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium">💡</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{tips[currentTipIndex]}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
