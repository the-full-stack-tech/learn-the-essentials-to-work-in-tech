<!-- Pagination.vue -->
<template>
  <nav class="pagination" aria-label="Navegación de páginas">
    <button
      v-if="previousPage"
      @click="handleNavigation(previousPage.url)"
      class="pagination-button previous"
      :title="previousPage.label"
    >
      <i class="i-mdi-chevron-left"></i>
      <span>Anterior</span>
    </button>
    <button
      v-if="nextPage"
      @click="handleNavigation(nextPage.url)"
      class="pagination-button next"
      :title="nextPage.label"
    >
      <span>Siguiente</span>
      <i class="i-mdi-chevron-right"></i>
    </button>
  </nav>
</template>

<script setup>
import { navigate } from 'astro:transitions/client';
import { computed } from 'vue';
import { useStore } from '@nanostores/vue';
import { $display } from '@/store/display';

const props = defineProps({
  currentPath: {
    type: String,
    required: true
  },
  menuItems: {
    type: Array,
    required: true
  }
});

const displayStore = useStore($display);

function flattenMenu(items) {
  return items.reduce((acc, item) => {
    acc.push(item);
    if (item.children) {
      acc.push(...flattenMenu(item.children));
    }
    return acc;
  }, []);
}

const flatMenu = computed(() => flattenMenu(props.menuItems));

const currentIndex = computed(() => 
  flatMenu.value.findIndex(item => item.url === props.currentPath)
);

const previousPage = computed(() => 
  currentIndex.value > 0 ? flatMenu.value[currentIndex.value - 1] : null
);

const nextPage = computed(() => 
  currentIndex.value < flatMenu.value.length - 1 ? flatMenu.value[currentIndex.value + 1] : null
);

function handleNavigation(url) {
  navigate(url);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
  padding: 1rem 0;
  border-top: 1px solid var(--accent-secondary);
}

.pagination-button {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border: none;
  background-color: var(--accent-primary);
  color: var(--bg-main);
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.pagination-button:hover {
  background-color: var(--accent-secondary);
}

.pagination-button.previous {
  padding-left: 0.5rem;
}

.pagination-button.next {
  padding-right: 0.5rem;
}

.pagination-button i {
  font-size: 1.5rem;
}

.pagination-button span {
  margin: 0 0.5rem;
}
</style>
