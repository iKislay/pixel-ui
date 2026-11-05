<div align="center">
  <a href="https://pixelui.dev">
    <img src="public/assets/repoassets/repoimg.png" alt="Pixel UI" width="100%" />
  </a>
  <br />
  <br />
  <a href="https://vercel.com/open-source-program">
    <img alt="Vercel OSS Program" src="https://vercel.com/oss/program-badge-2026.svg" />
  </a>
</div>

<div align="center">

**A shadcn registry of pixel-perfect, ready-to-use components and animations.**

<img src="https://img.shields.io/badge/Next.js-0a0a0a?logo=nextdotjs&logoColor=FC4C01" alt="Next.js" />
<img src="https://img.shields.io/badge/Tailwind_CSS-0a0a0a?logo=tailwindcss&logoColor=FC4C01" alt="Tailwind CSS" />
<img src="https://img.shields.io/badge/TypeScript-0a0a0a?logo=typescript&logoColor=FC4C01" alt="TypeScript" />
<img src="https://img.shields.io/badge/shadcn-registry-FC4C01?labelColor=0a0a0a" alt="shadcn registry" />
<img src="https://img.shields.io/badge/license-MIT%20%2B%20Commons%20Clause%20%2B%20Attribution-0a0a0a?labelColor=0a0a0a&color=FC4C01" alt="MIT + Commons Clause + Attribution" />

[**pixelui.dev**](https://pixelui.dev) &nbsp;&middot;&nbsp; [Components](https://pixelui.dev/components) &nbsp;&middot;&nbsp; [Follow on X](https://x.com/pixeluiHQ)

</div>

<br />

Pixel UI is a shadcn registry built with Next.js, Tailwind CSS, and TypeScript. Every component is animated with Motion, honors `prefers-reduced-motion`, and installs straight into your codebase. You own the code: no package to depend on, restyle anything.

## Quick start

Install any component with the shadcn CLI:

```bash
npx shadcn@latest add ikislay/pixel-ui/{component-name}
```

For example:

```bash
npx shadcn@latest add ikislay/pixel-ui/fluid-orb
```

Browse every component, with live previews and props, at [pixelui.dev/components](https://pixelui.dev/components).

## MCP (Claude Code, Cursor, Codex)

In your project, add this to `components.json`:

```json
{
  "registries": {
    "@pixel-ui": "https://raw.githubusercontent.com/ikislay/pixel-ui/main/public/r/{name}.json"
  }
}
```

Then:

```bash
npx shadcn@latest mcp init --client claude
# or: --client cursor | vscode
```

Ask: `add @pixel-ui/fluid-orb`

Or just: `Add the fluid orb from Pixel UI`

Not `add fluid-orb` on its own. That looks in the default shadcn registry.

Full steps: [pixelui.dev/mcp](https://pixelui.dev/mcp).

## Running locally

```bash
git clone https://github.com/ikislay/pixel-ui.git
cd pixel-ui
npm install
npm run dev
```

Components live in `components/ui`. After changing a component or `registry.json`, rebuild the registry output with `npm run registry:build`.

## Contributing

Issues and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) for the full walkthrough, from creating a component to a working install command.

## License

MIT with the [Commons Clause and an attribution requirement](LICENSE). Use, modify and ship the components in anything you build, personal or commercial, closed source included.

Credit is required. Any project shipping a Pixel UI component must credit Pixel UI with a visible link to [pixelui.dev](https://pixelui.dev), in a footer, an about page, a credits screen or a README, and must keep the credit and copyright notice in the source it copied.

You may not sell, sublicense or redistribute the components themselves, alone, in a bundle, or ported to another framework.

The name Pixel UI, the logo and the site design are not covered by the license.

<div align="center">
  <br />
  <img src="public/logos/Pixelui.svg" alt="" width="28" />
  <p><sub>Built by <a href="https://x.com/whykislay">@whykislay</a></sub></p>
</div>
