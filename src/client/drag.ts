/** MIME marker for panes dragged inside Mission Control (never sidebar rows). */
export const PANE_DRAG_MIME = 'application/x-mcp-pane'

/**
 * Dragged session id shared between the pane header (startPaneDrag) and the
 * document-level dragover/drop handlers (index.ts apply). HTML5 DnD forbids
 * reading `getData()` during dragover (it returns ""), which made width
 * checks and drop-target resolution unreliable — the classic "can't drag"
 * symptom. We track the id in a module variable instead; the header sets it
 * on dragstart, the handlers read it, and dragend/drop clears it.
 */
const DRAG_STATE_KEY = '__mcpDraggedSessionId' as const

function readDraggedSessionId(): string | null {
  const value = (window as unknown as Record<string, unknown>)[DRAG_STATE_KEY]
  return typeof value === 'string' ? value : null
}

/** Record the session id being dragged (called by startPaneDrag on dragstart). */
export function setDraggedSessionId(sessionId: string): void {
  ;(window as unknown as Record<string, unknown>)[DRAG_STATE_KEY] = sessionId
}

/** Clear the drag state (called on dragend/drop). */
export function clearDraggedSessionId(): void {
  ;(window as unknown as Record<string, unknown>)[DRAG_STATE_KEY] = null
}

/** Read the session id currently being dragged ('' when none). */
export function getDraggedSessionId(): string {
  return readDraggedSessionId() ?? ''
}
