<script setup lang="ts">
defineProps<{
  active: boolean;
}>();

const emit = defineEmits<{
  toggle: [];
}>();
</script>

<template>
  <button
    type="button"
    class="btn btn-icon panel-header__fullscreen"
    :aria-label="active ? 'Свернуть' : 'На весь экран'"
    :title="active ? 'Свернуть' : 'На весь экран'"
    :aria-pressed="active"
    @click="emit('toggle')"
  >
    <svg
      v-if="!active"
      class="panel-header__fullscreen-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M8 4H4v4M16 4h4v4M16 20h4v-4M8 20H4v-4"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <svg
      v-else
      class="panel-header__fullscreen-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="6" height="6" fill="currentColor" />
    </svg>
  </button>
</template>
