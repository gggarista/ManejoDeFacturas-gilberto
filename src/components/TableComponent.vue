<script setup lang="ts">
import { Ref, ref, onMounted, computed, watch } from "vue";
//import VueTailwindDatepicker from 'vue-tailwind-datepicker'
import calendarIon from '../assets/calendar.svg'
import FilePdfIon from '../assets/pdf-svgrepo-com.svg'
import FileXmlIon from '../assets/xml-svgrepo-com.svg'
import FileJsonIon from '../assets/archivo-json.png'
import LastPageIon from '../assets/last-page-svgrepo-com.svg'
import FirstPageIon from '../assets/first-page-svgrepo-com.svg'
//import FileZipIon from '../assets/zip-svgrepo-com.svg'
import modalComponent from './dialogModal.vue'
import DangerButtonComponent from './Dangerbutton.vue'
import sendMailIon from '../assets/send-mail-svgrepo-com.svg'
import SendInvoiceIon from '../assets/send-svgrepo-com.svg'
import CSVFile from '../assets/csv-file.svg'
import moment from "moment";
import useLoginStore from '@/stores/loginStore'
import axios from "axios";
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
import { AES, enc } from 'crypto-js';
const apiUrl: string = import.meta.env.VITE_API_URL;
axios.defaults.baseURL = apiUrl;

const DataDocument: Ref<Array<object> | null> = ref(null)
const varBuscadorNormal: Ref<String | null> = ref('');
const varBuscadorPrefix: Ref<String | null> = ref('');
const varBuscadorCliente: Ref<String | null> = ref('');
const pagination: Ref<any | null> = ref({});
const store: any = useLoginStore()
const dateValue: Ref<{ startDate: String, endDate: String }> = ref({
    startDate: moment(new Date()).format('YYYY-MM-DD'),
    endDate: moment(new Date()).format('YYYY-MM-DD')
})

const formatter = ref({
    date: 'YYYY-MM-DD',
})

const modelSendEmail: Ref<{ company_idnumber: String, prefix: String, number: String, correo: '' }> = ref({
    company_idnumber: '',
    prefix: '',
    number: '',
    correo: '',
})

const OpcionesPaginas: any = ref([])
const paginaSelected: Ref<String> = ref(`${axios.defaults.baseURL}/login-manejo-factura?page=1`)
const itemPerPageSelected: Ref<String> = ref('14')
const varitemPerPage: Ref<Array<String>> = ref(["5", "10", "14", "25", "50", "100", "1000"])
const varSelectedStatusDocument: Ref<String> = ref("POR ENVIAR")
const secretKey: Ref<any> = ref('arista') // Cambia esto por tu clave secreta
const userPassword: Ref<any> = ref('') // Cambia esto por tu clave secreta

const TK: any = localStorage.getItem('token');
const bytes = AES.decrypt(TK, secretKey.value);
const token: string | null = bytes.toString(enc.Utf8);
axios.defaults.headers.common = { 'Authorization': `Bearer ${token}` }

const firstPageLogin: Ref<any> = ref('')
const openmodal: Ref<boolean> = ref(false);
const openmodalStatusChangeDate: Ref<boolean> = ref(false)
const selectedDocuments: any = ref([]); // Almacenar los documentos seleccionados
const statusSelectedDocuments: Ref<boolean> = ref(false);
const checkboxSelectedDocuments: any = ref([]);

const fileBulkInput: any = ref([]);
const statuFileBulkInput: Ref<boolean> = ref(false);
const statuSendFileBulk: Ref<boolean> = ref(false);
const selectAllCheckbox: Ref<boolean> = ref(false);

const nameFile: Ref<any> = ref('')
const totalSelectedDocuments = computed(() => {
    // Calcular la suma total de los documentos seleccionados
    return selectedDocuments.value.reduce((total: number, document: any) => total + document.total, 0);
});

const sortField: Ref<any> = ref('date_issue');
const sortOrder: Ref<any> = ref('desc');
const isLoading = ref(false);

const toggleSelectedDocuments = (documentI: any) => {
    // Añadir o eliminar documentos de la selección
    const index = selectedDocuments.value.findIndex((d: any) => d.id === documentI.id);
    if (index === -1) {
        selectedDocuments.value.push(documentI);
    } else {
        selectedDocuments.value.splice(index, 1);
        const selectAllCheckbox: any = document.querySelector('#selectAllCheckbox');
        const allUnchecked = checkboxSelectedDocuments.value.some((checkbox: any) => !checkbox.checked);
        if (allUnchecked) {
            selectAllCheckbox.checked = false
        }
    }
};


// Seleccionar o deseleccionar todos los elementos listados dinámicamente
const SelectAllItems = () => {
    selectedDocuments.value = [];
    const checkboxes = document.querySelectorAll('.checkbox');
    const selectAllCheckbox: any = document.querySelector('#selectAllCheckbox');

    checkboxes.forEach((checkbox: any) => {
        checkbox.checked = selectAllCheckbox.checked;
    });

    filterDocumentDate.value.map((document: any) => {
        if(selectAllCheckbox.checked){
            toggleSelectedDocuments(document);
        }
    });
};

const sendSelectedDocuments = () => {
    // Mostrar los IDs de los documentos seleccionados
   
        if (confirm("¿Estás seguro de que deseas ejecutar esta acción?")) {
            statusSelectedDocuments.value = true;
            selectedDocuments.value.map((document: any) => {
                //console.log(JSON.parse(document.request_api), document.type_document_id, document);
                SendInvoice(JSON.parse(document.request_api), document.type_document_id, document)
            });
            statusSelectedDocuments.value = false;
            selectedDocuments.value = [];
            checkboxSelectedDocuments.value.forEach((checkbox: any) => {
                checkbox.checked = false;
            });
        } else {
            console.log("Acción cancelada");
        }
   
};

const downloadSelectedDocuemnts = async () => {
    // Mostrar los IDs de los documentos seleccionados
    if (confirm("¿Está seguro de que descargar los documento seleccionados?")) {

        const documentUrls: any[] = [];
        selectedDocuments.value.map((pdf: any) => {
            documentUrls.push(`${apiUrl}/api/download/${pdf.company_identification_number}/${pdf.pdf}`);
        });

        // Recorrer todas las URLs y descargar los documentos
        await Promise.all(documentUrls.map(url => downloadDocument(url)));

        selectedDocuments.value = [];
        checkboxSelectedDocuments.value.forEach((checkbox: any) => {
            checkbox.checked = false;
        });

    } else {
        console.log("Acción cancelada");
    }
};

// Función para descargar un documento desde una URL
const downloadDocument = async (url: any) => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const filename = getFilenameFromUrl(url);
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error al descargar el documento:', error);
    }
};

// Función para obtener el nombre de archivo de una URL
const getFilenameFromUrl = (url: any) => {
    const parts = url.split('/');
    return parts[parts.length - 1];
};

const handleFileChange = () => {
    nameFile.value = fileBulkInput.value.files[0].name;
    statuFileBulkInput.value = true;
};

const uploadBulkFile = () => {
    statuSendFileBulk.value = true;
    const file = fileBulkInput.value.files[0];
    const reader = new FileReader();
    let htmlResponse = '';
    let ListFactura = '';
    let cantSuccess = 0;
    let cantFail = 0;
    reader.onload = (event: any) => {
        const jsonData = JSON.parse(event.target.result);

        if (Object.keys(jsonData).length > 0) {

            if (jsonData['factura_masiva']) {

                const promises = jsonData['factura_masiva'].map(async (invoiceData: any) => {
                    // Configura los headers
                    const headers = {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': 'Bearer ' + invoiceData.template_token
                    };
                    let htmlHeader = 'Enviando Factura ' + invoiceData.prefix + invoiceData.number;
                    // Esto se ejecutará cuando todas las solicitudes Axios se completen
                    toast.info(htmlHeader, { autoClose: false, dangerouslyHTMLString: true, position: toast.POSITION.TOP_RIGHT, onClose: () => location.reload() }); // ToastOptions
                    // Realiza la solicitud POST con Axios
                    // return axios.post(`${apiUrl}/api/ubl2.1/invoice`, JSON.stringify(invoiceData), {
                    //     headers: headers,
                    // })
                    //     .then((response: any) => {
                    //         // const response_model = response.data;
                    //         htmlResponse += 'Factura ' + invoiceData.prefix + invoiceData.number;
                    //         // if (response_model.ResponseDian && response_model.ResponseDian.Envelope.Body.SendBillSyncResponse.SendBillSyncResult.isValid == true) {
                    //             cantSuccess++;
                    //             htmlResponse += " Enviada Exitosamente\n";
                    //         // } else {
                    //         //     cantFail++;
                    //         //     htmlResponse += " fallo\n";
                    //         // }
                    //     })
                    //     .catch((error: any) => {
                    //         console.error(error);
                    //         // Maneja errores aquí si es necesario
                    //     });

                    let { data }: any = await axios.post(`${apiUrl}/api/ubl2.1/invoice`, JSON.stringify(invoiceData), { headers: headers })

                    if (data.ResponseDian.Envelope.Body.SendBillSyncResponse.SendBillSyncResult.isValid == true) {
                        cantSuccess++;
                        ListFactura += "<b style='color:green'>Factura: " + invoiceData.prefix + invoiceData.number + " " + "Enviada Exitosamente </b>";
                        toast.success("Enviada Exitosamente" + " " + invoiceData.prefix + invoiceData.number, { autoClose: false, dangerouslyHTMLString: true, position: toast.POSITION.TOP_RIGHT, onClose: () => location.reload() }); // ToastOptions
                    } else {
                        cantFail++;
                        ListFactura += " <b style='color:red'>  Factura: " + invoiceData.prefix + invoiceData.number + " Error de envio </b>";
                        toast.error(" Error de envio" + " " + invoiceData.prefix + invoiceData.number, { autoClose: false, dangerouslyHTMLString: true, position: toast.POSITION.BOTTOM_RIGHT, onClose: () => location.reload() }); // ToastOptions
                    }


                });

                Promise.all(promises)
                    .then(() => {
                        let htmlHeader = '<b>\nFacturas exitosas ' + cantSuccess + '</b>\n';
                        htmlHeader += '<b>Facturas error ' + cantFail + '</b>\n\n';
                        // Esto se ejecutará cuando todas las solicitudes Axios se completen
                        toast(htmlHeader + htmlResponse + ListFactura, { autoClose: false, dangerouslyHTMLString: true, position: toast.POSITION.TOP_LEFT, onClose: () => location.reload() }); // ToastOptions

                    })
                    .catch(error => {
                        console.error(error);
                        // Maneja errores aquí si es necesario
                    });
            } else {
                console.log('formato txt incorrecto');
            }
        }
    };
    reader.readAsText(file);
};

function exportToCsv(filename: string, headers: any, rows: any) {
    // Crear un enlace temporal
    var link = document.createElement('a');
    if (link.download !== undefined) {
        // Crear el contenido del CSV con los títulos
        var csv = headers.join(';') + '\n'; // Agregar títulos
        rows.forEach(function (row: any) {
            csv += row.join(';') + '\n';
        });
        // Convertir el contenido del CSV a Blob
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        // Crear URL del Blob
        var url = URL.createObjectURL(blob);
        // Configurar el enlace de descarga
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        // Simular el clic en el enlace
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

const generateCsv: any = async () => {

    const USR: any = localStorage.getItem('user')
    const bytes = AES.decrypt(USR, secretKey.value);
    var dataL: any = bytes.toString(enc.Utf8);
    var model = JSON.parse(dataL)
    const { data } = await axios.post(`${firstPageLogin.value}&itemPerPage=${pagination.value.total}&aceptada=${varSelectedStatusDocument.value}&created_start=${dateValue.value.startDate} 00:00:00&created_end=${dateValue.value.endDate} 23:59:59&cliente=${varBuscadorCliente.value}&prefijo=${varBuscadorPrefix.value}&documento=${varBuscadorNormal.value}&sort_field=${sortField.value}&sort_order=${sortOrder.value}`, { email: model.email, password: model.password })

    var exportData: any[] = [];
    if (data[0] && data[0].length > 0) {
        var headers = ['Prefijo', 'Numero', 'Cufe', 'Fecha', 'Hora', 'Fecha Aceptacion', 'Resolucion', 'Nit', 'DV', 'Codigo', 'Direccion', 'Telefono','Municipio', 'Nombre','Metodo de Pago', 'Fecha de Vencimiento', 'Duracion','Nombre Producto', 'Codigo Producto', 'Precio Producto', 'Subtotal', 'Iva', 'Porcentaje'];
        const fileName = data[0][0].company_identification_number + '_' + dateValue.value.startDate + '_' + dateValue.value.endDate + '.csv';
        data[0].forEach((element: any) => {

            let request: any = {};
            if (element.request_api) {
                request = JSON.parse(element.request_api);
            }
           
            if(request.invoice_lines){

                request.invoice_lines.forEach((line: any) =>{

                    const taxes = line.tax_totals;
                    var taxAmount = 0;
                    var taxableAmount = 0;
                    var taxPercentage = 0;
                    if(taxes){
                        taxAmount = taxes[0]?.tax_amount;
                        taxableAmount = taxes[0]?.taxable_amount;
                        taxPercentage = taxes[0]?.percent;
                    }

                    exportData.push([element?.prefix, 
                                    element?.number, 
                                    element?.cufe, 
                                    request?.date, 
                                    request?.time, 
                                    element?.date_issue, 
                                    request?.resolution_number, 
                                    request.customer?.identification_number, 
                                    request.customer?.dv, 
                                    request.customer?.customer?.code, 
                                    request.customer?.address, 
                                    request.customer?.phone, 
                                    request.customer?.municipality_name, 
                                    request.customer?.name, 
                                    request.payment_form?.payment_method_name, 
                                    request.payment_form?.payment_due_date, 
                                    request.payment_form?.duration_measure,
                                    line?.description,
                                    line?.code,
                                    line?.price_amount,
                                    taxableAmount,
                                    taxAmount,
                                    taxPercentage
                                    ]);
                });
            }
        });

        exportToCsv(fileName, headers, exportData);
    }

}

const downloadJsonFile = (doc: any) => {
    if (!doc.request_api) {
        console.error("No request_api data available");
        return;
    }

    try {
        let requestApi = JSON.parse(doc.request_api);
        const formattedJson = JSON.stringify(requestApi, null, 2);
        const blob: Blob = new Blob([formattedJson], { type: 'application/json' });
        const url: string = URL.createObjectURL(blob);
        const linkElement: HTMLAnchorElement = document.createElement('a');
        linkElement.href = url;
        linkElement.download = doc.prefix + '' + doc.number + '.txt';
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error parsing JSON:", error);
        notify("Error al procesar el documento JSON");
    }
}

const sortData = (field: any) => {
    if (sortField.value === field) {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
    } else {
        sortField.value = field;
        sortOrder.value = 'asc';
    }
    getDataLogin(firstPageLogin.value);
}

// En tu <script setup>
const parseRequestApi = (requestApi: any) => {
  if (!requestApi || typeof requestApi !== 'string') {
    return {}; // Devuelve un objeto vacío si no hay datos
  }
  try {
    return JSON.parse(requestApi);
  } catch (error) {
    console.error("Error parsing request_api:", error);
    return {};
  }
};
//---------- variables computed---------------------

/**
 * variable para almacenar los datos del usuario conectado
 */

const dataLogin: any = computed({
    get() {
        return store.getterDataLogin
    },
    set(val: any) {
        store.setDataLogin(val)
    }
});
const filterDocument: any = computed(() => {
    if (DataDocument.value) {
        return DataDocument.value.filter((item: any) => {
            const searchTerm1 = varBuscadorNormal.value?.toLowerCase();
            const numberMatches = item.number.toLowerCase().includes(searchTerm1);
            const prefixMatches = item.prefix.toLowerCase().includes(searchTerm1);
            return numberMatches || prefixMatches;
        });
    }
})

const filterDocumentCliente: any = computed(() => {
    if (DataDocument.value) {
        return filterDocument.value.filter((item: any) => {
            const searchTerm = varBuscadorCliente.value?.toLowerCase();
            const clienteMatches = item.name.toLowerCase().includes(searchTerm);
            const clienteNumberMatches = item.identification_number.toLowerCase().includes(searchTerm);
            return clienteMatches || clienteNumberMatches;
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
            const documentDate = item.date_issue.substring(0, 10).toLowerCase();
            return documentDate >= startDate && documentDate <= endDate;
        });
    }
})


watch(dateValue, () => {
    getDataLogin(firstPageLogin.value)
})

watch(varSelectedStatusDocument, () => {
    selectedDocuments.value = [];
    fileBulkInput.value = [];
    nameFile.value = '';
    statuFileBulkInput.value = false
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

            OpcionesPaginas.value.push(`${axios.defaults.baseURL}/login-manejo-factura?page=${i}`);
        }


    } else {
        console.log("No se encontró ningún número después del parámetro 'page=' en la URL.");
    }
}
const getDataLogin: any = async (urlPAginate: any = null) => {
    try {

        isLoading.value = true; // Muestra el spinner

        selectedDocuments.value = [];
        checkboxSelectedDocuments.value.forEach((checkbox: any) => {
            checkbox.checked = false;
        });

        const USR: any = localStorage.getItem('user')
        const bytes = AES.decrypt(USR, secretKey.value);
        var dataL: any = bytes.toString(enc.Utf8);
        var model = JSON.parse(dataL)
        let { data } = await axios.post(`${urlPAginate}&itemPerPage=${itemPerPageSelected.value}&aceptada=${varSelectedStatusDocument.value}&created_start=${dateValue.value.startDate} 00:00:00&created_end=${dateValue.value.endDate} 23:59:59&cliente=${varBuscadorCliente.value}&prefijo=${varBuscadorPrefix.value}&documento=${varBuscadorNormal.value}&sort_field=${sortField.value}&sort_order=${sortOrder.value}`, { email: model.email, password: model.password })

        DataDocument.value = data[0]
        pagination.value = data[1]
        localStorage.setItem("token", AES.encrypt(data.user.api_token, secretKey.value).toString())
        localStorage.setItem("firstPageLogin", AES.encrypt(data[1].first_page_url, secretKey.value).toString())
        dataLogin.value = data
        OpcionesPaginas.value = [];
        GenerateOpcionDePaginas(data[1].last_page_url)
        paginaSelected.value = `${axios.defaults.baseURL}/login-manejo-factura?page=${data[1].current_page}`;


    } catch (error) {
        console.log(error)
    } finally {
        isLoading.value = false; // Oculta el spinner
    }
}
const SendMail: any = async () => {
    try {

        await axios.post('/api/ubl2.1/send-email', {
            "prefix": modelSendEmail.value.prefix,
            "number": modelSendEmail.value.number,
            "showacceptrejectbuttons": false,
            "email_cc_list": [
                {
                    "email": modelSendEmail.value.correo
                }
            ]
        })
        notify(`Correo Enviado con exito`)
        openmodal.value = false
    } catch (error) {
        console.log(error)
    }
}


const openModalSendEmail: any = (data: any) => {

    modelSendEmail.value.company_idnumber = data.company_identification_number
    modelSendEmail.value.prefix = data.prefix
    modelSendEmail.value.number = data.number

    const model: any = JSON.parse(data.client)

    modelSendEmail.value.correo = model.email

    openmodal.value = true
}
const SendInvoice: any = async (data: any, type: any, document: any) => {
     try {
        document.isSend = true;

        if (!data) {
            throw new Error("No data provided for sending invoice");
        }

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
        } else if (type == 15) {
            let dataSend = await axios.post('/api/ubl2.1/eqdoc', data)
            notify(`<p style="font-size: 9px" >${dataSend.data.message}</p><br/><p style="font-size: 9px" >${dataSend.data.ResponseDian ? dataSend.data.ResponseDian.Envelope.Body.SendBillSyncResponse.SendBillSyncResult.ErrorMessage.string : ''}</p><br/><p style="font-size: 9px" >  ${dataSend.data.ResponseDian ? dataSend.data.ResponseDian.Envelope.Body.SendBillSyncResponse.SendBillSyncResult.StatusMessage : ''}</p>`)
            document.isSend = false
        }

        getDataLogin(firstPageLogin.value)
     } catch (error) {
        toast.error('Error del servidor', { autoClose: false, dangerouslyHTMLString: true, position: toast.POSITION.TOP_RIGHT });
        statusSelectedDocuments.value = false;
        document.isSend = false;
    }
}

const notify: any = (message: any) => {

    toast.info(message, { autoClose: false, dangerouslyHTMLString: true }); // ToastOptions
}

const openModalChangeDate: any = () => {

    openmodalStatusChangeDate.value = true;
}

const sendChangeDate: any = async () => {
    try {

        const documentsId: any[] = [];
        selectedDocuments.value.map((doc: any) => {
            documentsId.push(doc.id);
        });

        let responseData = await axios.post('/api/ubl2.1/change-date', {
            "password": userPassword.value,
            "documents_id": JSON.stringify(documentsId)
        })
        notify(`<p style="font-size: 12px;" >${responseData.data.message}</p>`);
        openmodalStatusChangeDate.value = false;
        userPassword.value = '';
        setTimeout(() => {
            if (responseData.data.success) {
                location.reload();
            }
        }, 1500);

    } catch (error) {
        console.log(error)
    }
}


onMounted(async () => {
    const FP: any = localStorage.getItem('firstPageLogin')
    const bytes = AES.decrypt(FP, secretKey.value).toString(enc.Utf8);
    var decryptedText = await bytes;
    firstPageLogin.value = decryptedText
    getDataLogin(firstPageLogin.value)

})
</script>

<template>
    <section class=" px-[20px]   mx-auto  ">
        <!-- cabecera -->
        <div class="flex flex-col md:flex-row items-center w-full gap-2 ">
            <div class="w-fit">
                <select @change="getDataLogin(firstPageLogin)" id="seleccionar"
                    :class="{ 'block p-1 w-full border border-gray-500 rounded-xl bg-green-700 text-white': varSelectedStatusDocument == 'ACEPTADA', 'block  p-1 border border-gray-500 rounded-xl bg-red-700 text-white w-full ': varSelectedStatusDocument == 'POR ENVIAR' }"
                    v-model="varSelectedStatusDocument">
                    <option value="ACEPTADA" class="text-white bg-green-700">ACEPTADA</option>
                    <option value="POR ENVIAR" class="text-white bg-red-700" selected>POR ENVIAR</option>
                    <option value=" " class="bg-white text-gray" placeholder="Estado"></option>
                </select>
            </div>
            <div class="w-full md:w-1/5">
                <vue-tailwind-datepicker :formatter="formatter" v-model="dateValue"
                    class="w-full h-[30px] border border-gray-500 rounded-lg placeholder-gray-600/70" />
            </div>
            <div class="relative flex items-center w-full md:w-auto mt-1 md:mt-0">
                <span class="absolute left-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                        stroke="currentColor" class="w-5 h-5 text-gray-400 dark:text-gray-600">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                </span>
                <input @change="getDataLogin(firstPageLogin)" type="text" placeholder="Buscar por Cliente"
                    v-model="varBuscadorCliente"
                    class="block w-full h-[30px] pr-5 pl-10 text-gray-700 bg-white border border-gray-500 rounded-lg placeholder-gray-600/70 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40">
            </div>
            <div class="relative flex items-center w-full md:w-auto mt-1 md:mt-0">
                <span class="absolute left-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                        stroke="currentColor" class="w-5 h-5 text-gray-400 dark:text-gray-600">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                </span>
                <input @change="getDataLogin(firstPageLogin)" type="text" placeholder="Buscar por documento"
                    v-model="varBuscadorNormal"
                    class="block w-full h-[30px] pr-5 pl-10 text-gray-700 bg-white border border-gray-500 rounded-lg placeholder-gray-400/70 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40">
            </div>
            <svg v-if="isLoading" class="animate-spin  mr-3 h-full w-8 text-red-300 ml-5 self-center"
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
            </svg>
        </div>

        <!-- body -->
        <div class="flex flex-col ">
            <div class="-mx-4   overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                    <div class="overflow-hidden border border-gray-200 md:rounded-lg">

                        <div
                            :class="{ 'flex flex-wrap w-full gap-2': varSelectedStatusDocument == 'POR ENVIAR', 'flex flex-wrap w-full gap-2  justify-between': varSelectedStatusDocument == 'ACEPTADA' }">
                            <div class="relative flex items-center w-full md:w-2/12 ml-2 ">
                                <label>Total: $ {{ formatNumber(totalSelectedDocuments) }} {{ (selectedDocuments.length)
                        ? '(' + selectedDocuments.length + ')' : '' }}</label>
                            </div>

                            <div class="relative flex items-center w-fit "
                                v-if="selectedDocuments.length && varSelectedStatusDocument == 'POR ENVIAR'">
                                <button @click="sendSelectedDocuments"
                                    class="relative w-full md:w-30 h-6 overflow-hidden text-xs rounded-lg bg-[#2471A3] hover:bg-[#85C1E9] hover:text-white group">
                                    <span class="relative flex gap-1 px-2 text-black">
                                        <img :src="SendInvoiceIon" class="w-4 h-4 self-center" />
                                        <p class="self-center font-bold text-white group-hover:text-white">{{ statusSelectedDocuments ? 'Enviando...' : 'Enviar Seleccionados' }}</p>
                                    </span>
                                </button>
                            </div>

                            <div class="relative flex  w-fit items-center " v-if="selectedDocuments.length > 0">
                                <button @click="downloadSelectedDocuemnts"
                                    class="relative overflow-hidden text-xs rounded-lg shadow w-fit md:w-22 bg-[#2471A3] hover:bg-[#85C1E9] hover:text-white group h-6">
                                    <span class="relative flex gap-1 px-2 text-white font-bold">
                                        <img :src="FilePdfIon" class="w-4 h-4 self-center" />
                                        <p font-bold class="self-center group-hover:text-white">Descargar Seleccionados
                                        </p>
                                    </span>
                                </button>
                            </div>
                            <div class="relative flex items-center w-full md:w-2/12 my-[2px] "
                                v-if="varSelectedStatusDocument == 'ACEPTADA'">
                                <button @click="generateCsv" v-if="DataDocument?.length"
                                    class="relative w-fit md:w-30 h-6 overflow-hidden text-xs rounded-lg shadow bg-[#2471A3] hover:bg-[#85C1E9] hover:text-white group">
                                    <span class="relative flex gap-1 px-2 text-white group-hover:text-white">
                                        <img :src="CSVFile" class="w-4 h-4" />
                                        <p class="self-center font-bold">Exportar</p>
                                    </span>
                                </button>
                            </div>

                            <div class="flex w-full mt-[3px] md:w-auto min-w-[200px] max-w-[26rem] justify-between border border-solid rounded-lg border-[#979494] h-6 "
                                v-if="varSelectedStatusDocument == 'POR ENVIAR'">
                                <input id="file-upload" type="file" class="hidden" @change="handleFileChange"
                                    accept=".txt" ref="fileBulkInput" />
                                <label for="file-upload"
                                    class="rounded bg-black max-h-[90%] h-[30px] ml-1  px-4 text-center align-middle font-sans text-xs font-bold capitalize text-white cursor-pointer hover:bg-[#cecece] flex self-center">
                                    <p class="self-center">Importar archivo</p>
                                </label>
                                <label class="self-center select-none text-[11px] px-2 text-blue-600 font-bold">
                                    {{ nameFile }}
                                </label>
                            </div>

                            <div class="relative flex items-center w-full md:w-2/12 h-6 mt-[3px]"
                                v-if="statuFileBulkInput">
                                <button @click="uploadBulkFile"
                                    class="relative w-full md:w-30 h-6 overflow-hidden text-xs rounded-lg shadow bg-[#2471A3] hover:bg-[#85C1E9] hover:text-white group">
                                    <span class="relative flex gap-1 px-2 text-white group-hover:text-white">
                                        <img :src="SendInvoiceIon" class="w-4 h-4 self-center" />
                                        <p class="self-center font-bold">{{ statuSendFileBulk ? 'Enviando Facturas ...'
                        :
                        'Enviar archivo importado' }}</p>
                                    </span>
                                </button>
                            </div>

                            <div class="relative w-full md:w-auto items-center mt-[3px] "
                                v-if="varSelectedStatusDocument == 'POR ENVIAR' && selectedDocuments.length > 0">
                                <button @click.prevent="openModalChangeDate()"
                                    class="relative overflow-hidden text-xs rounded-lg shadow w-full md:w-22 bg-[#2471A3] hover:bg-[#85C1E9] hover:text-white group  h-6">
                                    <span class="relative flex gap-1 px-2 text-white font-bold">
                                        <img :src="calendarIon" class="w-5 h-5 self-center" />
                                        <p font-bold class="self-center group-hover:text-white">Cambiar Fecha</p>
                                    </span>
                                </button>
                            </div>
                        </div>

                        <table class="min-w-full divide-y divide-gray-200 ">
                            <thead class="bg-blue-700 text-[13px]">
                                <tr>
                                    <th>
                                        <div class="ml-2">
                                            <div
                                                class="relative flex items-left justify-center flex-shrink-0 w-3 h-3 bg-gray-200 rounded-lg">
                                                <input type="checkbox" class="checkbox" @change="SelectAllItems()"
                                                    id="selectAllCheckbox" ref="selectAllCheckbox">
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
                                    </th>
                                    <th scope="col" class="px-2 py-1 text-left whitespace-nowrap text-white">
                                        <div class="flex gap-1 justify-left">
                                            <img :src="calendarIon" class="self-left w-6 h-6 self-center " />
                                            <div class="flex flex-col -gap-2 " >
                                                <p class="-mb-2">
                                                    Fecha Emision  
                                                </p>
                                                <p class="text-end" >
                                                    Envio
                                                </p>
                                            </div>
                                            <button @click="sortData('date_issue')">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                                    stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                                    <path stroke-linecap="round" stroke-linejoin="round"
                                                        d="M12 4.5l4 4H8l4-4zm0 15l-4-4h8l-4 4z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </th>
                                    <th scope="col" class="px-12 py-1 font-normal text-center text-white">
                                        Cliente
                                        <button @click="sortData('customer')">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                                stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                    d="M12 4.5l4 4H8l4-4zm0 15l-4-4h8l-4 4z" />
                                            </svg>
                                        </button>
                                    </th>
                                    <th scope="col" class="px-12 py-1 font-normal text-center text-white">
                                        Documento
                                        <button @click="sortData('number')">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                                stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                    d="M12 4.5l4 4H8l4-4zm0 15l-4-4h8l-4 4z" />
                                            </svg>
                                        </button>
                                    </th>
                                    <th scope="col" class="px-4 py-1 font-normal text-center text-white">
                                        Valor documento
                                        <button @click="sortData('total')">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                                stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                    d="M12 4.5l4 4H8l4-4zm0 15l-4-4h8l-4 4z" />
                                            </svg>
                                        </button>
                                    </th>
                                    <th scope="col" class="px-12 py-1 font-normal text-center text-white">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200 text-[10px]">
                                <tr v-for="(document, d) in filterDocumentDate" :key="d" class="hover:bg-[#f3b8b0eb]">
                                    <td class="px-1 py-2 whitespace-nowrap">
                                        <div class="ml-1">
                                            <div
                                                class="relative flex items-left justify-center flex-shrink-0 w-3 h-3 bg-gray-200 rounded-sm">
                                                <input type="checkbox" class="checkbox"
                                                    @change="toggleSelectedDocuments(document)"
                                                    ref="checkboxSelectedDocuments">
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
                                    <td class="  whitespace-nowrap max-w-sm text-center ">
                                        <div class="flex  w-fit gap-1 justify-left">
                                            <div
                                                class="self-left px-1 py-1 font-bold text-blue-950 bg-blue-100 rounded">
                                                {{ parseRequestApi(document.request_api).date || 'N/A' }}
                                                <p class=" text-yellow-700  ">
                                                    {{  document.date_issue  }}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="text-center whitespace-nowrap">
                                        <div>
                                            <h4 class="font-bold text-black">{{ JSON.parse(document.client).name }}</h4>
                                            <p class="font-bold text-gray-900">{{ document.customer }}</p>
                                        </div>
                                    </td>
                                    <td class=" text-center whitespace-nowrap">
                                        <div>
                                            <p class="font-bold text-gray-900">
                                                {{ document.prefix }}{{ document.number }}<br />
                                                {{ document.type_document_id == 1 ? 'Factura venta nacional' :
                        document.type_document_id == 2 ? 'Factura Exportacion' :
                            document.type_document_id == 3 ? 'Factura contingencia' :
                                document.type_document_id == 4 ? 'Nota credito' :
                                    document.type_document_id == 5 ? 'Nota debito' :
                                        document.type_document_id == 11 ? 'Documento soporte' :
                                            document.type_document_id == 12 ? 'Factura venta tipo-04' :
                                                document.type_document_id == 13 ? 'Ajuste Documento soporte' :
                                                    '' }}
                                            </p>
                                        </div>
                                    </td>
                                    <td class="text-center whitespace-nowrap">
                                        <div>
                                            <h4 class="text-black text-[14px]">
                                                $ {{ formatNumber(document.total) }}
                                            </h4>
                                        </div>
                                    </td>
                                    <td class="py-[8px] text-center whitespace-nowrap">
                                        <div class="flex flex-wrap gap-2 justify-center">

                                            <a :href="`${apiUrl}/api/download/${document.company_identification_number}/${document.pdf}`"
                                                target="__blank">
                                                <img :src="FilePdfIon" class="w-8 h-8 self-center -mt-1 " />
                                            </a>
                                            <a :href="`${apiUrl}/api/download/${document.company_identification_number}/${document.xml}`"
                                                target="__blank">
                                                <img :src="FileXmlIon" class="w-8 h-8 self-center -mt-1 " />
                                            </a>
                                            <button @click="downloadJsonFile(document)">
                                                <img :src="FileJsonIon" class="w-8 h-8 self-center -mt-2" />
                                            </button>

                                            <div class="px-1 py-2 text-center whitespace-nowrap">
                                                <button @click.prevent="openModalSendEmail(document)"
                                                    class="relative h-6 overflow-hidden text-xs bg-white rounded-lg shadow w-fit sm:w-22 group -mt-5 ">
                                                    <div
                                                        class="absolute inset-0 w-3 bg-orange-400 transition-all duration-[250ms] ease-out group-hover:w-full">
                                                    </div>
                                                    <span
                                                        class="relative flex gap-1 px-2 text-black group-hover:text-white">
                                                        <img :src="sendMailIon" class="w-4 h-4">
                                                        <p font-bold class="self-center hidden sm:block">Correo</p>
                                                    </span>
                                                </button>
                                            </div>

                                            <div v-if="document.state_document_id == 1"
                                                :class="{ 'flex justify-center gap-1 px-2 py-1 font-normal rounded-full text-black bg-emerald-100/60 w-fit self-center -mt-2  ': document.state_document_id == 1, 'flex gap-1 px-2 py-1 font-normal rounded-full text-black bg-red-100/60 w-fit self-center ': document.state_document_id == 0 }">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                                                    viewBox="0 0 20 20" fill="#02B126">
                                                    <path
                                                        d="M9.16667 2.5L16.6667 10C17.0911 10.4745 17.0911 11.1922 16.6667 11.6667L11.6667 16.6667C11.1922 17.0911 10.4745 17.0911 10 16.6667L2.5 9.16667V5.83333C2.5 3.99238 3.99238 2.5 5.83333 2.5H9.16667"
                                                        stroke="#52525B" stroke-width="1.25" stroke-linecap="round"
                                                        stroke-linejoin="round"></path>
                                                    <circle cx="7.50004" cy="7.49967" r="1.66667" stroke="#52525B"
                                                        stroke-width="1.25" stroke-linecap="round"
                                                        stroke-linejoin="round"></circle>
                                                </svg>
                                                <p
                                                    class="text-white bg-green-700 w-fit h-fit py-[1px] px-[2px] text-xs rounded-lg">
                                                    ACEPTADA
                                                </p>
                                            </div>

                                            <div v-else class="px-1 py-2 text-center whitespace-nowrap -mt-2">
                                                <div class="relative">
                                                    <button
                                                        @click.prevent="document.request_api ? SendInvoice(parseRequestApi(document.request_api), document.type_document_id, document) : notify('No hay datos para enviar')"
                                                        :disabled="!document.request_api"
                                                        class="relative w-fit sm:w-22 h-6 overflow-hidden text-xs bg-white rounded-lg shadow group">
                                                        <div
                                                            class="absolute inset-0 w-3 bg-green-400 transition-all duration-[250ms] ease-out group-hover:w-full" />
                                                        <span
                                                            class="relative flex gap-1 px-2 text-black group-hover:text-white">
                                                            <img :src="SendInvoiceIon" class="w-4 h-4" />
                                                            <p class="self-center font-bold hidden sm:block">{{
                        document.isSend == true ? 'Enviando...' : 'Enviar' }}
                                                            </p>
                                                        </span>
                                                    </button>
                                                </div>
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
        <div class=" flex flex-col sm:flex-row sm:items-center sm:justify-between  ">
            <div class="text-sm text-gray-500">
                Reg-<span class="font-medium text-gray-700">{{ pagination.from }} al {{ pagination.to }} de {{
                        pagination.total }}</span>
            </div>
            <div class="w-full sm:w-auto max-w-sm mx-auto flex items-center ">
                <label class="mr-2">RegxPág:</label>
                <select id="seleccionar" class="block w-full px-2 border border-gray-500 rounded-lg  "
                    @change="getDataLogin(firstPageLogin)" v-model="itemPerPageSelected">
                    <option :value="pagina" class="text-white bg-green-700" v-for="(pagina, p) in varitemPerPage"
                        :key="p">
                        {{ pagina }}
                    </option>
                </select>
            </div>
            <div class="w-full sm:w-auto max-w-md mx-auto">
                <select id="seleccionar" class="block w-full px-2 border border-gray-500 rounded-lg"
                    @change="getDataLogin(paginaSelected)" v-model="paginaSelected">
                    <option :value="pagina" class="text-white bg-green-700" v-for="(pagina, p) in OpcionesPaginas"
                        :key="p">
                        Pagina {{ p + 1 }}
                    </option>
                </select>
            </div>
            <div class="flex justify-end items-center mt-4 gap-x-2 sm:mt-0 w-full sm:w-auto">
                <button @click.prevent="getDataLogin(pagination.first_page_url)"
                    :disabled="pagination.prev_page_url == null"
                    class="flex items-center justify-center w-8 h-8 text-sm transition-colors duration-200 bg-white border rounded-full hover:bg-gray-100 disabled:opacity-50"
                    title="Primera Pagina">
                    <img :src="FirstPageIon" class="w-8 h-9" />
                </button>

                <button @click.prevent="getDataLogin(pagination.prev_page_url)"
                    :disabled="pagination.prev_page_url == null"
                    class="flex items-center justify-center w-8 h-8 text-sm transition-colors duration-200 bg-white border rounded-full hover:bg-gray-100 disabled:opacity-50"
                    title="Pagina Anterior">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                        stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
                    </svg>
                </button>

                <button @click.prevent="getDataLogin(pagination.next_page_url)"
                    :disabled="pagination.next_page_url == null"
                    class="flex items-center justify-center w-8 h-8 text-sm transition-colors duration-200 bg-white border rounded-full hover:bg-gray-100 disabled:opacity-50"
                    title="Pagina Siguiente">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                        stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                    </svg>
                </button>

                <button @click.prevent="getDataLogin(pagination.last_page_url)"
                    :disabled="pagination.next_page_url == null"
                    class="flex items-center justify-center w-8 h-8 text-sm transition-colors duration-200 bg-white border rounded-full hover:bg-gray-100 disabled:opacity-50"
                    title="Ultima Pagina">
                    <img :src="LastPageIon" class="w-8 h-9" />
                </button>
            </div>
        </div>
        <modalComponent :show="openmodal">
            <template #title>
                <span class="absolute top-0 bottom-0 right-0 px-4 py-3 max-h-fit" @click="openmodal = false">
                    <svg class="w-6 h-6 text-red-500 fill-current" role="button" xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20">
                        <title>Close</title>
                        <path
                            d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
                    </svg>
                </span>
            </template>
            <template #content>
                <div>
                    <label class="block mb-2 font-bold" for="correo">Correo:</label>
                    <input class="w-full px-3 py-2 border rounded" placeholder="Correo de envio" type="email"
                        id="correo" v-model="modelSendEmail.correo">
                </div>
            </template>
            <template #footer>
                <DangerButtonComponent @click.prevent="SendMail">
                    enviar
                </DangerButtonComponent>
            </template>
        </modalComponent>
        <modalComponent :show="openmodalStatusChangeDate">
            <template #title>
                <span class="absolute top-0 bottom-0 right-0 px-4 py-3 max-h-fit"
                    @click="openmodalStatusChangeDate = false">
                    <svg class="w-6 h-6 text-red-500 fill-current" role="button" xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20">
                        <title>Close</title>
                        <path
                            d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
                    </svg>
                </span>
            </template>
            <template #content>
                <div>
                    <label class="block mb-2 font-bold" for="correo">Contraseña:</label>
                    <input class="w-full px-3 py-2 border rounded" placeholder="Contraseña de inicio de sesión"
                        type="password" id="user_password" v-model="userPassword">
                </div>
            </template>
            <template #footer>
                <DangerButtonComponent @click.prevent="sendChangeDate">
                    enviar
                </DangerButtonComponent>
            </template>
        </modalComponent>
    </section>
</template>
