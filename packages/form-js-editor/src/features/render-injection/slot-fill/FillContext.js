import { createContext } from 'preact';

const defaultContext = {
  addFill(uid, props) {
    throw new Error('FillContext.addFill() uninitialized');
  },
  removeFill(uid) {
    throw new Error('FillContext.addFill() uninitialized');
  },
  _isDefault: true,
};

export const FillContext = createContext(defaultContext);

// Export default context for comparison
export { defaultContext };
