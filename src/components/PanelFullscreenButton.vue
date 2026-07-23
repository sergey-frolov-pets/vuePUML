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
    class="panel-corner-btn btn"
    :aria-label="active ? 'Свернуть' : 'На весь экран'"
    :title="active ? 'Свернуть' : 'На весь экран'"
    :aria-pressed="active"
    @click="emit('toggle')"
  >
    <svg
      v-if="!active"
      class="panel-corner-btn__icon"
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
      class="panel-corner-btn__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M9 9H4V4M15 9h5V4M15 15h5v5M9 15H4v5"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>
</template>
