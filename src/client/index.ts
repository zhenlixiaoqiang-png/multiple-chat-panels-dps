/**
 * multiple-chat-panels client entry.
 *
 * rc.8 adapter: the plugin originally registered `sidebar.primary.action` +
 * `main.page` and navigated with `ctx.layout.openPrimaryPage`, which rc.8
 * removed. This registers Mission Control as a `conversation.view` ring entry
 * (the official replace-the-chat-surface mechanism — the header grows a
 * "Mission Control" tab) plus a `sidebar.footer.action` shortcut that opens
 * it, following the same pattern the dsh-multi-chat wall uses on rc.8.
 */
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type { ModelDirectory } from '@deepseek-ai/dsh-client-ui-model-selection/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type { ClientContext, SessionId, WorkspaceId } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { MissionControlNav, type MissionControlNavInjected } from './MissionControlNav.tsx'
import { MissionControlPage, type MissionControlPageInjected } from './MissionControlPage.tsx'
import {
  clearDraggedSessionId, getDraggedSessionId, PANE_DRAG_MIME,
} from './drag.ts'
import { getPaneSize, PANE_GAP, placePane, type PaneRow } from './pane-store.ts'

export const PAGE_ID = 'mission-control'

// rc.8 inject list: 'remote' is the api-remotes client service that exposes
// ctx.remote.commands (dotted sub-namespaces are NOT separate cordis services,
// so 'remote.commands' must not be listed). 'layout' was dropped because the
// rc.8 adapter no longer calls ctx.layout (view-ring tabs replace pages).
// 'workspaces' backs the "new session" pane action (connectWorkspace).
export const inject = ['slots', 'sessions', 'modelDirectories', 'remote', 'workspaces']

/** The Mission Control view-ring tab label (also used to find the tab to click). */
export function missionControlTabLabel(): string {
  return 'Mission Control'
}

/** Find the conversation view-ring tab by label and click it (official view-ring switch). */
export function clickViewTabByLabel(label: string): void {
  const tab = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="tablist"] [role="tab"]'))
    .find(el => el.textContent?.trim() === label)
  tab?.click()
}

/** Switch the view ring back to the default chat tab (the first tab). */
export function switchToChatView(): void {
  const tab = document.querySelector<HTMLButtonElement>('[role="tablist"] [role="tab"]')
  tab?.click()
}

function isCenterTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('[class*="centerSurface"]') !== null
}

function gridRowElement(grid: Element, row: PaneRow): Element | null {
  return grid.querySelector(`:scope > [data-mcp-row="${row}"]`)
}

/** Horizontal insertion point in one row, expressed as the pane that follows it. */
function beforeIdForDrop(rowElement: Element, clientX: number, excludeId: string): string | undefined {
  const panes = [...rowElement.querySelectorAll('[data-mcp-pane]')]
  for (const pane of panes) {
    const sessionId = pane.getAttribute('data-mcp-session')
    if (sessionId === null || sessionId === excludeId) continue
    const rect = pane.getBoundingClientRect()
    if (clientX < rect.left + rect.width / 2) return sessionId
  }
  return undefined
}

/** Width a pane will claim when it sits on a row: persisted size, else its DOM width. */
function paneGridWidth(pane: Element, sessionId: string): number {
  const persisted = getPaneSize(sessionId)
  if (persisted !== undefined) return persisted.width
  return pane.getBoundingClientRect().width
}

/** Whether inserting `draggedId` at `beforeId` fits the row's available width. */
function rowFitsAfterInsert(rowElement: Element, draggedId: string, draggedWidth: number, beforeId: string | undefined): boolean {
  const ids: string[] = []
  for (const pane of rowElement.querySelectorAll('[data-mcp-pane]')) {
    const sessionId = pane.getAttribute('data-mcp-session')
    if (sessionId === null || sessionId === draggedId) continue
    if (beforeId === sessionId) ids.push(draggedId)
    ids.push(sessionId)
  }
  if (beforeId === undefined) ids.push(draggedId)
  const width = ids.reduce((sum, id, index) => {
    if (id === draggedId) return sum + draggedWidth
    const pane = rowElement.querySelector(`[data-mcp-session="${CSS.escape(id)}"]`)
    return sum + (pane === null ? 0 : paneGridWidth(pane, id))
  }, PANE_GAP * Math.max(0, ids.length - 1))
  return width <= rowElement.clientWidth + 1
}

/** Row chosen by the drop point; below the last row creates a new row. */
function rowForDrop(grid: Element, clientY: number): PaneRow {
  const rows = [...grid.querySelectorAll(':scope > [data-mcp-row]')]
    .sort((left, right) => Number(left.getAttribute('data-mcp-row')) - Number(right.getAttribute('data-mcp-row')))
  if (rows.length === 0) return 0
  for (const row of rows) {
    const rect = row.getBoundingClientRect()
    if (clientY < rect.bottom - 12) return Number(row.getAttribute('data-mcp-row') ?? 0)
  }
  return Number(rows[rows.length - 1]?.getAttribute('data-mcp-row') ?? 0) + 1
}

/** Clear any drag-over row preview class left by a cancelled drag. */
function clearDropPreview(): void {
  const grid = document.querySelector('[data-mcp-grid]')
  if (grid !== null) {
    delete grid.dataset.mcpNewRow
    for (const row of grid.querySelectorAll(':scope > [data-mcp-row]')) {
      row.classList.remove('mcp-drop-target')
      row.classList.remove('mcp-drop-reject')
    }
  }
}

export function apply(ctx: ClientContext): void {
  // The sidebar footer shortcut: jumps to the Mission Control view. It owns
  // no state — the view ring decides what renders — so it is a plain action
  // row (rc.8 pattern, mirrors dsh-multi-chat's WallToggle).
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action',
    id: PAGE_ID,
    order: 10,
    inject: (): MissionControlNavInjected => ({
      open: () => { clickViewTabByLabel(missionControlTabLabel()) },
    }),
  }, MissionControlNav))

  // Mission Control itself: a 'conversation.view' ring entry. The header
  // projects the tab from the registration options; selecting it swaps the
  // right panel from the chat to the panes (official view-ring behavior).
  ctx.slots.inject('conversation.view', () => ctx.slots.register({
    name: 'conversation.view',
    id: PAGE_ID,
    order: 20,
    label: () => missionControlTabLabel(),
    inject: (): MissionControlPageInjected => ({
      getSession: (sessionId) => ctx.sessions.binding(sessionId as SessionId)?.session,
      getModelDirectory: (sessionId): ModelDirectory | undefined => {
        try {
          return ctx.modelDirectories.directoryFor(sessionId as SessionId)
        } catch {
          return undefined
        }
      },
      listCommands: async (sessionId) => {
        try {
          const result = await ctx.remote.commands.list(sessionId as SessionId)
          if (!result.ok) return []
          return result.value.map(command => ({
            name: command.name,
            description: command.description,
            ...command.input?.hint === undefined ? {} : { hint: command.input.hint },
          }))
        } catch {
          return []
        }
      },
      openInMain: (sessionId) => {
        ctx.sessions.open(sessionId as SessionId)
        switchToChatView()
      },
      // Create a brand-new session in the given workspace and return its id.
      // Uses sessions.create (NOT workspaces.connectWorkspace) so every click
      // yields a genuinely new conversation — connectWorkspace would instead
      // reuse the workspace's existing blank session, making repeated "new
      // session" clicks no-ops while a blank pane is still unused.
      //
      // Note: `create` lives on the concrete SessionRuntime class, not on the
      // ISessions contract `ctx.sessions` types to (rc.8), so the cast is
      // deliberate; SessionRuntime.create resolves to the session id directly
      // (throws SessionCreateError on failure) — NOT an {ok, value} envelope.
      createSession: async (workspaceId): Promise<string | undefined> => {
        try {
          const runtime = ctx.sessions as unknown as { create(opts: { workspaceId: WorkspaceId }): Promise<SessionId> }
          return await runtime.create({ workspaceId: workspaceId as WorkspaceId }) as unknown as string
        } catch (error) {
          console.error('[multiple-chat-panels] create session failed:', error)
          return undefined
        }
      },
    }),
  }, MissionControlPage))

  // HTML5 DnD forbids reading getData() during dragover (returns ""), which
  // made width checks and target resolution unreliable and could visually
  // reject every drop ("拉不动"). The dragged session id lives at module
  // scope (setDraggedSessionId from startPaneDrag) so dragover/drop can read
  // it; cleared on dragend/drop.

  const onDragOver = (event: DragEvent): void => {
    if (!isCenterTarget(event.target)) return
    if (event.dataTransfer === null) return
    if (!event.dataTransfer.types.includes(PANE_DRAG_MIME)) return
    event.preventDefault()
    const grid = document.querySelector('[data-mcp-grid]')
    if (grid === null) return
    const row = rowForDrop(grid, event.clientY)
    for (const rowElement of grid.querySelectorAll(':scope > [data-mcp-row]')) {
      rowElement.classList.remove('mcp-drop-target')
      rowElement.classList.remove('mcp-drop-reject')
    }
    delete grid.dataset.mcpNewRow
    const target = gridRowElement(grid, row)
    if (target === null) {
      grid.dataset.mcpNewRow = '1'
      return
    }
    const draggedId = getDraggedSessionId()
    const before = beforeIdForDrop(target, event.clientX, draggedId)
    const draggedPane = draggedId === '' ? null : document.querySelector(`[data-mcp-session="${CSS.escape(draggedId)}"]`)
    const draggedWidth = draggedPane === null
      ? getPaneSize(draggedId)?.width ?? 360
      : draggedPane.getBoundingClientRect().width
    if (rowFitsAfterInsert(target, draggedId, draggedWidth, before)) {
      target.classList.add('mcp-drop-target')
    } else {
      target.classList.add('mcp-drop-reject')
    }
  }

  const onDrop = (event: DragEvent): void => {
    if (!isCenterTarget(event.target)) return
    if (event.dataTransfer === null) return
    const paneDragged = event.dataTransfer.types.includes(PANE_DRAG_MIME)
    const dragged = paneDragged
      ? (getDraggedSessionId() || event.dataTransfer.getData(PANE_DRAG_MIME))
      : event.dataTransfer.getData('text/plain')
    if (dragged === '') return
    event.preventDefault()
    clearDropPreview()
    clearDraggedSessionId()
    const current = ctx.sessions.list.getSnapshot().current
    const grid = document.querySelector('[data-mcp-grid]')
    if (grid === null) {
      // First drop opens Mission Control: keep the current session and put
      // the dragged session left or right of it based on the drop point.
      if (!paneDragged && current !== undefined && current !== dragged) placePane(current, 0)
      const center = event.target instanceof Element
        ? event.target.closest('[class*="centerSurface"]')?.getBoundingClientRect()
        : undefined
      const before = current !== undefined && center !== undefined && event.clientX < center.left + center.width / 2
        ? current
        : undefined
      placePane(dragged, 0, before)
      clickViewTabByLabel(missionControlTabLabel())
      return
    }
    const row = rowForDrop(grid, event.clientY)
    const rowElement = gridRowElement(grid, row)
    const before = rowElement === null ? undefined : beforeIdForDrop(rowElement, event.clientX, dragged)
    // No hard width rejection on drop: let the pane land where the user
    // dropped it and let reflowRows settle the layout (a rejected drop is
    // exactly the "can't drag" symptom users report).
    placePane(dragged, row, before)
  }

  const onDragEnd = (): void => {
    clearDraggedSessionId()
    clearDropPreview()
  }

  ctx.effect(() => {
    document.addEventListener('dragover', onDragOver)
    document.addEventListener('drop', onDrop)
    document.addEventListener('dragend', onDragEnd)
    return () => {
      document.removeEventListener('dragover', onDragOver)
      document.removeEventListener('drop', onDrop)
      document.removeEventListener('dragend', clearDropPreview)
    }
  }, 'multiple-chat-panels: drag-drop')
}
