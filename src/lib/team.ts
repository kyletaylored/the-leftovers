/**
 * Turns a `team` entry's contact fields into `ProfileCard` links. Only filled-in
 * fields appear. Each label is the link's whole accessible name, since an icon
 * is all a sighted visitor sees.
 */
import type { IconName } from '@/components/brand/Icon.astro';

interface Member {
  name: string;
  email?: string;
  socials: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
    website?: string;
  };
}

export function memberLinks({ name, email, socials }: Member) {
  const links: Array<{ icon: IconName; href?: string; label: string }> = [
    { icon: 'instagram', href: socials.instagram, label: `${name} on Instagram` },
    { icon: 'facebook', href: socials.facebook, label: `${name} on Facebook` },
    { icon: 'tiktok', href: socials.tiktok, label: `${name} on TikTok` },
    { icon: 'youtube', href: socials.youtube, label: `${name} on YouTube` },
    { icon: 'globe', href: socials.website, label: `${name}'s website` },
    { icon: 'mail', href: email && `mailto:${email}`, label: `Email ${name}` },
  ];
  return links.filter((link): link is typeof link & { href: string } => Boolean(link.href));
}
