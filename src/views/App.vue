<script setup lang="ts">
import { Ref, ref, computed } from 'vue'
import offIcon from '../assets/off.svg'
import router from '@/plugins/routes/routes'
//import useLoginStore from '@/stores/loginStore'
import { AES, enc } from 'crypto-js';
const secretKey: Ref<any> = ref('arista') // Cambia esto por tu clave secreta


//const store: any = useLoginStore()

const CompanieName: any = computed({
    get() {
      const COMPN: any = localStorage.getItem('companie_name')
        const bytes = AES.decrypt(COMPN, secretKey.value) ;
        var decryptedText: any = bytes.toString(enc.Utf8);
        return decryptedText
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
        <h2 class="text-base sm:text-lg md:text-xl font-medium text-gray-800 break-words sm:whitespace-normal">
        ARISTA SOFTWARE - CONSULTAR DOCUMENTOS - {{ CompanieName }}
      </h2>
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
      <a href="https://aristasoftware.com" target="_blank" class="text-red-800">httpss://aristasoftware.com</a><!-- Contenido principal aquí -->
    </div>
  </div>
</template>

<style scoped></style>
