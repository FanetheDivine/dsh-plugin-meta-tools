/** CSS Modules 的类型声明，用于复用官方模型选择器样式。 */
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
