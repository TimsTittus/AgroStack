import { nanoid } from "nanoid";
import { detectMediaType } from "@/lib/media-type";
import { FacebookClient } from "./graphapi";

const facebookClient = new FacebookClient({
  clientId: process.env.FACEBOOK_CLIENT_ID as string,
  clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
  redirectUri: new URL("/api/facebook/callback", process.env.NEXT_PUBLIC_URL).toString(),
  scope: ["pages_manage_posts", "pages_manage_engagement", "pages_manage_metadata", "pages_show_list", "pages_read_engagement", "pages_read_user_content"],
});

export async function facebook_generateAuthUrl() {
  const state = nanoid();
  const authUrl = await facebookClient.getAuthorizationUrl(state);
  return authUrl;
}

export async function facebook_getAccessToken(code: string) {
  const token = await facebookClient.exchangeCode(code);
  const pages = await facebookClient.getPagesList(token.access_token);
  return { token, pages };
}

export async function facebook_getProfile(accessToken: string) {
  const user = await facebookClient.userDetails(accessToken);
  return user;
}

export async function facebook_getPageId(pageAccessToken: string) {
  const page = await facebookClient.pageDetails(pageAccessToken);
  return page.id;
}

export async function facebook_createPost(pageAccessToken: string, caption: string, mediaUrls: string[] = []) {
  const pageId = await facebook_getPageId(pageAccessToken);

  if (mediaUrls.length === 0) {
    return await facebookClient.publishPost(pageAccessToken, pageId, {
      message: caption,
    });
  }

  if (mediaUrls.length === 1) {
    const mediaType = await detectMediaType(mediaUrls[0]);

    if (mediaType === "VIDEO") {
      return await facebookClient.publishVideoFromUrl(pageAccessToken, pageId, {
        file_url: mediaUrls[0],
        description: caption,
      });
    } else {
      return await facebookClient.publishPhoto(pageAccessToken, pageId, {
        url: mediaUrls[0],
        caption: caption,
      });
    }
  }

  const mediaTypes = await Promise.all(mediaUrls.map((url) => detectMediaType(url)));

  const imageUrls = mediaUrls.filter((_, index) => mediaTypes[index] === "IMAGE");

  if (imageUrls.length === 0) {
    return await facebookClient.publishVideoFromUrl(pageAccessToken, pageId, {
      file_url: mediaUrls[0],
      description: caption,
    });
  }

  return await facebookClient.publishMultiPhotoPost(pageAccessToken, pageId, {
    message: caption,
    photoUrls: imageUrls.slice(0, 10),
  });
}
