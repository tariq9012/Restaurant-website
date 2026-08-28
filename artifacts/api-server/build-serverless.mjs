import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import { rm, mkdir, writeFile } from "node:fs/promises";

// Plugins may use `require` to resolve dependencies
globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));

async function buildServerless() {
  const apiDir = path.resolve(artifactDir, "api");
  await rm(apiDir, { recursive: true, force: true });
  await mkdir(apiDir, { recursive: true });

  await esbuild({
    entryPoints: [path.resolve(artifactDir, "src/serverless/index.ts")],
    platform: "node",
    bundle: true,
    format: "esm",
    outfile: path.resolve(apiDir, "index.mjs"),
    logLevel: "info",
    external: [
      "*.node",
      "sharp",
      "better-sqlite3",
      "sqlite3",
      "canvas",
      "bcrypt",
      "argon2",
      "fsevents",
      "re2",
      "farmhash",
      "xxhash-addon",
      "bufferutil",
      "utf-8-validate",
      "ssh2",
      "cpu-features",
      "dtrace-provider",
      "isolated-vm",
      "lightningcss",
      "pg-native",
      "oracledb",
      "mongodb-client-encryption",
      "nodemailer",
      "handlebars",
      "knex",
      "typeorm",
      "protobufjs",
      "onnxruntime-node",
      "@tensorflow/*",
      "@prisma/client",
      "@mikro-orm/*",
      "@grpc/*",
      "@swc/*",
      "@aws-sdk/*",
      "@azure/*",
      "@opentelemetry/*",
      "@google-cloud/*",
      "@google/*",
      "googleapis",
      "firebase-admin",
      "@parcel/watcher",
      "@sentry/profiling-node",
      "@tree-sitter/*",
      "aws-sdk",
      "classic-level",
      "dd-trace",
      "ffi-napi",
      "grpc",
      "hiredis",
      "kerberos",
      "leveldown",
      "miniflare",
      "mysql2",
      "newrelic",
      "odbc",
      "piscina",
      "realm",
      "ref-napi",
      "rocksdb",
      "sass-embedded",
      "sequelize",
      "serialport",
      "snappy",
      "tinypool",
      "usb",
      "workerd",
      "wrangler",
      "zeromq",
      "zeromq-prebuilt",
      "playwright",
      "puppeteer",
      "puppeteer-core",
      "electron",
      "pino-pretty",
    ],
    sourcemap: false,
    banner: {
      js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
    `,
    },
  });

  // Remove raw TypeScript source after bundling: everything needed now lives
  // inside api/index.mjs. This also stops Vercel's own post-build TypeScript
  // pass from picking up (and choking on) src/app.ts.
  await rm(path.resolve(artifactDir, "src"), { recursive: true, force: true });
  await rm(path.resolve(artifactDir, "tsconfig.json"), { force: true });

  // Vercel (zero-config, "Other" framework) expects a static "public" output
  // directory to exist. This project has no static assets — every request is
  // rewritten to the API function — so this just needs to exist, not contain
  // anything meaningful.
  const publicDir = path.resolve(artifactDir, "public");
  await mkdir(publicDir, { recursive: true });
  await writeFile(
    path.resolve(publicDir, "index.html"),
    "<!doctype html><title>Luma API</title><p>API is running.</p>",
  );
}

buildServerless().catch((err) => {
  console.error(err);
  process.exit(1);
});
