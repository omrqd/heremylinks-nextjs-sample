import { notFound } from 'next/navigation';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import PublicBioPage from './PublicBioPage';

interface User extends RowDataPacket {
  id: string;
  username: string;
  name: string | null;
  bio: string | null;
  profile_image: string | null;
  hero_image: string | null;
  theme_color: string | null;
  background_color: string | null;
  template: string | null;
  background_image: string | null;
  background_video: string | null;
  card_background_color: string | null;
  card_background_image: string | null;
  card_background_video: string | null;
  custom_text: string | null;
  username_color: string | null;
  bio_color: string | null;
  custom_text_color: string | null;
  is_published: boolean;
}

interface BioLink extends RowDataPacket {
  id: string;
  title: string;
  url: string;
  icon: string | null;
  image: string | null;
  layout: string | null;
  background_color: string | null;
  text_color: string | null;
  is_transparent: boolean;
  order: number;
}

interface SocialLink extends RowDataPacket {
  id: string;
  platform: string;
  url: string;
  icon: string;
}

async function getUserByUsername(username: string) {
  try {
    const [rows] = await db.query<User[]>(
      `SELECT id, username, name, bio, profile_image, hero_image, theme_color, background_color, template, 
              background_image, background_video, card_background_color, card_background_image,
              card_background_video, custom_text, username_color, bio_color, custom_text_color, is_published
       FROM users WHERE LOWER(username) = LOWER(?) AND is_published = TRUE LIMIT 1`,
      [username]
    );

    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

async function getUserLinks(userId: string) {
  try {
    const [rows] = await db.query<BioLink[]>(
      `SELECT id, title, url, icon, image, layout, background_color, text_color, is_transparent, \`order\`
       FROM bio_links WHERE user_id = ? AND is_visible = TRUE ORDER BY \`order\` ASC`,
      [userId]
    );

    return rows;
  } catch (error) {
    console.error('Error fetching links:', error);
    return [];
  }
}

async function getUserSocials(userId: string) {
  try {
    const [rows] = await db.query<SocialLink[]>(
      `SELECT id, platform, url, icon
       FROM social_links WHERE user_id = ? ORDER BY created_at ASC`,
      [userId]
    );

    return rows;
  } catch (error) {
    console.error('Error fetching social links:', error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: { username: string } }) {
  const user = await getUserByUsername(params.username);

  if (!user) {
    return {
      title: 'Page Not Found - HereMyLinks',
    };
  }

  return {
    title: `${user.name || user.username} - HereMyLinks`,
    description: user.bio || `Check out ${user.name || user.username}'s links`,
  };
}

export default async function UsernamePage({ params }: { params: { username: string } }) {
  const user = await getUserByUsername(params.username);

  if (!user || !user.is_published) {
    notFound();
  }

  const links = await getUserLinks(user.id);
  const socials = await getUserSocials(user.id);

  return (
    <PublicBioPage
      user={{
        username: user.username,
        name: user.name || user.username,
        bio: user.bio || '',
        profileImage: user.profile_image || '',
        heroImage: user.hero_image || '',
        themeColor: user.theme_color || '#667eea',
        backgroundColor: user.background_color || '#ffffff',
        template: user.template || 'default',
        backgroundImage: user.background_image || '',
        backgroundVideo: user.background_video || '',
        cardBackgroundColor: user.card_background_color || '#ffffff',
        cardBackgroundImage: user.card_background_image || '',
        cardBackgroundVideo: user.card_background_video || '',
        customText: user.custom_text || '',
        usernameColor: user.username_color || '#1a1a1a',
        bioColor: user.bio_color || '#6b7280',
        customTextColor: user.custom_text_color || '#4b5563',
      }}
      links={links.map(link => ({
        id: link.id,
        title: link.title,
        url: link.url,
        icon: link.icon,
        image: link.image,
        layout: link.layout,
        backgroundColor: link.background_color,
        textColor: link.text_color,
        isTransparent: link.is_transparent,
      }))}
      socials={socials.map(social => ({
        id: social.id,
        platform: social.platform,
        url: social.url,
        icon: social.icon,
      }))}
    />
  );
}

