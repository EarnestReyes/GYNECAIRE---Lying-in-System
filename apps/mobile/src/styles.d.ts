
declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}

declare module "*.css";

declare module "*.png" {
  const source: import('react-native').ImageSourcePropType;
  export default source;
}
