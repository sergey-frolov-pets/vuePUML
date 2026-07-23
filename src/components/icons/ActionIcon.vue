<script setup lang="ts">
defineProps<{
  name: "folder-open" | "save" | "check" | "trash" | "refresh" | "sun" | "moon";
}>();
</script>

<template>
  <svg class="action-icon" viewBox="0 0 24 24" aria-hidden="true">
    <template v-if="name === 'folder-open'">
      <path
        d="M4 7.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H6a2 2 0 0 0-2 2Z"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
      <path
        d="M4 10h16"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      />
    </template>

    <template v-else-if="name === 'save'">
      <path
        d="M6 4h9.2L18 6.8V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
      <path
        d="M14 4v5H8V4M8 14h8"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </template>

    <template v-else-if="name === 'check'">
      <circle
        cx="12"
        cy="12"
        r="8.5"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
      />
      <path
        d="M8.5 12.2 10.8 14.5 15.8 9.5"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </template>

    <template v-else-if="name === 'trash'">
      <path
        d="M5 7h14M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7m-9.5 0 1.1 11.5A1.5 1.5 0 0 0 8 20h8a1.5 1.5 0 0 0 1.4-1.5L18.5 7"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </template>

    <template v-else-if="name === 'refresh'">
      <path
        d="M20 12a8 8 0 1 1-2.3-5.7M20 4v6h-6"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </template>

    <template v-else-if="name === 'sun'">
      <circle
        cx="12"
        cy="12"
        r="4"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
      />
      <path
        d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      />
    </template>

    <template v-else-if="name === 'moon'">
      <path
        d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5Z"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linejoin="round"
      />
    </template>
  </svg>
</template>

<style scoped>
.action-icon {
  display: block;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
</style>
