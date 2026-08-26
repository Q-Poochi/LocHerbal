'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/auth.store';
import { wishlistApi } from '@/lib/api/client';

export interface WishlistItem {
  id: string;
  variant: {
    id: string;
    product: {
      id: string;
      name: string;
      slug: string;
      thumbnailUrl: string | null;
    };
  };
}

export function useWishlist() {
  const { user, hasHydrated } = useAuthStore();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!user || !hasHydrated) return [];
    setLoading(true);
    try {
      const data = await wishlistApi.getItems();
      setItems(data || []);
      return data;
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
      setError('Failed to fetch wishlist');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, hasHydrated]);

  // Fetch items when user is logged in and hydrated
  useEffect(() => {
    if (user && hasHydrated) {
      fetchItems();
    } else if (hasHydrated && !user) {
      setItems([]);
    }
  }, [user, hasHydrated, fetchItems]);

  const addItem = useCallback(async (productVariantId: string): Promise<boolean> => {
    try {
      await wishlistApi.addItem(productVariantId);
      await fetchItems();
      return true;
    } catch {
      return false;
    }
  }, [fetchItems]);

  const removeItem = useCallback(async (productVariantId: string): Promise<boolean> => {
    try {
      await wishlistApi.removeItem(productVariantId);
      setItems(prev => prev.filter(item => item.variant.id !== productVariantId));
      return true;
    } catch {
      return false;
    }
  }, []);

  const isInWishlist = useCallback((productVariantId: string) => {
    return items.some(item => item.variant.id === productVariantId);
  }, [items]);

  return {
    items,
    loading,
    error,
    addItem,
    removeItem,
    isInWishlist,
    refresh: fetchItems,
  };
}