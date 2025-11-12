import { createContext } from 'preact';

const defaultFormRenderContext = {
  Empty: (props) => {
    return null;
  },
  Hidden: (props) => {
    return null;
  },
  Children: (props) => {
    return (
      <div class={props.class} style={props.style}>
        {props.children}
      </div>
    );
  },
  Element: (props) => {
    return (
      <div class={props.class} style={props.style}>
        {props.children}
      </div>
    );
  },
  Row: (props) => {
    return (
      <div class={props.class} style={props.style}>
        {props.children}
      </div>
    );
  },
  Column: (props) => {
    if (props.field?.type === 'default') {
      return props.children;
    }

    return (
      <div class={props.class} style={props.style}>
        {props.children}
      </div>
    );
  },
  hoverInfo: {
    cleanup: () => {},
  },
};

export const FormRenderContext = createContext(defaultFormRenderContext);

// Export default value for use in providers
export const defaultFormRenderContextValue = defaultFormRenderContext;
