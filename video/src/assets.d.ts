// Image files imported through the Remotion bundler resolve to a URL string.
declare module "*.png" {
  const src: string;
  export default src;
}
