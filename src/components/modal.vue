<script setup lang="ts">
import { Ref, ref } from 'vue'
const show: Ref<boolean> = ref(false)
/*const openModal = () => {
    show.value = true;
}*/
const closeModal = () => {
    show.value = false;
}
</script>

<template>
    <div v-if="show" class="fixed inset-0 flex items-center justify-center z-50">
        <div class="modal-overlay absolute inset-0 bg-black opacity-50"></div>
        <div class="modal-container bg-white w-96 p-6 rounded shadow-lg">
            <slot></slot>
            <button @click="closeModal" class="mt-4 w-full bg-blue-500 text-white rounded-md px-4 py-2">
                Cerrar
            </button>
        </div>
    </div>
</template>