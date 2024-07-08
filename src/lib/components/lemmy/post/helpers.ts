import { client, getInstance } from '$lib/lemmy.js'
import type { View } from '$lib/settings'
import { isImage, isVideo } from '$lib/ui/image'
import { findClosestNumber } from '$lib/util'
import type { CommentView, PersonView, Post, PostView } from 'lemmy-js-client'

export const isCommentMutable = (comment: CommentView, me: PersonView) =>
  me.person.id == comment.creator.id

export const bestImageURL = (
  post: Post,
  compact: boolean = true,
  width: number = 1024
) => {
  let fetchWidth =
    width > 1024
      ? // -1 disables a small thumbnail
        -1
      : // set width to 512 if compact
      compact
      ? 512
      : // otherwise, just use the original width
        width

  if (post.thumbnail_url)
    return optimizeImageURL(post.thumbnail_url, fetchWidth)
  else if (post.url) return optimizeImageURL(post.url, fetchWidth)

  return post.url ?? ''
}

export const optimizeImageURL = (
  urlStr: string,
  width: number = 1024
): string => {
  try {
    const url = new URL(urlStr)

    url.searchParams.append('format', 'webp')

    if (width > 0) {
      url.searchParams.append(
        'resize',
        findClosestNumber([128, 256, 512, 728, 1024, 1536], width).toString()
      )
    }

    return url.toString()
  } catch (e) {
    console.log(e)
    return urlStr
  }
}

const YOUTUBE_REGEX =
  /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|shorts\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/

export const isYoutubeLink = (url?: string): RegExpMatchArray | null => {
  if (!url) return null

  return url?.match?.(YOUTUBE_REGEX)
}

export const postLink = (post: Post) => `/post/${getInstance()}/${post.id}`

export type MediaType = 'video' | 'image' | 'iframe' | 'embed' | 'none'
export type IframeType = 'youtube' | 'video' | 'none'

export const mediaType = (url?: string, view: View = 'cozy'): MediaType => {
  if (url) {
    if (isImage(url)) return 'image'
    if (isVideo(url)) return 'iframe'
    if (isYoutubeLink(url)) return 'iframe'
    return 'embed'
  }

  return 'none'
}
export const iframeType = (post: Post): IframeType => {
  if (isVideo(post.url)) return 'video'
  if (isYoutubeLink(post.url)) return 'youtube'
  return 'none'
}

export async function hidePost(
  id: number,
  hide: boolean,
  jwt: string
): Promise<boolean> {
  const res = await client({ auth: jwt }).hidePost({
    hide: hide,
    post_ids: [id],
  })

  return hide
}
