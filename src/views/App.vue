<script setup lang="ts">
import { Ref, ref, computed } from 'vue'
import offIcon from '../assets/logout2.png'
import whatsappL from '../assets/whatsapp.svg'
import pressPointerHand from '@/assets/RightpointerHand.png'
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
  <div id="container" class="w-full h-10 max-h-8 bg-green-200  shadow-sm" v-if="$route.name != 'login.page' ">
    <div id="header_wrapper" class=" text-center flex justify-between ">
      <div></div>
      
      <div class="justify-between self-top mt-2">
        <p class="text-sm font-medium text-gray-800 break-words sm:whitespace-normal">
          ARISTA SOFTWARE - CONSULTAR DOCUMENTOS - {{ CompanieName }}
        </p>
      </div>

      <div class="justify-between  p-1 group relative">
        <div class="absolute top-10 -left-24 z-40 bg-[#cecece] rounded-xl px-2 hidden group-hover:block  " >
          <p class="text-white" >
            Cerrar sesión 
          </p>
        </div>
        <button  class=" hover:cursor-pointer "  @click.prevent="logout">
          <img :src="offIcon" class="w-12 h-12 top-1 ">
        </button>
      </div>

    </div>
  </div>
  <!-- Body -->
  <main   > 
    <div class="min-h-screen "  >
      <div class="h-full ">
        <router-view />
        <!-- footer  -->      
        <div class="flex items-center justify-center   bg-green-200 my-2 z-10 relative " v-if="$route.name != 'login.page' ">
          <div class="h-full flex gap-2  ">
            <a href="https://aristasoftware.com" target="_blank" class="text-red-800 self-center mr-20 ">https://aristasoftware.com</a>
            <p class="self-center"  >Si desea comunicarse con un asesor via whatsapp, presione aqui </p>
            <img :src="pressPointerHand" class="w-8 h-8" >
            <a href="https://wa.me/573137746176" target="_blank" class="text-red-800 self-center flex gap-2 hover:text-blue-700  group z-10">
              <img :src="whatsappL" class="w-8 h-8">
              <p class="self-center">
                +(57)3137746176
              </p>
              <div class="absolute -top-7 z-40 bg-[#cecece] rounded-xl px-2 hidden group-hover:block  " >
                <p class="text-white" >
                  Presione aqui
                </p>
              </div>
            </a>
            <a href="https://wa.me/573104148416" target="_blank" class="text-red-800 self-center flex gap-2 hover:text-blue-700 group z-10">
              <img :src="whatsappL" class="w-8 h-8">
              <p class="self-center">
                +(57)3104148416
              </p>
              <div class="absolute -top-7 z-40 bg-[#cecece] rounded-xl px-2 hidden group-hover:block  " >
                <p class="text-white" >
                  Presione aqui
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  </main>

</template>

<style scoped></style>
