// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Polyfill Web Crypto for Jest (Node environment)
// Provides getRandomValues and uses Node's crypto.webcrypto if available
if (typeof global.crypto === 'undefined') {
  const nodeCrypto = require('crypto');
  const webcrypto = nodeCrypto.webcrypto;
  if (webcrypto) {
    // Use Node's built-in Web Crypto implementation
    Object.defineProperty(global, 'crypto', {
      value: webcrypto,
      writable: false,
    });
  } else {
    // Minimal shim for getRandomValues
    Object.defineProperty(global, 'crypto', {
      value: {
        getRandomValues: (typedArray) => {
          const buffer = require('crypto').randomBytes(typedArray.length);
          typedArray.set(buffer);
          return typedArray;
        },
        subtle: undefined,
      },
      writable: false,
    });
  }
}
