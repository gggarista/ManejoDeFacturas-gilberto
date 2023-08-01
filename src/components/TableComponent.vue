<script setup lang="ts">
import { Ref, ref, onMounted, computed, watch } from "vue";
//import VueTailwindDatepicker from 'vue-tailwind-datepicker'
import calendarIon from '../assets/calendar.svg'
import FilePdfIon from '../assets/pdf-svgrepo-com.svg'
import FileXmlIon from '../assets/xml-svgrepo-com.svg'
//import FileZipIon from '../assets/zip-svgrepo-com.svg'
import sendMailIon from '../assets/send-mail-svgrepo-com.svg'
import SendInvoiceIon from '../assets/send-svgrepo-com.svg'
import moment from "moment";
import useLoginStore from '@/stores/loginStore'
import axios from "axios";
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
import { AES, enc } from 'crypto-js';
const apiUrl: string = import.meta.env.VITE_API_URL;
axios.defaults.baseURL = apiUrl;
const token: string | null = localStorage.getItem('token')
axios.defaults.headers.common = { 'Authorization': `Bearer ${token}` }


const DataDocument: Ref<Array<object> | null> = ref(null)
const varBuscadorNormal: Ref<String | null> = ref('');
const varBuscadorPrefix: Ref<String | null> = ref('');
const varBuscadorCliente: Ref<String | null> = ref('');
const pagination: Ref<any | null> = ref({});
const store: any = useLoginStore()
const dateValue: Ref<{ startDate: String, endDate: String }> = ref({
    startDate: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
    endDate: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
})
const OpcionesPaginas: any = ref([])
const paginaSelected: Ref<String> = ref('1')
const itemPerPageSelected: Ref<String> = ref('10')
const varitemPerPage: Ref<Array<String>> = ref(["5", "10", "25", "50", "100", "1000"])
const varSelectedStatusDocument: Ref<String> = ref("")
const secretKey: Ref<any> = ref('arista') // Cambia esto por tu clave secreta
const firstPageLogin: Ref<any> = ref('')

//---------- variables computed---------------------

/**
 * variable para almacenar los datos del usuario conectado
 */

const dataLogin: any = computed({
    get() {
        return store.getterDataLogin
    },
    set(val) {
        store.setDataLogin(val)
    }
});
const filterDocument: any = computed(() => {
    if (DataDocument.value) {
        return DataDocument.value.filter((item: any) => {
            const searchTerm = varBuscadorNormal.value?.toLowerCase();
            const numberMatches = item.number.toLowerCase().includes(searchTerm);
            return numberMatches;
        });
    }
})
const filterDocumentPrefix: any = computed(() => {
    if (DataDocument.value) {
        return filterDocument.value.filter((item: any) => {
            const searchTerm = varBuscadorPrefix.value?.toLowerCase();
            const prefixMatches = item.prefix.toLowerCase().includes(searchTerm);
            return prefixMatches;
        });
    }
})
const filterDocumentCliente: any = computed(() => {
    if (DataDocument.value) {
        return filterDocumentPrefix.value.filter((item: any) => {
            const searchTerm = varBuscadorCliente.value?.toLowerCase();
            if (item.client && item.client != '') {

                const clienteMatches = (JSON.parse(item.client).name) ? JSON.parse(item.client).name.toLowerCase().includes(searchTerm) : '';
                const clienteNumberMatches = item.customer.toLowerCase().includes(searchTerm);
                return clienteMatches || clienteNumberMatches;
            } else {
                const clienteMatches = ''
                const clienteNumberMatches = item.customer.toLowerCase().includes(searchTerm);
                return clienteMatches || clienteNumberMatches;
            }
        });
    }
})

const filterStatusDocument: any = computed(() => {
    if (DataDocument.value) {
        return filterDocumentCliente.value.filter((item: any) => {
            const statusDocument = item.state_document_id;
            if (varSelectedStatusDocument.value === "ACEPTADA") {
                return statusDocument === 1; // Filtrar solo cuando el estado sea 1 (aceptada)
            } else {
                return statusDocument === 0; // Filtrar solo cuando el estado sea 0 (no aceptada)
            }
        });
    }
});

const filterDocumentDate: any = computed(() => {
    if (DataDocument.value) {
        return filterStatusDocument.value.filter((item: any) => {
            const startDate = dateValue.value.startDate.substring(0, 10).toLowerCase();
            const endDate = dateValue.value.endDate.substring(0, 10).toLowerCase();
            const documentDate = item.created_at.substring(0, 10).toLowerCase();
            return documentDate >= startDate && documentDate <= endDate;
        });
    }
})


watch(dateValue, (newX: any) => {
    getDataLogin(firstPageLogin.value)
    console.log(newX)
})

//---------- metodos---------------------

const formatNumber: any = (numero: any = 0) => {
    // Número que quieres formatear con dos decimales


    // Opciones de formato para LATAM (Latinoamérica)
    const opcionesFormato = {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
    };

    // Formatear el número con las opciones establecidas
    const numeroFormateado = numero.toLocaleString('es-AR', opcionesFormato);

    return numeroFormateado
}
const GenerateOpcionDePaginas: any = (url: any = '') => {

    var regex = /page=(\d+)/;
    var matches = url.match(regex);

    if (matches && matches.length > 1) {
        var lastNumber = parseInt(matches[1]);

        for (var i = 1; i <= lastNumber; i++) {

            OpcionesPaginas.value[i] = `${axios.defaults.baseURL}/login-manejo-factura?page=${i}`
        }


    } else {
        console.log("No se encontró ningún número después del parámetro 'page=' en la URL.");
    }
}
const getDataLogin: any = async (urlPAginate: any = null) => {
    try {
        const bytes = AES.decrypt(localStorage.getItem('user'), secretKey.value);
        var dataL: any = bytes.toString(enc.Utf8);
        var model = JSON.parse(dataL)
        let { data } = await axios.post(`${urlPAginate}&itemPerPage=${itemPerPageSelected.value}&aceptada=${varSelectedStatusDocument.value}&created_start=${dateValue.value.startDate}&created_end=${dateValue.value.endDate}&cliente=${varBuscadorCliente.value}&prefijo=${varBuscadorPrefix.value}&documento=${varBuscadorNormal.value}`, { email: model.email, password: model.password })

        // Paso 1: Ordenar el array por fecha de forma descendente
        data[0].sort((a: any, b: any) => b.created_at - a.created_at);
        // Paso 2 y 3: Crear un nuevo array y eliminar duplicados por fecha
        const objetosUnicos: any = [];
        const fechasVistas = new Set();
        data[0].forEach((objeto: any) => {
            const fecha = objeto.number;
            if (!fechasVistas.has(fecha)) {
                objetosUnicos.push(objeto);
                fechasVistas.add(fecha);
            }
        });
        data[0] = objetosUnicos;

        for (const iterator of data[0]) {
            iterator.isSend = false
        }
        DataDocument.value = data[0]
        pagination.value = data[1]
        localStorage.setItem("token", AES.encrypt( data.user.api_token, secretKey.value).toString())
        localStorage.setItem("firstPageLogin",  AES.encrypt(data[1].first_page_url, secretKey.value).toString() )
        dataLogin.value = data
        OpcionesPaginas.value = [];
        GenerateOpcionDePaginas(data[1].last_page_url)

        
    } catch (error) {
        console.log(error)
    }
}
const SendMail: any = async (data: any) => {
    try {
        await axios.post('/api/send-email-customer/NO', { "company_idnumber": data.identification_number, "prefix": data.prefix, "number": data.number })
        await getDataLogin(dataLogin.value[1].first_page_url)
        alert('envio con exito');
    } catch (error) {
        console.log(error)
    }
}
const SendInvoice: any = async (data: any, type: any, document: any) => {
    try {
        document.isSend = true
        if (type == 1 || type == 12) {
            let dataSend = await axios.post('/api/ubl2.1/invoice', data)
            notify(`<p style="font-size: 9px" >${dataSend.data.message}</p><br/><p style="font-size: 9px" >${dataSend.data.ResponseDian ? dataSend.data.ResponseDian.Envelope.Body.SendBillSyncResponse.SendBillSyncResult.ErrorMessage.string : ''}</p><br/><p style="font-size: 9px" >  ${dataSend.data.ResponseDian ? dataSend.data.ResponseDian.Envelope.Body.SendBillSyncResponse.SendBillSyncResult.StatusMessage : ''}</p>`)
            document.isSend = false
        } else if (type == 2) {
            let dataSend = await axios.post('/api/ubl2.1/invoice-export', data)
            notify(`<p style="font-size: 9px" >${dataSend.data.message}</p><br/><p style="font-size: 9px" >${dataSend.data.ResponseDian ? dataSend.data.ResponseDian.Envelope.Body.SendBillSyncResponse.SendBillSyncResult.ErrorMessage.string : ''}</p><br/><p style="font-size: 9px" >  ${dataSend.data.ResponseDian ? dataSend.data.ResponseDian.Envelope.Body.SendBillSyncResponse.SendBillSyncResult.StatusMessage : ''}</p>`)
            document.isSend = false
        } else if (type == 3) {
            let dataSend = await axios.post('/api/ubl2.1/invoice-contingency', data)
            notify(`<p style="font-size: 9px" >${dataSend.data.message}</p><br/><p style="font-size: 9px" >${dataSend.data.ResponseDian ? dataSend.data.ResponseDian.Envelope.Body.SendBillSyncResponse.SendBillSyncResult.ErrorMessage.string : ''}</p><br/><p style="font-size: 9px" >  ${dataSend.data.ResponseDian ? dataSend.data.ResponseDian.Envelope.Body.SendBillSyncResponse.SendBillSyncResult.StatusMessage : ''}</p>`)
            document.isSend = false
        } else if (type == 4) {
            let dataSend = await axios.post('/api/ubl2.1/credit-note', data)
            notify(`<p style="font-size: 9px" >${dataSend.data.message}</p><br/><p style="font-size: 9px" >${dataSend.data.ResponseDian ? dataSend.data.ResponseDian.Envelope.Body.SendBillSyncResponse.SendBillSyncResult.ErrorMessage.string : ''}</p><br/><p style="font-size: 9px" >  ${dataSend.data.ResponseDian ? dataSend.data.ResponseDian.Envelope.Body.SendBillSyncResponse.SendBillSyncResult.StatusMessage : ''}</p>`)
            document.isSend = false
        } else if (type == 5) {
            let dataSend = await axios.post('/api/ubl2.1/debit-note', data)
            notify(`<p style="font-size: 9px" >${dataSend.data.message}</p><br/><p style="font-size: 9px" >${dataSend.data.ResponseDian ? dataSend.data.ResponseDian.Envelope.Body.SendBillSyncResponse.SendBillSyncResult.ErrorMessage.string : ''}</p><br/><p style="font-size: 9px" >  ${dataSend.data.ResponseDian ? dataSend.data.ResponseDian.Envelope.Body.SendBillSyncResponse.SendBillSyncResult.StatusMessage : ''}</p>`)
            document.isSend = false
        } else if (type == 11) {
            let dataSend = await axios.post('/api/ubl2.1/support-document', data)
            notify(`<p style="font-size: 9px" >${dataSend.data.message}</p><br/><p style="font-size: 9px" >${dataSend.data.ResponseDian ? dataSend.data.ResponseDian.Envelope.Body.SendBillSyncResponse.SendBillSyncResult.ErrorMessage.string : ''}</p><br/><p style="font-size: 9px" >  ${dataSend.data.ResponseDian ? dataSend.data.ResponseDian.Envelope.Body.SendBillSyncResponse.SendBillSyncResult.StatusMessage : ''}</p>`)
            document.isSend = false
        } else if (type == 13) {
            let dataSend = await axios.post('/api/ubl2.1/sd-credit-note', data)
            notify(`<p style="font-size: 9px" >${dataSend.data.message}</p><br/><p style="font-size: 9px" >${dataSend.data.ResponseDian ? dataSend.data.ResponseDian.Envelope.Body.SendBillSyncResponse.SendBillSyncResult.ErrorMessage.string : ''}</p><br/><p style="font-size: 9px" >  ${dataSend.data.ResponseDian ? dataSend.data.ResponseDian.Envelope.Body.SendBillSyncResponse.SendBillSyncResult.StatusMessage : ''}</p>`)
            document.isSend = false
        }
        
        getDataLogin(firstPageLogin)
    } catch (error) {
        console.log(error)
    }
}

const notify: any = (message: any) => { 

    toast(message, { autoClose: false, dangerouslyHTMLString: true}); // ToastOptions
}

onMounted(async () => {
    const bytes =  await AES.decrypt(localStorage.getItem('firstPageLogin'), secretKey.value).toString(enc.Utf8);
    var decryptedText: any = await bytes;
    firstPageLogin.value = decryptedText
    getDataLogin(firstPageLogin.value)

})
</script>

<template>
    <section class="container px-0 mx-auto">
        <!-- cabecera -->
        <div class="flex items-center w-full gap-1 mt-1 ">
            <div class="w-4/12 max-w-md mx-auto">
                <button
                    class="flex items-center justify-center w-1/2 px-5 py-2 text-sm text-gray-700 transition-colors duration-200 bg-white border rounded-lg gap-x-2 sm:w-auto hover:bg-gray-100">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clip-path="url(#clip0_3098_154395)">
                            <path
                                d="M13.3333 13.3332L9.99997 9.9999M9.99997 9.9999L6.66663 13.3332M9.99997 9.9999V17.4999M16.9916 15.3249C17.8044 14.8818 18.4465 14.1806 18.8165 13.3321C19.1866 12.4835 19.2635 11.5359 19.0351 10.6388C18.8068 9.7417 18.2862 8.94616 17.5555 8.37778C16.8248 7.80939 15.9257 7.50052 15 7.4999H13.95C13.6977 6.52427 13.2276 5.61852 12.5749 4.85073C11.9222 4.08295 11.104 3.47311 10.1817 3.06708C9.25943 2.66104 8.25709 2.46937 7.25006 2.50647C6.24304 2.54358 5.25752 2.80849 4.36761 3.28129C3.47771 3.7541 2.70656 4.42249 2.11215 5.23622C1.51774 6.04996 1.11554 6.98785 0.935783 7.9794C0.756025 8.97095 0.803388 9.99035 1.07431 10.961C1.34523 11.9316 1.83267 12.8281 2.49997 13.5832"
                                stroke="currentColor" stroke-width="1.67" stroke-linecap="round" stroke-linejoin="round" />
                        </g>
                        <defs>
                            <clipPath id="clip0_3098_154395">
                                <rect width="20" height="20" fill="white" />
                            </clipPath>
                        </defs>
                    </svg>

                    <span>Enviar Facturas</span>
                </button>
            </div>
            <div class="w-3/12 max-w-md mx-auto">
                <select id="seleccionar" class="block p-2 border border-gray-500 rounded-lg"
                    @change="getDataLogin(firstPageLogin)" v-model="itemPerPageSelected">
                    <option :value="pagina" class="text-white bg-green-700" v-for="(pagina, p) in varitemPerPage" :key="p">
                        {{ pagina }}
                    </option>
                </select>
            </div>
            <div class="max-w-md mx-auto w-/12">
                <select id="seleccionar" class="block p-2 border border-gray-500 rounded-lg"
                    @change="getDataLogin(paginaSelected)" v-model="paginaSelected">
                    <option :value="pagina" class="text-white bg-green-700" v-for="(pagina, p) in OpcionesPaginas" :key="p">
                        Pagina {{ p }}
                    </option>
                </select>
            </div>
        </div>

        <div class="flex items-center w-full gap-2 mt-1 ">
            <vue-tailwind-datepicker v-model="dateValue"
                class="h-[38px] border border-gray-500 rounded-lg  placeholder-gray-600/70" />
            <div class="w-2/12 max-w-md mx-auto">
                <select @change="getDataLogin(firstPageLogin)" id="seleccionar"
                    class="block p-2 border border-gray-500 rounded-lg" v-model="varSelectedStatusDocument">
                    <option value="ACEPTADA" class="text-white bg-green-700">ACEPTADA</option>
                    <option value="POR ENVIAR" class="text-white bg-red-700">POR ENVIAR</option>
                    <option value=" " class="text-gray bg-white" placeholder="Estado"></option>
                </select>
            </div>
            <div class="relative flex items-center w-2/12 mt-1 md:mt-0">
                <span class="absolute">
        
                    <svg class="w-5 h-5 mx-3 text-gray-500 dark:text-gray-600" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12">
                        </path>
                    </svg>
                </span>
                <input @change="getDataLogin(firstPageLogin)" type="text" placeholder="Buscar por Nit"
                    v-model="varBuscadorCliente"
                    class="block w-full py-1.5 pr-5 text-gray-700 bg-white border border-gray-500 rounded-lg md:w-80 placeholder-gray-600/70 pl-11  focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40">
            </div>
            <div class="relative flex items-center w-2/12">
                <span class="absolute">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                        stroke="currentColor" class="w-5 h-5 mx-3 text-gray-400 dark:text-gray-600">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                </span>
                <input @change="getDataLogin(firstPageLogin)" type="text" placeholder="Buscar por prefijo"
                    v-model="varBuscadorPrefix"
                    class="block  py-1.5 pr-5 text-gray-700 bg-white border border-gray-500 rounded-lg md:w-80 placeholder-gray-400/70 pl-11  focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40">
            </div>
            <div class="relative flex items-center w-2/12">
                <span class="absolute">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                        stroke="currentColor" class="w-5 h-5 mx-3 text-gray-400 dark:text-gray-600">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                </span>
                <input @change="getDataLogin(firstPageLogin)" type="text" placeholder="Buscar por Número"
                    v-model="varBuscadorNormal"
                    class="block py-1.5 pr-5 text-gray-700 bg-white border border-gray-500 rounded-lg md:w-80 placeholder-gray-400/70 pl-11  focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40">
            </div>

        </div>
        <!-- body -->
        <div class="flex flex-col mt-2">
            <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                    <div class="overflow-hidden border border-gray-200 md:rounded-lg">
                        <table class="min-w-full divide-y divide-gray-200 ">
                            <thead class="bg-blue-700  text-[13px] ">
                                <th></th>
                                <th scope="col" class="px-4 font-normal text-center text-gray-300 ">
                                    <span>#</span>
                                </th>
                                <th scope="col" class="flex gap-1 px-12 font-normal text-center text-white">
                                    <img :src="calendarIon" class="self-center w-6 h-6 " />
                                    Fecha Emision
                                </th>
                                <th scope="col" class="px-12 font-normal text-center text-white ">
                                    Cliente
                                </th>
                                <th scope="col" class="px-12 font-normal text-center text-white ">
                                    Documento
                                </th>
                                <th scope="col" class="px-12 font-normal text-center text-white ">
                                    Tipo
                                </th>

                                <th scope="col" class="px-4 font-normal text-center text-white ">
                                    Valor documento
                                </th>
                                <th scope="col" class="px-4 font-normal text-center text-white ">
                                    Descargas
                                </th>
                                <th scope="col" class="px-4 font-normal text-center text-white ">
                                    Acciones
                                </th>
                                <th scope="col" class="px-12 font-normal text-center text-white ">
                                    Estado
                                </th>


                            </thead>
                            <tbody class="bg-white divide-gray-200 text-[10px]">
                                <tr v-for="(document, d) in filterDocumentDate" :key="d" class="hover:bg-[#f3b8b0eb]">
                                    <td>
                                        <div class="ml-1">
                                            <div
                                                class="relative flex items-center justify-center flex-shrink-0 w-5 h-5 bg-gray-200 rounded-sm">
                                                <input placeholder="checkbox" type="checkbox"
                                                    class="absolute w-full h-full opacity-0 cursor-pointer focus:opacity-100 checkbox" />
                                                <div class="hidden text-white bg-indigo-700 rounded-sm check-icon">
                                                    <svg class="icon icon-tabler icon-tabler-check"
                                                        xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                        viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
                                                        fill="none" stroke-linecap="round" stroke-linejoin="round">
                                                        <path stroke="none" d="M0 0h24v24H0z"></path>
                                                        <path d="M5 12l5 5l10 -10"></path>
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-0 py-0 text-center whitespace-nowrap">
                                        <div>
                                            {{ document.id }}
                                        </div>
                                    </td>
                                    <td class="px-2 py-2 text-center whitespace-nowrap">
                                        <div class="flex gap-1">

                                            <div class="self-center px-1 py-1 font-bold text-blue-900 bg-blue-100 rounded">
                                                {{ document.created_at }}</div>
                                        </div>
                                    </td>
                                    <td class="px-4 py-2 text-center whitespace-nowrap">
                                        <div>
                                            <h4 class="font-bold text-black">{{ JSON.parse(document.client).name }}</h4>
                                            <p class="font-bold text-gray-900 ">{{ document.customer }}</p>
                                        </div>
                                    </td>
                                    <td class="px-4 py-2 text-center whitespace-nowrap">
                                        <div>
                                            <p class="font-bold text-gray-900 ">{{ document.prefix }}{{ document.number }}
                                            </p>
                                        </div>
                                    </td>
                                    <td class="px-4 py-2 text-center whitespace-nowrap">
                                        <div>
                                            <p class="font-bold text-gray-900 ">
                                                {{ document.type_document_id == 1 ? 'Factura venta nacional' :
                                                   document.type_document_id == 2 ? 'Factura Exportacion' :
                                                   document.type_document_id == 3 ? 'Factura contingencia' :
                                                   document.type_document_id == 4 ? 'Nota credito' :
                                                   document.type_document_id == 5 ? 'Nota debito' :
                                                   document.type_document_id == 11 ? 'Documento soporte' :
                                                   document.type_document_id == 12 ? 'Factura venta tipo-04' :
                                                                            '' }}
                                            </p>
                                        </div>
                                    </td>
                                    <td class="px-4 py-2 text-center whitespace-nowrap">
                                        <div>
                                            <h4 class="text-black text-[14px] ">
                                                $ {{ formatNumber(document.total) }}
                                            </h4>
                                        </div>
                                    </td>
                                    <td class="px-2 py-2 text-center whitespace-nowrap">
                                        <div class="flex gap-1">
                                            <a :href="`http://apidian.oo/api/download/${document.identification_number}/${document.pdf}`"
                                                target="__blank">
                                                <img :src="FilePdfIon" class="w-8 h-9" />
                                            </a>
                                            <a :href="`http://apidian.oo/api/download/${document.identification_number}/${document.xml}`"
                                                target="__blank">

                                                <img :src="FileXmlIon" class="w-8 h-9" />
                                            </a>
                                        </div>
                                    </td>
                                    <td class="px-1 py-2 text-center whitespace-nowrap">
                                        <div class="relative">
                                            <button @click.prevent="SendMail(document)"
                                                class="relative h-6 overflow-hidden text-xs bg-white rounded-lg shadow w-22 group">
                                                <div
                                                    class="absolute inset-0 w-2 bg-orange-400 transition-all duration-[250ms] ease-out group-hover:w-full">
                                                </div>
                                                <span class="relative flex gap-1 px-2 text-black group-hover:text-white">
                                                    <img :src="sendMailIon" class="w-5 h-5 " />
                                                    <p font-bold class="self-center "> Correo</p>
                                                </span>
                                            </button>
                                        </div>
                                    </td>

                                    <td class="px-1 py-2 text-center whitespace-nowrap">
                                        <div v-if="document.state_document_id == 1" 
                                            :class="{ 'flex justify-center gap-1 px-3 py-1 font-normal rounded-full text-black gap-x-2 bg-emerald-100/60 w-fit': document.state_document_id == 1, 'flex gap-1 px-3 py-1 font-normal rounded-full text-black gap-x-2 bg-red-100/60 w-fit': document.state_document_id == 0 }">
                                            <svg xmlns="http://www.w3.org/2000/svg"
                                                width="20" height="20" viewBox="0 0 20 20" fill="#02B126">
                                                <path
                                                    d="M9.16667 2.5L16.6667 10C17.0911 10.4745 17.0911 11.1922 16.6667 11.6667L11.6667 16.6667C11.1922 17.0911 10.4745 17.0911 10 16.6667L2.5 9.16667V5.83333C2.5 3.99238 3.99238 2.5 5.83333 2.5H9.16667"
                                                    stroke="#52525B" stroke-width="1.25" stroke-linecap="round"
                                                    stroke-linejoin="round">
                                                </path>
                                                <circle cx="7.50004" cy="7.49967" r="1.66667" stroke="#52525B"
                                                    stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
                                                </circle>
                                            </svg>
                                            <p class="text-white bg-green-700 w-fit h-fit py-[2px] px-[6px] rounded-lg">
                                                ACEPTADA
                                            </p>
                                        </div>
                                        <div v-else class="px-1 py-2 text-center whitespace-nowrap">
                                            <div class="relative">
                                                <button @click.prevent="SendInvoice(JSON.parse(document.request_api), document.type_document_id, document)" class="relative w-24 h-6 overflow-hidden text-xs bg-white rounded-lg shadow group">
                                                    <div class="absolute inset-0 w-3 bg-green-400 transition-all duration-[250ms] ease-out group-hover:w-full" />
                                                    <span class="relative flex gap-1 px-2 text-black group-hover:text-white">
                                                        <img :src="SendInvoiceIon" class="w-4 h-4 "/>
                                                        <p class="self-center font-bold ">{{document.isSend == true ? 'Enviando...':'Enviar'}}</p>
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <!-- footer -->
        <div class="mt-2 sm:flex sm:items-center sm:justify-between ">
            <div class="text-sm text-gray-500 ">
                Reg-<span class="font-medium text-gray-700 ">{{ pagination.from }} al {{ pagination.to }}</span>
            </div>

            <div class="flex items-center mt-4 gap-x-4 sm:mt-0">
                <button @click.prevent="getDataLogin(pagination.prev_page_url)" :disabled="pagination.prev_page_url == null"
                    class="flex items-center justify-center w-1/2 px-5 py-2 text-sm text-gray-700 capitalize transition-colors duration-200 bg-white border rounded-md sm:w-auto gap-x-2 hover:bg-gray-100 ">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                        class="w-5 h-5 rtl:-scale-x-100">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
                    </svg>
                    <span class="relative flex gap-1 px-2 text-black group-hover:text-blue">
                        Anterior
                    </span>
                </button>

                <button @click.prevent="getDataLogin(pagination.next_page_url)" :disabled="pagination.next_page_url == null"
                    class="flex items-center justify-center w-1/2 px-5 py-2 text-sm text-gray-700 capitalize transition-colors duration-200 bg-white border rounded-md sm:w-auto gap-x-2 hover:bg-gray-100 ">
                    <span>
                        Siguiente
                    </span>

                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                    stroke="currentColor" class="w-5 h-5 rtl:-scale-x-100">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
            </button>
        </div>
    </div>
    </section>
</template>