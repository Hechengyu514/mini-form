import { ref, computed } from 'vue'

export interface Command {
  undo(): void
  redo(): void
  description?: string
}

/**
 * 撤销/重做引擎（命令模式）
 *
 * 通过双栈管理操作历史，新操作会清空 redo 栈。
 */
export function useCommandHistory(maxHistory = 80) {
  const undoStack = ref<Command[]>([])
  const redoStack = ref<Command[]>([])

  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  const lastUndoLabel = computed(() => undoStack.value.at(-1)?.description ?? '')
  const lastRedoLabel = computed(() => redoStack.value.at(-1)?.description ?? '')

  function execute(cmd: Command) {
    undoStack.value.push(cmd)
    if (undoStack.value.length > maxHistory) {
      undoStack.value.shift()
    }
    redoStack.value = []
  }

  function undo() {
    const cmd = undoStack.value.pop()
    if (cmd) {
      cmd.undo()
      redoStack.value.push(cmd)
    }
  }

  function redo() {
    const cmd = redoStack.value.pop()
    if (cmd) {
      cmd.redo()
      undoStack.value.push(cmd)
    }
  }

  function clear() {
    undoStack.value = []
    redoStack.value = []
  }

  return { undoStack, redoStack, canUndo, canRedo, lastUndoLabel, lastRedoLabel, execute, undo, redo, clear }
}
