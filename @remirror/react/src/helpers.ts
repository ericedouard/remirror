import { jsx } from '@emotion/core';
import {
  bool,
  Cast,
  EMPTY_OBJECT_NODE,
  isArray,
  isFunction,
  isObject,
  isString,
  PlainObject,
  Predicate,
  uniqueArray,
} from '@remirror/core';
import { Children, isValidElement, ReactNode } from 'react';
import {
  AttributePropFunction,
  RemirrorComponentType,
  RemirrorElement,
  RemirrorElementType,
  RemirrorProps,
  RenderPropFunction,
} from './types';

/**
 * Alias for checking if a the attribute function is valid and also typecasting the return as a AttributePropFunction
 */
export const isAttributeFunction = Cast<Predicate<AttributePropFunction>>(isFunction);

/**
 * Alias for checking if a render props is valid and also typecasting the return as a RenderPropFunction
 */
export const isRenderProp = Cast<Predicate<RenderPropFunction>>(isFunction);

/**
 * Check whether a react node is a built in dom element (i.e. `div`, `span`)
 *
 * @param element
 */
export const isDOMElement = (element: ReactNode) => {
  return isValidElement(element) && isString(element.type);
};

/**
 * Retrieve the element props for JSX Element
 *
 * @param element
 */
export const getElementProps = (element: JSX.Element): PlainObject & { children: JSX.Element } => {
  return element ? element.props : {};
};

/**
 * Utility for generating a unique class name
 *
 * @param uid
 * @param className
 */
export const uniqueClass = (uid: string, className: string) => `${className}-${uid}`;

/**
 * Utility for properly typechecking static defaultProps for a class component in react.
 *
 * ```ts
 * static defaultProps = asDefaultProps<RemirrorProps>()({
 *   initialContent: EMPTY_OBJECT_NODE,
 * });
 * ```
 */
export const asDefaultProps = <GProps extends {}>() => <GDefaultProps extends Partial<GProps>>(
  props: GDefaultProps,
): GDefaultProps => props;

/**
 * Finds a deeply nested child by the key provided.
 *
 * @param children
 * @param key
 */
export const findChildWithKey = (children: ReactNode, key: string): ReactNode => {
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) {
      continue;
    }

    if (child.key === key) {
      return child;
    }
    const subChildren = child.props && Cast(child.props).children;

    if (subChildren) {
      return findChildWithKey(subChildren, key);
    }
  }
  return null;
};

/**
 * Searches the react tree for a child node with the requested key and updates
 * it using the updater function once found
 *
 * @param children
 * @param key
 * @param updateFunction
 */
export const updateChildWithKey = (
  children: ReactNode,
  key: string,
  updateFunction: (child: JSX.Element) => JSX.Element,
): ReactNode[] => {
  let keyFound = false;
  return Children.map(children, child => {
    if (keyFound) {
      return child;
    }

    if (!isValidElement(child)) {
      return child;
    }

    if (child.key === key) {
      keyFound = true;
      return updateFunction(child);
    }

    const subChildren = child.props && Cast(child.props).children;
    if (subChildren) {
      return updateChildWithKey(subChildren, key, updateFunction);
    }

    return child;
  });
};

export const defaultProps = asDefaultProps<RemirrorProps>()({
  initialContent: EMPTY_OBJECT_NODE,
  editable: true,
  usesBuiltInExtensions: true,
  attributes: {},
  usesDefaultStyles: true,
  label: '',
  editorStyles: {},
  insertPosition: 'end',
  customRootProp: false,
});

/**
 * Checks if this element has a type of any RemirrorComponent
 *
 * @param value
 */
export const isRemirrorElement = <GOptions extends {} = any>(
  value: unknown,
): value is RemirrorElement<GOptions> => {
  return bool(
    isObject(value) &&
      isValidElement(value) &&
      (value.type as RemirrorComponentType<GOptions>).$$remirrorType,
  );
};

const isRemirrorElementOfType = (type: RemirrorElementType) => <GOptions extends {} = any>(
  value: unknown,
): value is RemirrorElement<GOptions> => isRemirrorElement(value) && value.type.$$remirrorType === type;

/**
 * Finds if this is a RemirrorExtension type. These are used to configure the extensions that determine
 * the underlying behaviour of the editor.
 *
 * @param value
 */
export const isRemirrorExtension = isRemirrorElementOfType(RemirrorElementType.Extension);

/**
 * Finds if this is a RemirrorEditor (which provides the RemirrorInjectedProps into the context);
 *
 * @param value
 */
export const isRemirrorEditor = isRemirrorElementOfType(RemirrorElementType.EditorProvider);

/**
 * Checks if this is a ManagedRemirrorEditor which pulls in the manager from the context and places it's children
 * inside the RemirrorEditor
 *
 * @param value
 */
export const isManagedRemirrorEditor = isRemirrorElementOfType(RemirrorElementType.ManagedEditorProvider);

/**
 * Clones an element while also enabling the css prop on jsx elements at the same time
 *
 * @param element
 * @param props
 * @param rest
 *
 * @returns a cloned react element with builtin support for the emotion `css` props
 */
export const cloneElement = (element: any, props: any, ...rest: ReactNode[]) => {
  const children = uniqueArray([
    ...(isArray(props.children) ? props.children : props.children ? [props.children] : []),
    ...(isArray(rest) ? rest : rest ? [rest] : []),
  ]);

  return jsx(
    element.type,
    {
      key: element.key,
      ref: element.ref,
      ...element.props,
      ...props,
    },
    ...children,
  );
};
