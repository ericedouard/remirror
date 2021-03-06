import {
  Attrs,
  Cast,
  ExtensionManagerParams,
  getMarkRange,
  getMatchString,
  getSelectedWord,
  KeyboardBindings,
  markActive,
  MarkExtension,
  MarkExtensionOptions,
  MarkExtensionSpec,
  markPasteRule,
  removeMark,
  SchemaMarkTypeParams,
  updateMark,
} from '@remirror/core';
import { Plugin, TextSelection } from 'prosemirror-state';

export type InvokedFromType = 'keyboard' | 'input-rule';

export interface LinkOptions extends MarkExtensionOptions {
  /**
   * Return true to intercept the activation. This is useful for showing a dialog to replace the selected text.
   */
  activationHandler?(): void;
}

export class Link extends MarkExtension<LinkOptions> {
  get name() {
    return 'link' as const;
  }

  get defaultOptions() {
    return {
      activationHandler: () => false,
    };
  }

  get schema(): MarkExtensionSpec {
    return {
      attrs: {
        href: {
          default: null,
        },
      },
      inclusive: false,
      parseDOM: [
        {
          tag: 'a[href]',
          getAttrs: dom => ({
            href: Cast<Element>(dom).getAttribute('href'),
          }),
        },
      ],
      toDOM: node => [
        'a',
        {
          ...node.attrs,
          rel: 'noopener noreferrer nofollow',
        },
        0,
      ],
    };
  }

  public keys(): KeyboardBindings {
    return {
      'Mod-k': (state, dispatch) => {
        // Expand selection
        const range = getSelectedWord(state);
        if (!range) {
          return false;
        }
        const { from, to } = range;
        const tr = state.tr.setSelection(TextSelection.create(state.doc, from, to));
        if (dispatch) {
          dispatch(tr);
        }

        this.options.activationHandler();

        return true;
      },
    };
  }

  public active({ getEditorState, schema }: ExtensionManagerParams) {
    const type = schema.marks[this.name];
    const state = getEditorState();
    return {
      remove: () => {
        return !markActive(state, type);
      },
    };
  }

  public commands({ type }: SchemaMarkTypeParams) {
    return {
      toggle: (attrs?: Attrs) => {
        if (attrs && attrs.href) {
          return updateMark(type, attrs);
        }
        return removeMark(type);
      },
      update: (attrs?: Attrs) => updateMark(type, attrs),
      remove: () => {
        return removeMark(type);
      },
    };
  }

  public pasteRules({ type }: SchemaMarkTypeParams) {
    return [
      markPasteRule(
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g,
        type,
        url => ({ href: getMatchString(url) }),
      ),
    ];
  }

  public plugin({ type }: SchemaMarkTypeParams) {
    return new Plugin({
      props: {
        handleClick(view, pos) {
          const { doc, tr } = view.state;
          const range = getMarkRange(doc.resolve(pos), type);

          if (!range) {
            return false;
          }

          const $start = doc.resolve(range.from);
          const $end = doc.resolve(range.to);
          const transaction = tr.setSelection(new TextSelection($start, $end));

          view.dispatch(transaction);
          return true;
        },
      },
    });
  }
}
