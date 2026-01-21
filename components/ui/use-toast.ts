"use client"

// Simplified Toast implementation to avoid complex dependencies
import * as React from "react"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToastType = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

let listeners: Array<(state: ToastType[]) => void> = []
let memoryState: ToastType[] = []

function dispatch(action: any) {
  switch (action.type) {
    case "ADD_TOAST":
      memoryState = [{ ...action.toast, id: Math.random().toString(36).slice(2) }, ...memoryState].slice(0, TOAST_LIMIT)
      break
    case "DISMISS_TOAST":
      memoryState = memoryState.filter((t) => t.id !== action.toastId)
      break
  }
  listeners.forEach((listener) => listener(memoryState))
}

export function toast({ ...props }: Omit<ToastType, "id">) {
  dispatch({
    type: "ADD_TOAST",
    toast: props,
  })
}

export function useToast() {
  const [state, setState] = React.useState<ToastType[]>(memoryState)
  
  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [])

  return {
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
    toasts: state,
  }
}
