import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { defineConfig } from 'tsdown';

/** 平台种子模块：宿主冻结模块表提供的浏览器模块，bundle 必须保持 external。 */
const PLATFORM_MODULES = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-web-react',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-attachment',
  '@deepseek-ai/dsh-client-schema-form',
] as const;

/** 浏览器产物注册 id，必须与 package.json 的 name 一致。 */
const CLIENT_ID = 'dsh-plugin-meta-tools';

/** 官方选择器样式注入到浏览器产物，避免额外的 CSS 文件。 */
function inlineClientCss(): void {
  const cssFile = path.resolve('dist/client.css');
  const jsFile = path.resolve('dist/client.js');
  if (!existsSync(cssFile) || !existsSync(jsFile)) return;
  const css = readFileSync(cssFile, 'utf8');
  const js = readFileSync(jsFile, 'utf8');
  const marker = 'data-dsh-meta-tools-model-selection';
  if (!js.includes(marker)) {
    const injection = `\n;(() => { if (typeof document === 'undefined') return; const id = 'dsh-plugin-meta-tools-model-selection'; document.getElementById(id)?.remove(); const style = document.createElement('style'); style.id = id; style.setAttribute('${marker}', ''); style.textContent = ${JSON.stringify(css)}; document.head.append(style); })();\n`;
    writeFileSync(jsFile, `${js}${injection}`);
  }
  rmSync(cssFile);
}

/**
 * 两组构建：
 * 1) 宿主插件入口 → dist/index.mjs。npm 依赖保持 external，
 *    类型声明由 tsc -p tsconfig.build.json 生成。
 * 2) 浏览器入口 → dist/client.js。调用
 *    window.__ModuleLoader__.load({ id, factory }) 注册插件，
 *    require 只解析平台种子，其余模块内联。
 *    clean 只在宿主构建上开启；client 配置排在后面且 clean: false，
 *    避免清掉先前产物。
 */
export default defineConfig([
  {
    name: 'dsh-plugin-meta-tools/host',
    entry: ['src/index.ts'],
    outDir: 'dist',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    deps: {
      // 运行时使用宿主提供的依赖实例
      neverBundle: true,
      // 需要打包进产物的依赖
      alwaysBundle: [],
    },
    fixedExtension: true,
    dts: false,
    clean: true,
  },
  {
    name: 'dsh-plugin-meta-tools/client',
    entry: { client: 'src/client/index.ts' },
    outDir: 'dist',
    format: 'cjs',
    platform: 'browser',
    target: 'es2024',
    dts: false,
    clean: false,
    css: { fileName: 'client.css' },
    onSuccess: inlineClientCss,
    deps: {
      // 平台种子不得内联；其余依赖（含 devDependencies）一律内联，
      // 宿主模块表里没有的 require 会在运行时直接抛错。
      neverBundle: [...PLATFORM_MODULES],
      alwaysBundle: (id: string) => !(PLATFORM_MODULES as readonly string[]).includes(id),
    },
    outputOptions: {
      entryFileNames: 'client.js',
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(CLIENT_ID)}, factory: (require) => {`,
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  },
]);
