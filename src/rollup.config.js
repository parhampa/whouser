import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';

export default [
  // Build for ESM and CJS
  {
    input: 'src/index.js',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'default',
      },
      {
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      terser({
        compress: {
          drop_console: true, // حذف console.log در محیط production
        },
      }),
    ],
    external: [], // هیچ وابستگی خارجی نداریم
  },
  // Build TypeScript declarations (if you have .d.ts in src or generate via JSDoc)
  {
    input: 'src/index.d.ts', // اگر فایل تعاریف وجود داشته باشد، اما فعلاً نداریم، پس از index.js استفاده می‌کنیم؟
    // بهتر است از یک فایل d.ts جداگانه استفاده کنیم، اما فعلاً فرض می‌کنیم که وجود دارد.
    // در پروژه اصلی فایل تعاریف در src/index.d.ts هست؟ بله، وجود دارد.
    output: [{ file: 'dist/index.d.ts', format: 'es' }],
    plugins: [dts()],
  },
];
