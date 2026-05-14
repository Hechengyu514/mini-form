import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSubmissionStore = defineStore('submission', () => {
  const submissions = ref<Record<string, unknown>[]>([])

  function addSubmission(data: Record<string, unknown>) {
    submissions.value.push(data)
  }

  function clearSubmissions() {
    submissions.value = []
  }

  return { submissions, addSubmission, clearSubmissions }
})
