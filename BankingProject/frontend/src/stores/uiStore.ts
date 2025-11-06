import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// UI State Store
interface UIState {
  // Theme
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  
  // Sidebar/Collapsible states
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Modal states
  activeModal: string | null;
  modalProps: any;
  openModal: (modal: string, props?: any) => void;
  closeModal: () => void;
  
  // Loading states
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
  
  // Toast notifications
  toasts: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  }>;
  addToast: (toast: Omit<UIState['toasts'][0], 'id'>) => void;
  removeToast: (id: string) => void;
  
  // Page transitions
  pageTransitioning: boolean;
  setPageTransitioning: (transitioning: boolean) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        theme: 'light',
        setTheme: (theme) => set({ theme }),
        
        sidebarCollapsed: false,
        toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
        setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
        
        activeModal: null,
        modalProps: null,
        openModal: (modal, props = null) => set({ activeModal: modal, modalProps: props }),
        closeModal: () => set({ activeModal: null, modalProps: null }),
        
        globalLoading: false,
        setGlobalLoading: (loading) => set({ globalLoading: loading }),
        
        toasts: [],
        addToast: (toast) => {
          const id = Date.now().toString();
          set((state) => ({ 
            toasts: [...state.toasts, { ...toast, id }] 
          }));
          
          // Auto-remove toast after duration
          const duration = toast.duration || 5000;
          setTimeout(() => {
            get().removeToast(id);
          }, duration);
        },
        removeToast: (id) => set((state) => ({ 
          toasts: state.toasts.filter(t => t.id !== id) 
        })),
        
        pageTransitioning: false,
        setPageTransitioning: (transitioning) => set({ pageTransitioning: transitioning }),
      }),
      {
        name: 'ui-store',
        partialize: (state) => ({
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    ),
    {
      name: 'ui-store',
    }
  )
);