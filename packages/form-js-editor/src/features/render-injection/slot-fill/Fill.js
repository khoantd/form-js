import { FillContext, defaultContext } from './FillContext';
import { useContext, useEffect, useRef } from 'preact/compat';

export const Fill = (props) => {
  const uid = useRef(Symbol('fill_uid'));
  const fillContext = useContext(FillContext);

  useEffect(() => {
    // Check if context is the default (uninitialized) context
    if (!fillContext || fillContext._isDefault || fillContext === defaultContext) {
      return;
    }

    // Verify the context has the required methods
    if (typeof fillContext.addFill !== 'function' || typeof fillContext.removeFill !== 'function') {
      return;
    }

    fillContext.addFill({ id: uid, ...props });
    return () => {
      fillContext.removeFill(uid);
    };
  }, [fillContext, props]);

  return null;
};
