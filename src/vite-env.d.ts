declare module '*.jpg' {
  const value: string;
  export default value;
}
// Add .jpeg, .png, etc., if needed
declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const value: string;
  export default value;
}

type _Shared<A, B> = Pick<A, Extract<keyof A, keyof B>>;

/** gets interfaction of properties shared between all objects */
type SharedProps<T extends [any, ...any[]]> = T extends [infer First, infer Second, ...infer Remaining] ? _Shared<First, SharedProps<[Second, ...Remaining]>> : T[0];
