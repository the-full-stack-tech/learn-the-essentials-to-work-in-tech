<!-- Breadcrumbs.vue -->
<template>
  <nav aria-label="Breadcrumb" class="mx-6 mt-2">
    <ol class="breadcrumbs">
      <li v-for="(crumb, index) in breadcrumbs" :key="index">
        <a
          v-if="index < breadcrumbs.length - 1"
          :href="crumb.url"
          class="breadcrumb-link"
        >
          {{ crumb.label }}
        </a>
        <span v-else class="breadcrumb-current">{{ crumb.label }}</span>
      </li>
    </ol>
  </nav>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  pathname: {
    type: String,
    required: true
  },
  listItemsMenu: {
    type: Array,
    required: true
  }
});

const breadcrumbs = computed(() => {
  const pathParts = props.pathname.split('/').filter(Boolean);
  let currentPath = '';
  let currentItems = props.listItemsMenu;
  
  return [
    { label: 'Home', url: '/' },
    ...pathParts.map(part => {
      currentPath += `/${part}`;
      const matchingItem = findMatchingItem(currentItems, currentPath);
      if (matchingItem) {
        currentItems = matchingItem.children || [];
        return { label: matchingItem.label, url: matchingItem.url };
      }
      return { label: part, url: currentPath };
    })
  ];
});

function findMatchingItem(items, path) {
  for (const item of items) {
    if (item.url === path) {
      return item;
    }
    if (item.children) {
      const match = findMatchingItem(item.children, path);
      if (match) return match;
    }
  }
  return null;
}
</script>

<style scoped>
.breadcrumbs {
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
}

.breadcrumbs li:not(:last-child)::after {
  content: "/";
  margin: 0 0.5em;
  color: #666;
}

.breadcrumb-link {
  color: #0066cc;
  text-decoration: none;
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-current {
  color: #333;
  font-weight: bold;
}
</style>
