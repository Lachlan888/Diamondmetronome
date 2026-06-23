import { useEffect, useRef, type KeyboardEvent, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'

type DiamondToolsModalProps = {
  children: ReactNode
  className?: string
  title?: string
  returnFocusRef: RefObject<HTMLElement | null>
  onClose: () => void
}

const FOCUSABLE_SELECTOR = [
  'button:not(:disabled)',
  '[href]',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true',
  )
}

export function DiamondToolsModal({
  children,
  className,
  title = 'Diamond library & solver',
  returnFocusRef,
  onClose,
}: DiamondToolsModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const returnFocusElement = returnFocusRef.current
    document.body.style.overflow = 'hidden'
    window.requestAnimationFrame(() => closeButtonRef.current?.focus())

    return () => {
      document.body.style.overflow = previousOverflow
      returnFocusElement?.focus()
    }
  }, [returnFocusRef])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }

    if (event.key !== 'Tab' || modalRef.current === null) {
      return
    }

    const focusableElements = getFocusableElements(modalRef.current)
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (!firstElement || !lastElement) {
      event.preventDefault()
      return
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
      return
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }

  return createPortal(
    <div
      className="diamond-tools-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        aria-labelledby="diamond-tools-modal-title"
        aria-modal="true"
        className={className ? `diamond-tools-modal ${className}` : 'diamond-tools-modal'}
        onKeyDown={handleKeyDown}
        ref={modalRef}
        role="dialog"
      >
        <header className="diamond-tools-modal-header">
          <h2 id="diamond-tools-modal-title">{title}</h2>
          <button type="button" className="diamond-tools-close" onClick={onClose} ref={closeButtonRef}>
            Close
          </button>
        </header>
        <div className="diamond-tools-modal-body">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
