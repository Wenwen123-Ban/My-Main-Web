# Launch AI gen

This document explains how to run the React/TypeScript `AI gen` application inside the `AI gen/` folder.

## Setup

1. Open a terminal in the project root:
   - `c:\My Programs\My Main Web`
2. Change into the `AI gen` directory:
   - `cd "AI gen"`
3. Install dependencies if not already installed:
   - `npm install`

## Run locally

Start the Vite development server:

```bash
npm run dev
```

Then open the URL shown in the terminal, typically:

```text
http://localhost:3000
```

## Build for production

To build the static production assets:

```bash
npm run build
```

## Preview the production build

After building, run:

```bash
npm run preview
```

Then open the preview URL shown in the terminal.

## Notes

- The app uses `vite` and `react`.
- The code imports root JSON files from `..` and `../..` paths, so running inside `AI gen/` is required.
- `tsconfig.json` is configured with `resolveJsonModule` and `esModuleInterop` to allow JSON imports.
- If you need to re-run validation only:

```bash
npm run lint
```
