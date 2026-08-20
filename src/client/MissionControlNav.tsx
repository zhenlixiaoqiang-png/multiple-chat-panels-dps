/**
 * Sidebar footer shortcut that opens the Mission Control view.
 *
 * rc.8 adapter: previously a `sidebar.primary.action` entry with
 * `PropsRuntime<'sidebar.primary.action'>`; rc.8 removed that slot, so this
 * is now a `sidebar.footer.action` row (mirrors dsh-multi-chat's WallToggle).
 * The click is a plain user-equivalent activation: it finds the header's
 * view-ring tab for this plugin's label and clicks it, so the official
 * view-ring state machine performs the switch. Session-scoped by design: the
 * view ring only renders with an active session, so the shortcut is inert on
 * the empty-hero screen — the user first opens or creates a session.
 */
import React from 'react'
import type { InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'

/** Registration-side navigation action. */
export interface MissionControlNavInjected {
  readonly open: () => void
}

/** Full props of the sidebar footer Mission Control entry. */
export type MissionControlNavProps =
  PropsRuntime<'sidebar.footer.action'>
  & InjectFace<MissionControlNavInjected>

/** Sidebar footer entry that opens the Mission Control view. */
export function MissionControlNav({ wide, open }: MissionControlNavProps) {
  return (
    <button
      type="button"
      aria-label="Mission Control"
      title="Mission Control"
      onClick={open}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '8px 12px',
        border: 0,
        background: 'transparent',
        color: 'inherit',
        cursor: 'pointer',
        fontSize: 14,
      }}
    >
      <span aria-hidden="true">▦</span>
      {wide ? <span>Mission Control</span> : null}
    </button>
  )
}
