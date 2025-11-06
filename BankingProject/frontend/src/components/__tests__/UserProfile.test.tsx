import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: ({ element }) => element,
  Navigate: ({ to }) => <div data-testid="navigate">{to}</div>,
}));

// Mock the hooks and components
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      name: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phoneNumber: '+1234567890',
      dateOfBirth: '1990-01-01',
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      }
    },
    updateProfile: jest.fn().mockResolvedValue({ success: true }),
    updateProfileLoading: false,
    changePassword: jest.fn().mockResolvedValue({ success: true }),
    changePasswordLoading: false
  })
}));

jest.mock('../../hooks/useSecurity', () => ({
  useSecuritySettings: () => ({
    data: {
      twoFactorEnabled: true,
      biometricEnabled: false,
      sessionTimeout: 30
    },
    securitySettings: {
      twoFactorEnabled: true,
      biometricEnabled: false,
      sessionTimeout: 30
    },
    updateSecuritySettings: jest.fn(),
    updateSecuritySettingsLoading: false,
    isLoading: false,
    error: null
  }),
  useTwoFactor: () => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isLoading: false,
    isError: false,
    error: null
  }),
  useBiometric: () => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isLoading: false,
    isError: false,
    error: null
  }),
  useSessionTimeout: () => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isLoading: false,
    isError: false,
    error: null
  }),
  useValidateSession: () => ({
    data: { valid: true },
    isLoading: false,
    isError: false,
    error: null
  })
}));

jest.mock('../../hooks/useNotifications', () => ({
  useNotifications: () => ({
    notificationSettings: {
      email: true,
      sms: false,
      push: true,
      transactionAlerts: true,
      securityAlerts: true,
      marketingEmails: false
    },
    updateNotificationSettings: jest.fn(),
    isLoading: false,
    error: null
  }),
  useNotificationSettings: () => ({
    data: {
      email: true,
      sms: false,
      push: true,
      transactionAlerts: true,
      securityAlerts: true,
      marketingEmails: false
    },
    isLoading: false,
    isError: false,
    error: null
  }),
  useUpdateNotificationSettings: () => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isLoading: false,
    isError: false,
    error: null
  })
}));

jest.mock('../SecurityProvider', () => ({
  useSecurity: () => ({
    validateSession: jest.fn().mockResolvedValue(true),
    sanitizeInput: jest.fn((input) => input)
  })
}));

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  useForm: () => ({
    register: jest.fn(),
    handleSubmit: jest.fn((fn) => (e) => {
      e?.preventDefault?.();
      return fn({});
    }),
    formState: { errors: {}, isSubmitting: false },
    watch: jest.fn(() => ({})),
    reset: jest.fn(),
    setValue: jest.fn(),
    getValues: jest.fn(() => ({}))
  })
}));

// Mock zod
jest.mock('zod', () => {
  const createChainable = (methods = {}) => {
    const chainable = { ...methods };
    // Add optional method that returns itself
    chainable.optional = jest.fn(() => chainable);
    // Add other common methods that return the chainable object
    chainable.min = jest.fn(() => chainable);
    chainable.max = jest.fn(() => chainable);
    chainable.email = jest.fn(() => chainable);
    chainable.refine = jest.fn(() => chainable);
    chainable.parse = jest.fn((data) => data);
    chainable.safeParse = jest.fn((data) => ({ success: true, data }));
    return chainable;
  };

  return {
    z: {
      object: jest.fn((schema) => createChainable()),
      string: jest.fn(() => createChainable()),
      number: jest.fn(() => createChainable()),
      boolean: jest.fn(() => createChainable())
    }
  };
});

// Mock @hookform/resolvers/zod
jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: jest.fn(() => jest.fn())
}));

// Mock XSSProtection
jest.mock('../../utils/security', () => ({
  XSSProtection: {
    sanitizeHTML: jest.fn((html) => html)
  }
}));


// Mock UI components
jest.mock('../ui/Input', () => {
  const React = require('react');
  return {
    Input: ({ 
      label, 
      error, 
      'aria-label': ariaLabel,
      'aria-required': ariaRequired,
      'aria-invalid': ariaInvalid,
      'aria-describedby': ariaDescribedBy,
      icon,
      ...props 
    }: any) => 
      React.createElement('div', null,
        label && React.createElement('label', { htmlFor: props.id || props.name }, label),
        React.createElement('input', { 
          ...props, 
          'aria-label': ariaLabel,
          'aria-required': ariaRequired,
          'aria-invalid': ariaInvalid,
          'aria-describedby': ariaDescribedBy
        }),
        error && React.createElement('span', { role: 'alert' }, error)
      ),
  };
});

jest.mock('../ui/Button', () => {
  const React = require('react');
  return {
    Button: ({ 
      children, 
      loading, 
      disabled,
      'aria-label': ariaLabel,
      ...props 
    }: any) => 
      React.createElement('button', { 
        ...props, 
        disabled: disabled || loading,
        'aria-label': ariaLabel
      }, loading ? 'Loading...' : children),
  };
});

jest.mock('../ui/Card', () => {
  const React = require('react');
  return {
    Card: ({ children, ...props }: any) => React.createElement('div', props, children),
  };
});

// Mock Tabs with proper context support
jest.mock('../ui/Tabs', () => {
  const React = require('react');
  const { createContext, useContext, useState } = React;
  
  const TabsContext = createContext({ activeTab: 'profile', setActiveTab: () => {} });
  
  return {
    Tabs: ({ children, activeTab, onTabChange, 'aria-label': ariaLabel, ...props }: any) => {
      const [currentTab, setCurrentTab] = useState(activeTab || 'profile');
      const handleTabChange = (tab: string) => {
        setCurrentTab(tab);
        onTabChange?.(tab);
      };
      return (
        <TabsContext.Provider value={{ activeTab: currentTab, setActiveTab: handleTabChange }}>
          <div role="tablist" aria-label={ariaLabel} {...props}>{children}</div>
        </TabsContext.Provider>
      );
    },
    TabList: ({ children }: any) => <div>{children}</div>,
    Tab: ({ children, id, onClick, 'aria-label': ariaLabel, ...props }: any) => {
      const context = useContext(TabsContext);
      const isActive = context?.activeTab === id;
      return (
        <button 
          role="tab" 
          aria-selected={isActive} 
          aria-label={ariaLabel}
          onClick={() => {
            context?.setActiveTab?.(id);
            onClick?.();
          }}
          {...props}
        >
          {children}
        </button>
      );
    },
    TabPanel: ({ children, id, ...props }: any) => {
      const context = useContext(TabsContext);
      const isActive = context?.activeTab === id;
      return isActive ? (
        <div role="tabpanel" {...props}>{children}</div>
      ) : null;
    },
  };
});

jest.mock('../ui/Switch', () => {
  const React = require('react');
  return {
    Switch: ({ checked, onChange, ...props }: any) => (
      React.createElement('input', { type: 'checkbox', checked, onChange: (e: any) => onChange?.(e.target.checked), ...props })
    ),
  };
});

jest.mock('../ui/ProgressBar', () => {
  const React = require('react');
  return {
    ProgressBar: ({ value, max, 'aria-label': ariaLabel, ...props }: any) => (
      React.createElement('div', { role: 'progressbar', 'aria-valuenow': value, 'aria-valuemin': 0, 'aria-valuemax': max || 100, 'aria-label': ariaLabel, ...props })
    ),
  };
});

jest.mock('../ui/Alert', () => {
  const React = require('react');
  return {
    Alert: ({ children, type, title, icon, ...props }: any) => (
      React.createElement('div', { role: type === 'error' ? 'alert' : 'status', ...props },
        title && React.createElement('strong', null, title),
        children
      )
    ),
  };
});

jest.mock('../ui/Select', () => {
  const React = require('react');
  return {
    Select: ({ label, error, options = [], icon, ...props }: any) => (
      React.createElement('div', null,
        label && React.createElement('label', { htmlFor: props.id || props.name }, label),
        React.createElement('select', { ...props },
          options.map((opt: any) => React.createElement('option', { value: opt.value, key: opt.value }, opt.label))
        ),
        error && React.createElement('span', { role: 'alert' }, error)
      )
    ),
  };
});

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock framer-motion
jest.mock('framer-motion', () => {
  const React = require('react');
  const createMotionComponent = (tag: string) => ({ children, ...props }: any) => {
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
      form: createMotionComponent('form'),
      input: createMotionComponent('input'),
      select: createMotionComponent('select'),
      label: createMotionComponent('label'),
    },
    AnimatePresence: ({ children }: any) => children
  };
});

// Mock heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  UserIcon: () => <svg data-testid="user-icon" />,
  EnvelopeIcon: () => <svg data-testid="envelope-icon" />,
  PhoneIcon: () => <svg data-testid="phone-icon" />,
  MapPinIcon: () => <svg data-testid="map-pin-icon" />,
  ShieldCheckIcon: () => <svg data-testid="shield-check-icon" />,
  KeyIcon: () => <svg data-testid="key-icon" />,
  DevicePhoneMobileIcon: () => <svg data-testid="device-phone-icon" />,
  BellIcon: () => <svg data-testid="bell-icon" />,
  PaintBrushIcon: () => <svg data-testid="paint-brush-icon" />,
  GlobeAltIcon: () => <svg data-testid="globe-icon" />,
  EyeIcon: () => <svg data-testid="eye-icon" />,
  EyeSlashIcon: () => <svg data-testid="eye-slash-icon" />,
  CheckCircleIcon: () => <svg data-testid="check-circle-icon" />,
  XCircleIcon: () => <svg data-testid="x-circle-icon" />,
  ExclamationTriangleIcon: () => <svg data-testid="exclamation-icon" />,
  InformationCircleIcon: () => <svg data-testid="info-icon" />,
}));

jest.mock('@heroicons/react/24/solid', () => ({
  UserCircleIcon: () => <svg data-testid="user-circle-icon" />,
  CogIcon: () => <svg data-testid="cog-icon" />,
  LockClosedIcon: () => <svg data-testid="lock-icon" />,
  BellAlertIcon: () => <svg data-testid="bell-alert-icon" />,
  SwatchIcon: () => <svg data-testid="swatch-icon" />,
  DeviceIcon: () => <svg data-testid="device-icon" />,
}));

// Import component after mocks to ensure mocks take effect
import UserProfile from '../UserProfile';

const renderUserProfile = () => {
  render(<UserProfile />);
};

describe('UserProfile Component', () => {
  test('renders profile tab by default', () => {
    renderUserProfile();
    // The component header is "Account Settings"; assert that instead
    expect(screen.getByRole('heading', { name: /account settings/i })).toBeInTheDocument();
    // Also ensure a profile field is present
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
  });
});