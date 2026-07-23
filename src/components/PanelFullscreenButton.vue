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
    <svg class="panel-corner-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect
        v-if="active"
        x="9"
        y="9"
        width="6"
        height="6"
        fill="#000000"
      />
      <rect
        v-else
        x="8"
        y="8"
        width="8"
        height="8"
        fill="none"
        stroke="#000000"
        stroke-width="1.5"
      />
    </svg>
  </button>
</template>
