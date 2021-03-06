import { InputRule } from 'prosemirror-inputrules';
import { Fragment, Mark, MarkType, Node as PMNode, Slice } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';
import { Attrs, InputRuleCreator, PluginCreator } from '../types';
import { Cast, findMatches, isFunction } from './base';

/**
 * Creates an input rule based on the provided regex for the provided mark type
 *
 * @param regex
 * @param markType
 * @param getAttrs
 */
export const markInputRule = (
  regex: RegExp,
  markType: MarkType,
  getAttrs?: ((attrs: string[]) => Attrs) | Attrs,
) => {
  return new InputRule(regex, (state, match, start, end) => {
    const attrs = isFunction(getAttrs) ? getAttrs(match) : getAttrs;
    const { tr } = state;
    let markEnd = end;

    if (match[1]) {
      const startSpaces = match[0].search(/\S/);
      const textStart = start + match[0].indexOf(match[1]);
      const textEnd = textStart + match[1].length;
      if (textEnd < end) {
        tr.delete(textEnd, end);
      }
      if (textStart > start) {
        tr.delete(start + startSpaces, textStart);
      }
      markEnd = start + startSpaces + match[1].length;
    }

    tr.addMark(start, markEnd, markType.create(attrs));
    tr.removeStoredMark(markType); // Do not continue with mark.
    return tr;
  });
};

export const markPasteRule: PluginCreator = (regexp, type, getAttrs) => {
  const handler = (fragment: Fragment) => {
    const nodes: PMNode[] = [];

    fragment.forEach(child => {
      if (child.isText) {
        const text = child.text || '';
        let pos = 0;

        findMatches(text, regexp).forEach(match => {
          if (match[1]) {
            const start = match.index;
            const end = start + match[0].length;
            const textStart = start + match[0].indexOf(match[1]);
            const textEnd = textStart + match[1].length;
            const attrs = isFunction(getAttrs) ? getAttrs(match) : getAttrs;

            // adding text before markdown to nodes
            if (start > 0) {
              nodes.push(child.cut(pos, start));
            }

            // adding the markdown part to nodes
            nodes.push(
              child.cut(textStart, textEnd).mark(Cast<Mark>(type.create(attrs!)).addToSet(child.marks)),
            );

            pos = end;
          }
        });

        // adding rest of text to nodes
        if (text && pos < text.length) {
          nodes.push(child.cut(pos));
        }
      } else {
        nodes.push(child.copy(handler(child.content)));
      }
    });

    return Fragment.fromArray(nodes);
  };

  return new Plugin({
    props: {
      transformPasted: slice => new Slice(handler(slice.content), slice.openStart, slice.openEnd),
    },
  });
};

export const nodeInputRule: InputRuleCreator = (regexp, type, getAttrs) => {
  return new InputRule(regexp, (state, match, start, end) => {
    const attrs = isFunction(getAttrs) ? getAttrs(match) : getAttrs;
    const { tr } = state;

    if (match[0]) {
      tr.replaceWith(start - 1, end, type.create(attrs!));
    }

    return tr;
  });
};

export const enhancedNodeInputRule: InputRuleCreator = (regexp, type, getAttrs) => {
  return new InputRule(regexp, (state, match, start, end) => {
    end = start > end ? start : end;
    const attrs = isFunction(getAttrs) ? getAttrs(match) : getAttrs;
    const { tr } = state;

    const str = match[0];

    if (str) {
      tr.replaceWith(start, end, type.create(attrs!));
    }

    return tr;
  });
};
