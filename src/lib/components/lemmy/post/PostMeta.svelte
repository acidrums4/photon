<script lang="ts" context="module">
  export interface Tag {
    content: string
    color?: string
    icon?: IconSource
  }

  export const textToTag: Map<string, Tag> = new Map<string, Tag>([
    ['OC', { content: 'OC', color: '#03A8F240' }],
    ['NSFL', { content: 'NSFL', color: '#ff000040' }],
    ['CW', { content: 'CW', color: '#ff000040' }],
  ])

  export const parseTags = (
    title?: string
  ): { tags: Tag[]; title?: string } => {
    if (!title) return { tags: [] }

    let extracted: Tag[] = []

    title = title.replace(/\[(.*?)\]/g, (match, content) => {
      const contents = content.split(',').map((part: string) => part.trim())

      contents.forEach((content: string) => {
        extracted.push(
          textToTag.get(content) ?? {
            content: content,
          }
        )
      })
      return ''
    })

    return {
      tags: extracted,
      title: title,
    }
  }
</script>

<script lang="ts">
  import CommunityLink from '$lib/components/lemmy/community/CommunityLink.svelte'
  import Avatar from '$lib/components/ui/Avatar.svelte'
  import { Badge, Material, Popover } from 'mono-svelte'
  import UserLink from '$lib/components/lemmy/user/UserLink.svelte'
  import RelativeDate from '$lib/components/util/RelativeDate.svelte'
  import type { Community, Person, SubscribedType } from 'lemmy-js-client'
  import {
    Bookmark,
    Check,
    ExclamationTriangle,
    Icon,
    LockClosed,
    Megaphone,
    Plus,
    Tag,
    Trash,
  } from 'svelte-hero-icons'
  import { getInstance } from '$lib/lemmy.js'
  import { profile } from '$lib/auth.js'
  import Subscribe from '../../../../routes/communities/Subscribe.svelte'
  import ShieldIcon from '../moderation/ShieldIcon.svelte'
  import { userSettings, type View } from '$lib/settings'
  import Markdown from '$lib/components/markdown/Markdown.svelte'
  import { t } from '$lib/translations'
  import { Pencil, type IconSource } from 'svelte-hero-icons'
  import CommunityHeader from '../community/CommunityHeader.svelte'

  export let community: Community | undefined = undefined
  export let showCommunity: boolean = true
  export let subscribed: SubscribedType | undefined = undefined

  export let user: Person | undefined = undefined
  export let published: Date | undefined = undefined
  export let title: string | undefined = undefined
  export let id: number | undefined = undefined
  export let read: boolean = false
  export let edited: boolean = false

  export let view: View = 'cozy'

  // Badges
  export let badges = {
    nsfw: false,
    saved: false,
    featured: false,
    deleted: false,
    removed: false,
    locked: false,
    moderator: false,
    admin: false,
  }

  export let tags: Tag[] = []

  $: {
    if (title && tags.length == 0) {
      const result = parseTags(title)
      tags = result.tags
      title = result.title
    }
  }

  let popoverOpen = false
</script>

<!-- 
  @component
  This component will build two different things: a post's meta block and the title.
-->
<header
  class="grid w-full meta {community
    ? 'grid-rows-2'
    : 'grid-rows-1'} text-xs min-w-0 max-w-full"
  style={$$props.style ?? ''}
>
  {#if showCommunity && community && subscribed}
    <Popover bind:open={popoverOpen} manual>
      <button
        on:click={() => (popoverOpen = !popoverOpen)}
        class="relative cursor-pointer pr-2 row-span-2 flex-shrink-0 group/community"
        slot="target"
      >
        <Avatar
          url={community.icon}
          width={32}
          alt={community.name}
          class="group-hover/community:ring-2 transition-all ring-offset-1 ring-primary-900 dark:ring-primary-100"
        />
      </button>
      <div
        slot="popover"
        class="max-w-md rounded-2xl bg-white dark:bg-zinc-950"
      >
        <CommunityHeader bind:community bind:subscribed />
      </div>
    </Popover>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
  {/if}
  {#if showCommunity && community}
    <CommunityLink
      {community}
      style="grid-area: community;"
      class="flex-shrink self-end"
    />
  {/if}
  <span
    class="text-slate-600 dark:text-zinc-400 flex flex-row gap-2 items-center self-start"
    style="grid-area: stats;"
  >
    {#if user}
      <address class="contents not-italic">
        <UserLink avatarSize={20} {user} avatar={!showCommunity}>
          <svelte:fragment slot="badges">
            {#if badges.moderator}
              <ShieldIcon filled width={14} class="text-green-500" />
            {/if}
            {#if badges.admin}
              <ShieldIcon filled width={14} class="text-red-500" />
            {/if}
          </svelte:fragment>
        </UserLink>
      </address>
    {/if}
    {#if published}
      <RelativeDate date={published} class="flex-shrink-0" />
    {/if}
    {#if edited}
      <Icon src={Pencil} micro size="14" />
    {/if}
  </span>
  <div
    class="flex flex-row justify-end items-center self-center flex-wrap gap-2 [&>*]:flex-shrink-0 badges ml-2"
    style="grid-area: badges;"
  >
    {#if tags}
      {#each tags as tag}
        <a
          class="hover:brightness-110"
          href="/search?community={community?.id}&q=[{tag.content}]&type=Posts"
          style={tag.color ? `--tag-color: ${tag.color};` : ''}
        >
          <Badge class={tag.color ? 'badge-tag-color' : ''}>
            <svelte:fragment slot="icon">
              {#if tag.icon}
                <Icon src={tag.icon} micro size="14" />
              {:else}
                <Icon src={Tag} micro size="14" />
              {/if}
            </svelte:fragment>
            {tag.content}
          </Badge>
        </a>
      {/each}
    {/if}
    {#if badges.nsfw}
      <Badge label={$t('post.badges.nsfw')} color="red-subtle" allowIconOnly>
        <Icon src={ExclamationTriangle} size="14" micro slot="icon" />
        {$t('post.badges.nsfw')}
      </Badge>
    {/if}
    {#if badges.saved}
      <Badge
        label={$t('post.badges.saved')}
        color="yellow-subtle"
        allowIconOnly
      >
        <Icon src={Bookmark} micro size="14" slot="icon" />
        {$t('post.badges.saved')}
      </Badge>
    {/if}
    {#if badges.locked}
      <Badge
        label={$t('post.badges.locked')}
        color="yellow-subtle"
        allowIconOnly
      >
        <Icon src={LockClosed} micro size="14" slot="icon" />
        <span class="max-md:hidden">{$t('post.badges.locked')}</span>
      </Badge>
    {/if}
    {#if badges.removed}
      <Badge label={$t('post.badges.removed')} color="red-subtle" allowIconOnly>
        <Icon src={Trash} micro size="14" slot="icon" />
        <span class="max-md:hidden">{$t('post.badges.removed')}</span>
      </Badge>
    {/if}
    {#if badges.deleted}
      <Badge label={$t('post.badges.deleted')} color="red-subtle" allowIconOnly>
        <Icon src={Trash} micro size="14" slot="icon" />
        <span class="max-md:hidden">{$t('post.badges.deleted')}</span>
      </Badge>
    {/if}
    {#if badges.featured}
      <Badge
        label={$t('post.badges.featured')}
        color="green-subtle"
        allowIconOnly
      >
        <Icon src={Megaphone} micro size="14" slot="icon" />
        <span class="max-md:hidden">{$t('post.badges.featured')}</span>
      </Badge>
    {/if}
    <slot name="badges" />
  </div>
</header>
{#if title && id}
  <a
    href="/post/{getInstance()}/{id}"
    class="inline hover:underline
    hover:text-primary-900 hover:dark:text-primary-100 transition-colors
    {$userSettings.font == 'satoshi/nunito'
      ? 'font-display font-semibold'
      : 'font-medium'} {$$props.titleClass ?? ''}"
    class:text-slate-600={$userSettings.markReadPosts && read}
    class:dark:text-zinc-400={$userSettings.markReadPosts && read}
    class:text-base={view == 'compact'}
    class:text-lg={view != 'compact'}
    style="grid-area: title;"
    data-sveltekit-preload-data="tap"
  >
    <Markdown
      source={title}
      inline
      noStyle
      class={view == 'compact' ? '' : 'leading-[1.3]'}
    ></Markdown>
  </a>
{:else}
  <div style="grid-area: title; margin: 0;"></div>
{/if}

<style>
  .meta {
    display: grid;
    grid-template-areas:
      'avatar community badges'
      'avatar stats badges';
    gap: 0;
    grid-template-rows: auto auto;
    grid-template-columns: max-content minmax(0, auto) auto;
  }

  :global(.badge-tag-color) {
    background-color: var(--tag-color) !important;
  }
</style>
