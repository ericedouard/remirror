import { EDITOR_CLASS_SELECTOR } from '@remirror/core';
import { ObjectInterpolation } from 'emotion';

export interface PlaceholderContent {
  selector: string;
  content: string;
}

export const defaultStyles = (placeholder?: PlaceholderContent): ObjectInterpolation<any> => ({
  [EDITOR_CLASS_SELECTOR]: {
    caretColor: 'currentColor',
    wordWrap: 'break-word',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
  },
  [`.${EDITOR_CLASS_SELECTOR}:focus`]: {
    outline: 'none',
  },
  ...(placeholder
    ? {
        [placeholder.selector]: {
          position: 'absolute',
          color: '#aaa',
          pointerEvents: 'none',
          height: 0,
          fontStyle: 'italic',
        },
      }
    : {}),
});
