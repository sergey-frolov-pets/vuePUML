<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  format: "PNG" | "SVG" | "PUML";
}>();

const FORMAT_LABEL_COLORS = {
  PNG: "#1e88e5",
  SVG: "#ef6c00",
  PUML: "#2e7d32",
} as const;

const labelColor = computed(() => FORMAT_LABEL_COLORS[props.format]);
</script>

<template>
  <svg class="file-badge-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M8 3h6.2L18 6.8V20a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 20V4.5A1.5 1.5 0 0 1 8 3Z"
      fill="currentColor"
      opacity="0.18"
    />
    <path
      d="M8 3h6.2L18 6.8V20a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 20V4.5A1.5 1.5 0 0 1 8 3Z"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linejoin="round"
    />
    <path
      d="M14 3v4.3H18"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <rect
      x="6.5"
      y="14.5"
      width="11"
      height="5.5"
      rx="1"
      :fill="labelColor"
    />
    <text
      x="12"
      y="18.4"
      text-anchor="middle"
      fill="#ffffff"
      font-size="4.2"
      font-weight="700"
      font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"
      letter-spacing="0.2"
    >
      {{ format }}
    </text>
  </svg>
</template>

<style scoped>
.file-badge-icon {
  display: block;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
</style>
