import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  BunLogo,
  ClaudeLogo,
  CursorLogo,
  GithubLogo,
  NpmLogo,
  OpenaiLogo,
  PixelUILogo,
  PnpmLogo,
  VscodeLogo,
  XLogo,
  YarnLogo,
} from "./logos";

const meta = {
  title: "Brand/Logos",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const LOGOS = {
  GithubLogo,
  XLogo,
  NpmLogo,
  PnpmLogo,
  YarnLogo,
  BunLogo,
  ClaudeLogo,
  CursorLogo,
  VscodeLogo,
  OpenaiLogo,
};

export const PixelUI: Story = {
  render: () => (
    <div className="flex items-end gap-8">
      {["size-4", "size-8", "size-16", "size-32"].map((size) => (
        <PixelUILogo key={size} className={size} />
      ))}
    </div>
  ),
};

export const ThirdParty: Story = {
  render: () => (
    <div className="grid grid-cols-5 gap-6 text-foreground">
      {Object.entries(LOGOS).map(([name, Logo]) => (
        <div key={name} className="flex flex-col items-center gap-2 text-xs">
          <Logo className="size-8" />
          {name}
        </div>
      ))}
    </div>
  ),
};

export const PixelUIDark: Story = {
  render: () => (
    <div className="dark rounded-xl bg-[#222326] p-8">
      <PixelUILogo className="size-32" />
    </div>
  ),
};
