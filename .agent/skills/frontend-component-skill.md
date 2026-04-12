# Skill: Frontend Component Pattern (Next.js 15 + shadcn/ui)

## Purpose
Hướng dẫn tạo React components theo pattern chuẩn của ProjectFlow với Green & White theme.

## Stack
- **Framework**: Next.js 15 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **State**: Zustand (global) + TanStack Query (server state)
- **Icons**: lucide-react
- **Primary color**: `#00A86B` (Emerald Green)

## Pattern: Page → Component → Hook → API

### 1. Page Component (`src/app/(app)/[page]/page.tsx`)
```tsx
import { Metadata } from 'next';
import { ResourceList } from '@/components/[resource]/ResourceList';

export const metadata: Metadata = {
  title: '[Page Title] | ProjectFlow',
};

export default function ResourcePage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">[Page Title]</h1>
          <p className="text-sm text-gray-500 mt-1">Page description</p>
        </div>
        {/* Page-level actions */}
      </div>
      <div className="flex-1 overflow-auto p-6">
        <ResourceList />
      </div>
    </div>
  );
}
```

### 2. Feature Component (`src/components/[resource]/[Component].tsx`)
```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useResources } from '@/hooks/useResources';
import { cn } from '@/lib/utils';
import { Plus, MoreHorizontal } from 'lucide-react';

interface ResourceCardProps {
  resource: Resource;
  className?: string;
}

export function ResourceCard({ resource, className }: ResourceCardProps) {
  return (
    <Card className={cn(
      'hover:shadow-md transition-all duration-200 cursor-pointer',
      'border border-gray-100 hover:border-primary/20',
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <h3 className="font-medium text-gray-900 text-sm leading-tight">
            {resource.title}
          </h3>
          <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1 -mt-1">
            <MoreHorizontal className="h-4 w-4 text-gray-400" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Content */}
      </CardContent>
    </Card>
  );
}
```

### 3. Custom Hook (`src/hooks/use[Resource]s.ts`)
```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Resource, CreateResourceDto } from '@/types';

const QUERY_KEY = ['resources'] as const;

export function useResources(projectId?: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, projectId],
    queryFn: () => api.get<Resource[]>(`/projects/${projectId}/resources`),
    enabled: !!projectId,
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateResourceDto) =>
      api.post<Resource>('/resources', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Resource> }) =>
      api.put<Resource>(`/resources/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
```

### 4. API Client (`src/lib/api.ts`)
```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response unwrapper
export const api = {
  get: async <T>(url: string) => {
    const res = await apiClient.get<{ success: boolean; data: T }>(url);
    return res.data.data;
  },
  post: async <T>(url: string, data?: unknown) => {
    const res = await apiClient.post<{ success: boolean; data: T }>(url, data);
    return res.data.data;
  },
  put: async <T>(url: string, data?: unknown) => {
    const res = await apiClient.put<{ success: boolean; data: T }>(url, data);
    return res.data.data;
  },
  delete: async <T>(url: string) => {
    const res = await apiClient.delete<{ success: boolean; data: T }>(url);
    return res.data.data;
  },
};
```

## Green Theme: Custom shadcn Colors

### `tailwind.config.js` additions:
```js
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#00A86B',
        dark: '#007A4D',
        light: '#E6F7F1',
        foreground: '#FFFFFF',
      },
    },
  },
},
```

### `globals.css` CSS variables:
```css
:root {
  --primary: 152 100% 33%;          /* #00A86B */
  --primary-foreground: 0 0% 100%;  /* white */
  --ring: 152 100% 33%;
}
```

## Component Naming Conventions
- `PascalCase` for component files and exports
- Prefix with feature area: `TaskCard`, `ProjectHeader`, `DashboardStats`
- View components: `[Resource]ListView`, `[Resource]BoardView`, `[Resource]GanttView`
- Modal/Dialog: `Create[Resource]Modal`, `Edit[Resource]Dialog`
- Form components: `[Resource]Form`

## Do's and Don'ts
✅ Always use `cn()` for conditional class merging  
✅ Use shadcn/ui primitives as base (Button, Card, Dialog, etc.)  
✅ Keep components focused — split if > 150 lines  
✅ Use TanStack Query for all server state  
✅ Use Zustand only for UI state (modals, sidebar open, etc.)  
❌ Don't use `any` TypeScript type  
❌ Don't fetch data directly in components — use hooks  
❌ Don't use inline styles — use Tailwind classes  
