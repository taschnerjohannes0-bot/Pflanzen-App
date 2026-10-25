import { type PointerEvent as ReactPointerEvent, useRef, useState } from 'react'
import type { CropRect } from '../db/types'
import { useObjectUrl } from '../lib/useObjectUrl'

const FULL: CropRect = { x: 0, y: 0, w: 1, h: 1 }
const MIN_SIZE = 0.1

type Handle = 'move' | 'nw' | 'ne' | 'sw' | 'se'

interface Props {
  photo: Blob
  initial?: CropRect
  onConfirm: (crop: CropRect | null) => void
  onCancel: () => void
  hint?: string
}

// Rahmen um die Pflanze ziehen, bevor sie freigestellt wird.
export function FrameEditor({ photo, initial, onConfirm, onCancel, hint }: Props) {
  const url = useObjectUrl(photo)
  const [rect, setRect] = useState<CropRect>(initial ?? FULL)
  const areaRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ handle: Handle; startX: number; startY: number; start: CropRect }>(null)

  function onPointerDown(handle: Handle) {
    return (e: ReactPointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
      drag.current = { handle, startX: e.clientX, startY: e.clientY, start: rect }
    }
  }

  function onPointerMove(e: ReactPointerEvent) {
    const d = drag.current
    const area = areaRef.current?.getBoundingClientRect()
    if (!d || !area) return
    const dx = (e.clientX - d.startX) / area.width
    const dy = (e.clientY - d.startY) / area.height
    setRect(applyDrag(d.start, d.handle, dx, dy))
  }

  function onPointerUp() {
    drag.current = null
  }

  return (
    <div className="frame-editor" role="dialog" aria-modal="true" aria-label="Pflanze einrahmen">
      <div className="frame-editor__top">
        <button type="button" className="link-button frame-editor__cancel" onClick={onCancel}>
          Abbrechen
        </button>
        <span>{hint ?? 'Rahmen um die Pflanze ziehen'}</span>
      </div>

      <div className="frame-editor__stage">
        <div ref={areaRef} className="frame-editor__area" onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
          {url && <img src={url} alt="" draggable={false} />}
          <div
            className="frame-editor__rect"
            style={{
              left: `${rect.x * 100}%`,
              top: `${rect.y * 100}%`,
              width: `${rect.w * 100}%`,
              height: `${rect.h * 100}%`,
            }}
            onPointerDown={onPointerDown('move')}
          >
            {(['nw', 'ne', 'sw', 'se'] as const).map((h) => (
              <span key={h} className={`frame-editor__handle frame-editor__handle--${h}`} onPointerDown={onPointerDown(h)} />
            ))}
          </div>
        </div>
      </div>

      <div className="frame-editor__actions">
        <button type="button" className="button" onClick={() => onConfirm(null)}>
          Nicht freistellen
        </button>
        <button type="button" className="button button--primary" onClick={() => onConfirm(rect)}>
          ✂️ Freistellen
        </button>
      </div>
    </div>
  )
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

function applyDrag(r: CropRect, handle: Handle, dx: number, dy: number): CropRect {
  if (handle === 'move') {
    return { ...r, x: clamp(r.x + dx, 0, 1 - r.w), y: clamp(r.y + dy, 0, 1 - r.h) }
  }
  let left = r.x
  let top = r.y
  let right = r.x + r.w
  let bottom = r.y + r.h
  if (handle.includes('w')) left = clamp(left + dx, 0, right - MIN_SIZE)
  if (handle.includes('e')) right = clamp(right + dx, left + MIN_SIZE, 1)
  if (handle.includes('n')) top = clamp(top + dy, 0, bottom - MIN_SIZE)
  if (handle.includes('s')) bottom = clamp(bottom + dy, top + MIN_SIZE, 1)
  return { x: left, y: top, w: right - left, h: bottom - top }
}
