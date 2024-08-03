<!-- src/components/ui/MenuItem/Index.vue -->
<template>
  <li :class="{ 'has-submenu': hasChildren, 'active': isActive }">
    <div class="menu-item">
      <a :href="item.url" @click.prevent="navigate(item.url)">{{ item.label }}</a>
      <button v-if="hasChildren" @click="toggleSubmenu" class="submenu-toggle">
        <i :class="isOpen ? 'i-mdi-chevron-up' : 'i-mdi-chevron-down'"></i>
      </button>
    </div>
    <transition name="submenu">
      <ul v-if="hasChildren && isOpen" class="sidebar-submenu">
        <component
          :is="AsyncMenuItem"
          v-for="subItem in item.children"
          :key="subItem.url"
          :item="subItem"
          :active-path="activePath"
          @navigate="handleChildNavigation"
        />
      </ul>
    </transition>
  </li>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent } from 'vue';

const AsyncMenuItem = defineAsyncComponent(() => import('@/components/ui/MenuItem/Index.vue'));

interface MenuItemProps {
  item: {
    label: string;
    url: string;
    children?: typeof item[];
  };
  activePath: string;
}

const props = defineProps<MenuItemProps>();
const emit = defineEmits(['navigate']);

const isOpen = ref(false);

const hasChildren = computed(() => props.item.children && props.item.children.length > 0);
const isActive = computed(() => props.activePath.startsWith(props.item.url));

function toggleSubmenu() {
  isOpen.value = !isOpen.value;
}

function navigate(url: string) {
  emit('navigate', url);
}

function handleChildNavigation(url: string) {
  isOpen.value = true;
  emit('navigate', url);
}
</script>

<style scoped>
.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.menu-item:hover {
  background-color: var(--accent-secondary);
}

.menu-item a {
  flex-grow: 1;
  color: var(--text-main);
  text-decoration: none;
}

.submenu-toggle {
  background: none;
  border: none;
  color: var(--text-main);
  cursor: pointer;
  padding: 0.25rem;
  transition: color 0.3s ease;
}

.submenu-toggle:hover {
  color: var(--accent-primary);
}

.sidebar-submenu {
  padding-left: 1rem;
}

.has-submenu > .menu-item > a {
  font-weight: bold;
}

.active > .menu-item {
  background-color: var(--accent-primary);
  color: var(--bg-main);
}

.submenu-enter-active,
.submenu-leave-active {
  transition: all 0.3s ease;
}

.submenu-enter-from,
.submenu-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>