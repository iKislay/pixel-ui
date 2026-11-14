import { REGISTRY_REPO } from "@/lib/components";

export async function fetchStarCount() {
  try {
    const res = await fetch(`https://api.github.com/repos/${REGISTRY_REPO}`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    return (data.stargazers_count as number) ?? null;
  } catch {
    return null;
  }
}

export type Sponsor = { login: string; name: string; avatarUrl: string; href: string };

type SponsorEntity = { login: string; name: string | null; avatarUrl: string; websiteUrl: string | null; url: string };

const SPONSORS_QUERY = `{
  user(login: "iKislay") {
    sponsorshipsAsMaintainer(first: 100, activeOnly: true) {
      nodes {
        tier { description }
        sponsorEntity {
          ... on User { login name avatarUrl websiteUrl url }
          ... on Organization { login name avatarUrl websiteUrl url }
        }
      }
    }
  }
}`;

// github does not record which repo a sponsorship came from, so pixel ui sponsors are the ones on a tier that names it
const PIXEL_UI_TIER = /pixel[\s-]?ui/i;

export function sponsorHref({ websiteUrl, url }: Pick<SponsorEntity, "websiteUrl" | "url">) {
  try {
    const href = new URL(/^https?:\/\//i.test(websiteUrl ?? "") ? websiteUrl! : `https://${websiteUrl}`);
    href.searchParams.set("utm_source", "pixelui.dev");
    href.searchParams.set("utm_medium", "referral");
    href.searchParams.set("utm_campaign", "sponsors");
    return href.toString();
  } catch {
    return url;
  }
}

export async function fetchSponsors(): Promise<Sponsor[]> {
  const token = process.env.GITHUB_SPONSORS_TOKEN;
  if (!token) return [];
  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: SPONSORS_QUERY }),
      next: { revalidate: 3600 },
    });
    const { data } = await res.json();
    const nodes: { tier: { description: string } | null; sponsorEntity: SponsorEntity | null }[] =
      data?.user?.sponsorshipsAsMaintainer?.nodes ?? [];
    return nodes.flatMap(({ tier, sponsorEntity: s }) =>
      s && PIXEL_UI_TIER.test(tier?.description ?? "")
        ? [{ login: s.login, name: s.name || s.login, avatarUrl: s.avatarUrl, href: s.websiteUrl ? sponsorHref(s) : s.url }]
        : [],
    );
  } catch {
    return [];
  }
}
