<script setup lang="ts">
import { computed } from 'vue'
import offIcon from '../assets/off.svg'
import router from '@/plugins/routes/routes'
import useLoginStore from '@/stores/loginStore'


const store: any = useLoginStore()

const CompanieName: any = computed({
    get() {
        return store.companie_name
    },
    set(val: any) {
        localStorage.setItem('companie_name', val)
    }
});

const logout: any = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("firstPageLogin")
    localStorage.removeItem("user")
    localStorage.removeItem("companie_name")
    CompanieName.value = ''
    router.push({name:'login.page'})
}

</script>

<template>
  <!-- Header -->
  <div id="container" class="w-full h-18 max-h-10 bg-[#cecece] p-1 shadow-sm" v-if="$route.name != 'login.page' ">
    <div id="header_wrapper" class="h-full justify-between w-full  text-center grid grid-cols-12 gap-1 sm:grid-cols-6 lg:grid-cols-12 max-[640px]:grid-cols-3  p-1">
      <div class="justify-between  p-1 w-full col-span-1 lg:col-span-1 sm:col-span-1 max-[640px]:col-span-1 flex">
        <button  class=" hover:cursor-pointer "  @click.prevent="logout">
          <img :src="offIcon" class="w-8 h-8 top-1 absolute">
        </button>
      </div>
      <div class="justify-between  p-1 w-full col-span-7 lg:col-span-7 sm:col-span-3 max-[640px]:col-span-2">
        <h2 class="text-lg font-medium text-gray-800 ">ARISTA SOFTWARE - CONSULTAR DOCUMENTOS - {{ CompanieName }}  </h2>
      </div>
      <div class="justify-between  p-1 w-full col-span-4 lg:col-span-4 sm:col-span-2 max-[640px]:hidden">
            
      </div>
    </div>
  </div>
  <!-- Body -->

  <main> 
    <div class="min-h-screen mt-1">
      <div class="h-full">
        <router-view />
      </div>
    </div>
  </main>

  <!-- footer  -->
  <div class="h-8 max-h-8 flex items-center justify-center overflow-hidden  bg-[#cecece] " v-if="$route.name != 'login.page' ">
    <div class="h-full">
      aristasoftware.com<!-- Contenido principal aquí -->
    </div>
  </div>
</template>

<style scoped></style>
