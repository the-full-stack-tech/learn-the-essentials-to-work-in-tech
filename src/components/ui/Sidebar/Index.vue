<!-- src/components/ui/Sidebar/Index.vue -->
<template>
  <aside :class="['sidebar', { 'sidebar-visible': isSidebarOpen }]">
    <div class="sidebar-header">
      <h2 class="text-lg font-semibold">Menu</h2>
      <button @click="closeSidebar" class="close-btn">
        <i class="i-mdi-close text-2xl"></i>
      </button>
    </div>
    <nav>
      <ul class="sidebar-menu">
        <MenuItem
          v-for="item in items"
          :key="item.url"
          :item="item"
          :active-path="activePath"
          @navigate="handleNavigation"
        />
      </ul>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { navigate } from 'astro:transitions/client';
import { useStore } from '@nanostores/vue';
import { $display, toggleSidebar } from '@/store/display';
import MenuItem from '@/components/ui/MenuItem/Index.vue';

interface MenuItem {
  label: string;
  url: string;
  children?: MenuItem[];
}

const props = defineProps<{
  items: MenuItem[];
}>();

const displayStore = useStore($display);
const isSidebarOpen = computed(() => displayStore.value.isSidebarOpen);
const activePath = ref(window.location.pathname);

function closeSidebar() {
  toggleSidebar();
}

function handleNavigation(url: string) {
  navigate(url);
  closeSidebar();
}

onMounted(() => {
  updateActivePath();
  window.addEventListener('popstate', updateActivePath);
});

function updateActivePath() {
  activePath.value = window.location.pathname;
}

watch(() => props.items, updateActivePath);
</script>

<style scoped>
.sidebar {
  grid-area: sidebar;
  background-color: var(--accent-tertiary);
  color: var(--text-main);
  overflow-y: auto;
  width: 0;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  transition: all 0.3s ease;
  z-index: 20;
  display: flex;
  flex-direction: column;
}

.sidebar-visible {
  width: 250px;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--accent-secondary);
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-main);
  cursor: pointer;
  font-size: 1.5rem;
  padding: 0.5rem;
  transition: color 0.3s ease;
}

.close-btn:hover {
  color: var(--accent-primary);
}

.sidebar-menu {
  list-style-type: none;
  padding: 1rem;
  margin: 0;
}

@media (min-width: 767px) {
  .sidebar {
    position: relative;
    height: auto;
  }
}
</style>import type { log } from 'node_modules/astro/dist/core/logger/core';
