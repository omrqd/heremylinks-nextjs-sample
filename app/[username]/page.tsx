import { notFound } from 'next/navigation';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import db from '@/lib/db';
import PublicBioPage from './PublicBioPage';

interface User {
  id: string;
  username: string;
  name: string | null;
  bio: string | null;
  profile_image: string | null;
  hero_image: string | null;
  hero_height: number;
  hide_profile_picture: boolean;
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
  is_premium: boolean;
  premium_expires_at: Date | null;
  is_banned: boolean;
}

interface BioLink {
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

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
}

async function getUserByUsername(username: string): Promise<User | null> {
  try {
    const [rows] = await db.query<User>(
      `SELECT id, username, name, bio, profile_image, hero_image, hero_height, hide_profile_picture, 
              theme_color, background_color, template, background_image, background_video, 
              card_background_color, card_background_image, card_background_video, custom_text, 
              username_color, bio_color, custom_text_color, is_published, is_premium, premium_expires_at,
              is_banned
       FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1`,
      [username]
    );

    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

async function getUserLinks(userId: string): Promise<BioLink[]> {
  try {
    const [rows] = await db.query<BioLink>(
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

async function getUserSocials(userId: string): Promise<SocialLink[]> {
  try {
    const [rows] = await db.query<SocialLink>(
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

  // Check if user is banned
  if (user.is_banned) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e293b 0%, #dc2626 100%)',
        padding: '20px',
      }}>
        <div style={{
          maxWidth: '600px',
          width: '100%',
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '2px solid rgba(220, 38, 38, 0.3)',
          padding: '48px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 24px',
            background: 'rgba(220, 38, 38, 0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg 
              width="40" 
              height="40" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#ef4444" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
            </svg>
          </div>
          
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '16px',
          }}>
            Page Not Available
          </h1>
          
          <p style={{
            fontSize: '18px',
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: '1.6',
            marginBottom: '32px',
          }}>
            This profile is currently unavailable. Please check back later or contact support if you have any questions.
          </p>
          
          <a
            href="/"
            style={{
              display: 'inline-block',
              padding: '12px 32px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '16px',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
            }}
          >
            Go to Homepage
          </a>
          <style dangerouslySetInnerHTML={{
            __html: `
              a[href="/"] {
                transition: transform 0.2s, box-shadow 0.2s;
              }
              a[href="/"]:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 30px rgba(139, 92, 246, 0.4) !important;
              }
            `
          }} />
        </div>
      </div>
    );
  }

  const links = await getUserLinks(user.id);
  const socials = await getUserSocials(user.id);

  // Check if user has active premium (either lifetime or not expired)
  const isPremiumActive = user.is_premium && (!user.premium_expires_at || new Date(user.premium_expires_at) > new Date());

  return (
    <PublicBioPage
      user={{
        username: user.username,
        name: user.name || user.username,
        bio: user.bio || '',
        profileImage: user.profile_image || '',
        heroImage: user.hero_image || '',
        heroHeight: user.hero_height || 300,
        hideProfilePicture: user.hide_profile_picture || false,
        themeColor: user.theme_color || '#667eea',
        backgroundColor: user.background_color || '#ffffff',
        template: user.template || 'template3',
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
      isPremium={isPremiumActive}
    />
  );
}

