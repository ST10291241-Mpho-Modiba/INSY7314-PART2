import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock axios before any imports that use it
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ data: {} })),
      post: jest.fn(() => Promise.resolve({ data: {} })),
      put: jest.fn(() => Promise.resolve({ data: {} })),
      delete: jest.fn(() => Promise.resolve({ data: {} })),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    })),
  },
}));

// Mock framer-motion
jest.mock('framer-motion', () => {
  const React = require('react');
  const createMotionComponent = (tag) => ({ children, ...props }) => {
    // Filter out framer-motion specific props
    const { initial, animate, exit, variants, transition, whileHover, whileTap, ...domProps } = props;
    return React.createElement(tag, domProps, children);
  };
  
  return {
    motion: {
      div: createMotionComponent('div'),
      h1: createMotionComponent('h1'),
      h2: createMotionComponent('h2'),
      p: createMotionComponent('p'),
      span: createMotionComponent('span'),
      button: createMotionComponent('button'),
      a: createMotionComponent('a'),
    },
    AnimatePresence: ({ children }) => children,
  };
});

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  useForm: () => ({
    register: jest.fn(),
    handleSubmit: jest.fn((fn) => (e) => {
      e?.preventDefault?.();
      return fn({});
    }),
    formState: { errors: {}, isSubmitting: false },
    clearErrors: jest.fn(),
    watch: jest.fn(),
    setValue: jest.fn(),
    getValues: jest.fn(() => ({})),
  }),
}));

// Mock @heroicons/react
jest.mock('@heroicons/react/24/outline', () => ({
  EnvelopeIcon: () => <svg data-testid="envelope-icon" />,
  LockClosedIcon: () => <svg data-testid="lock-icon" />,
  ShieldCheckIcon: () => <svg data-testid="shield-icon" />,
  ExclamationTriangleIcon: () => <svg data-testid="exclamation-icon" />,
  ExclamationCircleIcon: () => <svg data-testid="exclamation-circle-icon" />,
  CheckCircleIcon: () => <svg data-testid="check-icon" />,
  ArrowPathIcon: () => <svg data-testid="arrow-path-icon" />,
  HomeIcon: () => <svg data-testid="home-icon" />,
  UserIcon: () => <svg data-testid="user-icon" />,
  XCircleIcon: () => <svg data-testid="x-circle-icon" />,
  XMarkIcon: () => <svg data-testid="x-mark-icon" />,
  EyeIcon: () => <svg data-testid="eye-icon" />,
  EyeSlashIcon: () => <svg data-testid="eye-slash-icon" />,
  ArrowRightIcon: () => <svg data-testid="arrow-right-icon" />,
  ArrowLeftIcon: () => <svg data-testid="arrow-left-icon" />,
  MagnifyingGlassIcon: () => <svg data-testid="magnifying-glass-icon" />,
  InformationCircleIcon: () => <svg data-testid="information-circle-icon" />,
  ServerIcon: () => <svg data-testid="server-icon" />,
  ClipboardDocumentIcon: () => <svg data-testid="clipboard-document-icon" />,
  WifiIcon: () => <svg data-testid="wifi-icon" />,
  SignalSlashIcon: () => <svg data-testid="signal-slash-icon" />,
  CloudArrowDownIcon: () => <svg data-testid="cloud-arrow-down-icon" />,
  ClockIcon: () => <svg data-testid="clock-icon" />,
  BanknotesIcon: () => <svg data-testid="banknotes-icon" />,
  DocumentTextIcon: () => <svg data-testid="document-text-icon" />,
}));

// Mock animations utility
jest.mock('./utils/animations', () => ({
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  },
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },
  useMotionPreference: () => ({ shouldReduceMotion: false }),
}));

// Mock sonner
jest.mock('sonner', () => ({
  Toaster: () => null,
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

// Mock cn utility
jest.mock('./utils/cn', () => ({
  cn: (...classes) => classes.filter(Boolean).join(' '),
}));

// Mock UI components
jest.mock('./components/ui', () => {
  const React = require('react');
  return {
    Button: React.forwardRef(({ children, fullWidth, loading, variant, size, ...props }, ref) => (
      React.createElement('button', { ref, ...props }, children)
    )),
    Input: React.forwardRef(({ label, error, helperText, icon, ...props }, ref) => (
      React.createElement('div', null,
        label && React.createElement('label', null, label),
        React.createElement('input', { ref, ...props }),
        error && React.createElement('div', null, error),
        helperText && React.createElement('div', null, helperText)
      )
    )),
    Card: ({ children, ...props }) => React.createElement('div', props, children),
    CardHeader: ({ children, ...props }) => React.createElement('div', props, children),
    CardTitle: ({ children, ...props }) => React.createElement('div', props, children),
    CardContent: ({ children, ...props }) => React.createElement('div', props, children),
    Alert: ({ children, ...props }) => React.createElement('div', props, children),
    ProgressBar: ({ ...props }) => React.createElement('div', props),
    Switch: ({ ...props }) => React.createElement('input', { type: 'checkbox', ...props }),
    Tabs: ({ children, ...props }) => React.createElement('div', props, children),
    TabList: ({ children, ...props }) => React.createElement('div', props, children),
    Tab: ({ children, ...props }) => React.createElement('div', props, children),
    TabPanel: ({ children, ...props }) => React.createElement('div', props, children),
    Select: ({ children, ...props }) => React.createElement('select', props, children),
    LoadingStates: {},
    CompactOfflineIndicator: () => null,
  };
});

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: ({ element }) => element,
  Navigate: ({ to }) => <div data-testid="navigate">{to}</div>,
  useNavigate: () => jest.fn(),
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
  useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
  useParams: () => ({}),
}));

// Mock the AppProvider and other contexts
jest.mock('./contexts/AppProvider', () => ({
  AppProvider: ({ children }) => children,
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
  }),
  useUI: () => ({
    theme: 'light',
    setTheme: jest.fn(),
  }),
}));

jest.mock('./contexts/NotificationContext', () => ({
  NotificationProvider: ({ children }) => children,
}));

jest.mock('./contexts/ToastContext', () => ({
  ToastProvider: ({ children }) => children,
  useToast: () => ({
    toasts: [],
    addToast: jest.fn(),
    removeToast: jest.fn(),
    removeAllToasts: jest.fn(),
    updateToast: jest.fn(),
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showInfo: jest.fn(),
    showWarning: jest.fn(),
  }),
}));

// Mock AuthContext directly (Login imports from it)
jest.mock('./contexts/AuthContext', () => {
  const mockUseAuth = () => ({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: false,
    error: null,
    login: jest.fn(),
    logout: jest.fn(),
    clearError: jest.fn(),
    updateUser: jest.fn(),
  });
  
  return {
    AuthProvider: ({ children }) => children,
    useAuth: mockUseAuth,
    AUTH_ACTIONS: {},
  };
});

// Mock UIContext directly (Login imports from it)
jest.mock('./contexts/UIContext', () => ({
  UIProvider: ({ children }) => children,
  useUI: () => ({
    theme: 'light',
    sidebarOpen: false,
    notifications: [],
    loading: {},
    modals: {},
    toasts: [],
    setTheme: jest.fn(),
    toggleSidebar: jest.fn(),
    setSidebar: jest.fn(),
    addNotification: jest.fn(),
    removeNotification: jest.fn(),
    markNotificationRead: jest.fn(),
    clearNotifications: jest.fn(),
    setLoading: jest.fn(),
    openModal: jest.fn(),
    closeModal: jest.fn(),
    addToast: jest.fn(),
    removeToast: jest.fn(),
    showToast: jest.fn(),
  }),
}));

jest.mock('./contexts/OfflineContext', () => ({
  OfflineProvider: ({ children }) => children,
}));

jest.mock('./hooks/useNotificationErrorHandler', () => ({
  useNotificationErrorHandler: () => {},
}));

jest.mock('./hooks/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleError: jest.fn(),
  }),
}));

jest.mock('./hooks/useAccessibility', () => ({
  useFocusVisible: () => {},
  useScreenReader: () => ({
    announceNavigation: jest.fn(),
  }),
}));

jest.mock('./hooks/useOfflineStatus', () => ({
  useOfflineStatus: () => ({
    isOnline: true,
  }),
}));

jest.mock('./utils/serviceWorker', () => ({
  register: jest.fn(),
}));

// Mock axios config
jest.mock('./api/axiosConfig', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
}));

// Mock SecurityProvider to avoid importing heavy security utils in tests
jest.mock('./components/SecurityProvider', () => ({
  useSecurity: () => ({
    validateSession: jest.fn().mockResolvedValue(true),
    sanitizeInput: (input) => input,
    getSecurityHeaders: () => ({}),
  }),
}));

// Additionally, mock security utilities in case they are imported elsewhere
jest.mock('./utils/security', () => ({
  securityUtils: {
    csp: { applyCSP: jest.fn(), updateConfig: jest.fn() },
    xss: { containsXSS: jest.fn(() => false) },
    tokenStorage: {
      getToken: jest.fn(() => null),
      setToken: jest.fn(),
      removeToken: jest.fn(),
    },
  },
}));

// Import App after mocks to ensure they are applied
import App from './App';

test('renders app with main landmark', () => {
  render(<App />);
  // Assert main landmark is present for accessibility
  expect(screen.getByRole('main')).toBeInTheDocument();
});
