/**
 * Chums case-study media. Every screen the case shows, keyed by the slot it
 * fills, with its intrinsic size so the layout is reserved before the file
 * arrives — a 15000px sheet reflowing as images decode is the one thing the
 * smooth scroller cannot hide.
 *
 * Sources were 3x PNGs (40MB across 31 files) that each carried a baked drop
 * shadow around the screen — two thirds of some files. They are cropped to the
 * screen itself, so the plate behind lines up with its edge and one CSS shadow
 * does the depth for all of them, then written as WebP at twice their display
 * size at the 1440 reference: 1.5MB in total.
 */
export type CaseShot = { src: string; w: number; h: number; alt: string };

export const chumsShots = {
  onboarding: { src: '/cases/chums/onboarding.webp', w: 800, h: 1731, alt: 'Chums welcome screen with the new visual direction' },
  messenger: { src: '/cases/chums/messenger.webp', w: 800, h: 1731, alt: 'Chums chat list with servers and NFT chats' },
  profile: { src: '/cases/chums/profile.webp', w: 800, h: 1731, alt: 'Chums profile settings screen' },
  voiceMessage: { src: '/cases/chums/voice-message.webp', w: 800, h: 1731, alt: 'Recording a voice message in Chums' },
  serverPicker: { src: '/cases/chums/server-picker.webp', w: 800, h: 1731, alt: 'Choosing a server when creating a space' },
  attachments: { src: '/cases/chums/attachments.webp', w: 800, h: 1731, alt: 'Attachment menu — send coins, photo, media, file' },
  beforeContacts: { src: '/cases/chums/before-contacts.webp', w: 1392, h: 782, alt: 'Before: the contact picker taking over the whole window' },
  afterContacts: { src: '/cases/chums/after-contacts.webp', w: 1392, h: 1039, alt: 'After: contacts as a compact modal over the chat' },
  beforeRecoveryKey: { src: '/cases/chums/before-recovery-key.webp', w: 1392, h: 943, alt: 'Before: the unexplained recovery-key form' },
  afterRecoveryKey: { src: '/cases/chums/after-recovery-key.webp', w: 1392, h: 1088, alt: 'After: recovery key as a guided onboarding step' },
  beforeMessages: { src: '/cases/chums/before-messages.webp', w: 1392, h: 1088, alt: 'Before: heavy outgoing message bubbles' },
  afterMessages: { src: '/cases/chums/after-messages.webp', w: 1392, h: 1090, alt: 'After: softened outgoing message bubbles' },
  beforeEmoji: { src: '/cases/chums/before-emoji.webp', w: 1392, h: 1088, alt: 'Before: the full-width emoji panel covering the conversation' },
  afterEmoji: { src: '/cases/chums/after-emoji.webp', w: 1392, h: 1090, alt: 'After: emoji in a compact popover' },
  responsiveDesktop1: { src: '/cases/chums/responsive-desktop-1.webp', w: 1382, h: 753, alt: 'Desktop client at its widest — all three panels open' },
  responsiveDesktop2: { src: '/cases/chums/responsive-desktop-2.webp', w: 966, h: 760, alt: 'Desktop client at a medium width — the side panel collapses' },
  responsiveDesktop3: { src: '/cases/chums/responsive-desktop-3.webp', w: 420, h: 785, alt: 'Desktop client at its narrowest — a single column' },
  chatList: { src: '/cases/chums/chat-list.webp', w: 750, h: 1624, alt: 'Rooms list with the Explore tab and quest entry points' },
  quests: { src: '/cases/chums/quests.webp', w: 750, h: 1692, alt: 'Echo Arcade quest screen with the reward up front' },
  stats: { src: '/cases/chums/stats.webp', w: 750, h: 1692, alt: 'Quest statistics for the running epoch' },
  errorState: { src: '/cases/chums/error-state.webp', w: 750, h: 1692, alt: 'Statistics with no data — the error state' },
  walletOnboarding: { src: '/cases/chums/wallet-onboarding.webp', w: 750, h: 1667, alt: 'Onboarding step two — the wallet address pasted in' },
  questsComplete: { src: '/cases/chums/quests-complete.webp', w: 750, h: 1667, alt: 'Onboarding with every task closed' },
  groupChat: { src: '/cases/chums/group-chat.webp', w: 752, h: 1628, alt: 'A newly created group chat' },
  messages: { src: '/cases/chums/messages.webp', w: 752, h: 1628, alt: 'Group chat carrying a long conversation' },
  markdown: { src: '/cases/chums/markdown.webp', w: 752, h: 1628, alt: 'A message with markdown formatting from another user' },
  groupCall: { src: '/cases/chums/group-call.webp', w: 1800, h: 1400, alt: 'Group call in the desktop client' },
  chatInfo: { src: '/cases/chums/chat-info.webp', w: 752, h: 1628, alt: 'Opening the chat information panel' },
  reactions: { src: '/cases/chums/reactions.webp', w: 752, h: 1628, alt: 'Reactions on a message' },
  donations: { src: '/cases/chums/donations.webp', w: 752, h: 1628, alt: 'Donations inside a chat' },
  browser: { src: '/cases/chums/browser.webp', w: 1800, h: 1432, alt: 'The built-in Web3 browser with the input active' },
} satisfies Record<string, CaseShot>;
