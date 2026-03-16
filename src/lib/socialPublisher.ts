import { getApiKey } from './apiKeys';

const META_API_VERSION = 'v19.0';
const META_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

interface PublishResult {
  success: boolean;
  postId?: string;
  error?: string;
}

async function metaFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  const token = await getApiKey('meta');
  if (!token) throw new Error('Meta access token not configured');
  const headers = new Headers(options?.headers);
  headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${META_BASE}${endpoint}`, { ...options, headers });
}

export async function getInstagramAccountId(): Promise<string> {
  const res = await metaFetch('/me/accounts?fields=instagram_business_account');
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const page = data.data?.[0];
  if (!page?.instagram_business_account?.id) {
    throw new Error('No Instagram Business account linked to your Facebook page');
  }
  return page.instagram_business_account.id;
}

export async function publishImage(imageUrl: string, caption: string): Promise<PublishResult> {
  try {
    const igId = await getInstagramAccountId();
    const containerRes = await metaFetch(`/${igId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, caption }),
    });
    const container = await containerRes.json();
    if (container.error) return { success: false, error: container.error.message };

    const publishRes = await metaFetch(`/${igId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: container.id }),
    });
    const published = await publishRes.json();
    if (published.error) return { success: false, error: published.error.message };
    return { success: true, postId: published.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function publishReel(videoUrl: string, caption: string): Promise<PublishResult> {
  try {
    const igId = await getInstagramAccountId();
    const containerRes = await metaFetch(`/${igId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_url: videoUrl, caption, media_type: 'REELS' }),
    });
    const container = await containerRes.json();
    if (container.error) return { success: false, error: container.error.message };

    let status = 'IN_PROGRESS';
    let retries = 0;
    while (status === 'IN_PROGRESS' && retries < 30) {
      await new Promise((r) => setTimeout(r, 5000));
      const checkRes = await metaFetch(`/${container.id}?fields=status_code`);
      const check = await checkRes.json();
      status = check.status_code || 'FINISHED';
      retries++;
    }

    const publishRes = await metaFetch(`/${igId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: container.id }),
    });
    const published = await publishRes.json();
    if (published.error) return { success: false, error: published.error.message };
    return { success: true, postId: published.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function publishCarousel(imageUrls: string[], caption: string): Promise<PublishResult> {
  try {
    const igId = await getInstagramAccountId();
    const childIds: string[] = [];

    for (const url of imageUrls) {
      const res = await metaFetch(`/${igId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: url, is_carousel_item: true }),
      });
      const data = await res.json();
      if (data.error) return { success: false, error: data.error.message };
      childIds.push(data.id);
    }

    const containerRes = await metaFetch(`/${igId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ media_type: 'CAROUSEL', children: childIds, caption }),
    });
    const container = await containerRes.json();
    if (container.error) return { success: false, error: container.error.message };

    const publishRes = await metaFetch(`/${igId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: container.id }),
    });
    const published = await publishRes.json();
    if (published.error) return { success: false, error: published.error.message };
    return { success: true, postId: published.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getInstagramInsights(igId: string, period = 'day'): Promise<Record<string, unknown>> {
  try {
    const metricsRes = await metaFetch(
      `/${igId}/insights?metric=impressions,reach,profile_views,follower_count&period=${period}`
    );
    return await metricsRes.json();
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getRecentMedia(igId: string, limit = 20): Promise<Record<string, unknown>> {
  try {
    const res = await metaFetch(
      `/${igId}/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count&limit=${limit}`
    );
    return await res.json();
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
