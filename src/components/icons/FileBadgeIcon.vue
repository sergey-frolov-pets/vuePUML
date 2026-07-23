<script setup lang="ts">
defineProps<{
  format: "PNG" | "SVG" | "PUML";
}>();
</script>

<template>
  <span
    class="format-badge"
    :class="`format-badge--${format.toLowerCase()}`"
  >
    {{ format }}
  </span>
</template>

<style scoped>
.format-badge {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.btn-primary .format-badge {
  color: #ffffff;
}
</style>
