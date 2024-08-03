<!-- src/components/ui/Header/Index.vue -->
<template>
  <header class="header">
    <div class="flex items-center">
      <button @click="toggleSidebar" class="toggle-btn" id="headerToggle">
        <i class="i-mdi-menu text-2xl"></i>
      </button>
      <h1 class="text-xl font-bold">{{ title }}</h1>
    </div>
    <div class="theme-switch">
      <input type="checkbox" id="theme-toggle" @change="toggleTheme" :checked="theme === 'dark'">
      <label for="theme-toggle"></label>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from '@nanostores/vue';
import { $display, toggleTheme, toggleSidebar } from '@/store/display';

defineProps({
  title: {
    type: String,
    required: true,
  },
});

const displayStore = useStore($display);
const theme = computed(() => displayStore.value.theme);
</script>
<style scoped>
.header {
  grid-area: header;
  background-color: var(--accent-primary);
  color: var(--bg-main);
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 10;
}

.toggle-btn {
  background-color: var(--accent-secondary);
  color: var(--bg-main);
  border: none;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-right: 1rem;
}

.toggle-btn:hover {
  background-color: var(--accent-tertiary);
  color: var(--text-main);
}

.theme-switch {
  display: flex;
  align-items: center;
}

.theme-switch input {
  display: none;
}

.theme-switch label {
  cursor: pointer;
  padding: 0.5rem;
  background-color: var(--accent-secondary);
  border-radius: 1rem;
  display: flex;
  align-items: center;
}

.theme-switch label::after {
  content: "🌞";
  margin-left: 0.5rem;
}

.theme-switch input:checked + label::after {
  content: "🌙";
}
</style>
