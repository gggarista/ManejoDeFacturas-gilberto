<script setup lang="ts">
import { Ref, ref, computed } from 'vue'
import { AES, enc } from 'crypto-js';
import logo from '@/assets/ARISTA.png'
import { UserModel } from '@/interfaces/index'
import axios from 'axios'
import useLoginStore from '@/stores/loginStore'
import router from '@/plugins/routes/routes'
const token: string | null = localStorage.getItem('token')

axios.defaults.headers.common = { 'Authorization': `Bearer ${token}` }
// Acceder a la URL de la API
const apiUrl: string = import.meta.env.VITE_API_URL;
axios.defaults.baseURL = apiUrl;

//---------- variables ref---------------------
/**
 * variable que contiene el las keys para obtener el envio de las credenciales a la api
 */
const model: Ref<UserModel> = ref({
    email: '',
    pass: ''
});

const isLoading = ref(false);

const store: any = useLoginStore()
const secretKey: Ref<any> = ref('arista') // Cambia esto por tu clave secreta

//---------- variables computed---------------------
/**
 * variable para almacenar los datos del usua           rio conectado
 */
const dataLogin: any = computed({
    get() {
        return store.getterDataLogin
    },
    set(val) {
        store.setDataLogin(val)
    }
});

const CompanieName: any = computed({
    get() {
        const COMPN: any = localStorage.getItem('companie_name')
        const bytes = AES.decrypt(COMPN, secretKey.value) ;
        var decryptedText: any = bytes.toString(enc.Utf8);
        return decryptedText
    },
    set(val: any) {
        localStorage.setItem('companie_name', AES.encrypt(val, secretKey.value).toString())
    }
});


//------------------ metodos -------------------
/**
 * 
 * funcion que permite ingresar al sistema 
 * @return Promise<any | null>
 */
const postLogiun: any = async () => {
    try {
        isLoading.value = true;
        let { data } = await axios.post('/login-manejo-factura', { email: model.value?.email, password: model.value?.pass })
        // Paso 1: Ordenar el array por fecha de forma descendente
        data[0].sort((a: any, b: any) => b.created_at - a.created_at);
        // Paso 2 y 3: Crear un nuevo array y eliminar duplicados por fecha
        const objetosUnicos: any = [];
        const fechasVistas = new Set();
        data[0].forEach((objeto: any) => {
            const fecha = objeto.created_at;
            if (!fechasVistas.has(fecha)) {
                objetosUnicos.push(objeto);
                fechasVistas.add(fecha);
            }
        });
        data[0] = objetosUnicos;
        localStorage.setItem("token", AES.encrypt( data.user.api_token, secretKey.value).toString())
        localStorage.setItem("firstPageLogin",  AES.encrypt(data[1].first_page_url, secretKey.value).toString() )
        localStorage.setItem("companie_name", AES.encrypt(data.user.name, secretKey.value).toString() )
        localStorage.setItem("user", AES.encrypt(JSON.stringify({ email: model.value?.email, password: model.value?.pass }), secretKey.value).toString()  )
        CompanieName.value =  data.user.name
        store.companie_name =  data.user.name
        dataLogin.value = data
        isLoading.value = false;
        router.push({ name: 'Home' })
    } catch (error) {
        console.log({ error })
    }
}




</script>
<template>
    <section class="flex items-center justify-center min-h-screen  ">
        <div class="flex flex-col  p-5 shadow-lg rounded-2xl ">
            <div class="flex justify-center">
                <img :src="logo" class="self-center rounded-2xl w-3/12 h-6/12" alt="page img">
            </div>
            <div class="px-5 ">
                <h2 class="text-2xl font-bold text-[#002D74] text-center">CONSULTAR FACTURAS</h2>
                <form class="mt-6">
                    <div>
                        <label class="block text-gray-700">Correo Electronico</label>
                        <input v-model="model.email" type="email" name=""
                            class="w-full px-4 py-3 mt-2 bg-gray-300 border rounded-lg focus:border-blue-500 focus:bg-white focus:outline-none"
                            autofocus required>
                    </div>
                    <div class="mt-4">
                        <label class="block text-gray-700">Contraseña</label>
                        <input v-model="model.pass" type="password" name="" minlength="6"
                            class="w-full px-4 py-3 mt-2 bg-gray-300 border rounded-lg focus:border-blue-500 focus:bg-white focus:outline-none"
                            required>
                    </div>
                    <button @click.prevent="postLogiun" type="submit"
                        class=" w-full px-4 py-3 mt-6 font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-400 focus:bg-blue-400 flex gab-5 justify-between">
                        <p>
                            Entrar 
                        </p>
                        <svg v-if="isLoading"  class="animate-spin  mr-3 h-full w-5 text-white ml-5 self-center" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>        
                    </button>
                </form>
            </div>
        </div>
    </section>
</template>