import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// jsPDF viene del script UMD incluido en index.html
const { jsPDF } = window.jspdf;

// CONFIGURACIÓN DE TU PROYECTO
const firebaseConfig = {
  apiKey: "AIzaSyC8rBG_X7q3b487pD0pBZtMygWX4WgVw74",
  authDomain: "gestor-inmuebles-913af.firebaseapp.com",
  projectId: "gestor-inmuebles-913af",
  storageBucket: "gestor-inmuebles-913af.firebasestorage.app",
  messagingSenderId: "1004246534204",
  appId: "1:1004246534204:web:d4be5fde3b710fc3895b39"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ----- DOM -----
// edificios
const buildingForm = document.getElementById("building-form");
const buildingNameInput = document.getElementById("building-name");
const buildingTypeSelect = document.getElementById("building-type");
const buildingAddressInput = document.getElementById("building-address");
const buildingList = document.getElementById("building-list");
const buildingWaterMeterInput = document.getElementById("building-water-meter");
const buildingInternetCodeInput = document.getElementById("building-internet-code");
const buildingInternetCompanyInput = document.getElementById("building-internet-company");
const buildingGasCodeInput = document.getElementById("building-gas-code");

// unidades
const selectedBuildingLabel = document.getElementById("selected-building");
const unitForm = document.getElementById("unit-form");
const unitNameInput = document.getElementById("unit-name");
const unitTypeSelect = document.getElementById("unit-type");
const unitStatusSelect = document.getElementById("unit-status");
const unitElectricCodeInput = document.getElementById("unit-electric-code");
const unitList = document.getElementById("unit-list");

// inquilinos
const selectedUnitLabel = document.getElementById("selected-unit");
const tenantForm = document.getElementById("tenant-form");
const tenantNameInput = document.getElementById("tenant-name");
const tenantDocInput = document.getElementById("tenant-doc");
const tenantPhoneInput = document.getElementById("tenant-phone");
const tenantEmailInput = document.getElementById("tenant-email");
const tenantStartDateInput = document.getElementById("tenant-start-date");
const tenantEndDateInput = document.getElementById("tenant-end-date");
const tenantRentInput = document.getElementById("tenant-rent");
const tenantNotesInput = document.getElementById("tenant-notes");
const tenantList = document.getElementById("tenant-list");

// recibos
const invoiceForm = document.getElementById("invoice-form");
const invoiceUnitLabel = document.getElementById("invoice-unit-label");
const invoiceTenantLabel = document.getElementById("invoice-tenant-label");
const invoiceDayInput = document.getElementById("invoice-day");
const invoiceMonthInput = document.getElementById("invoice-month");
const invoiceYearInput = document.getElementById("invoice-year");
const invoiceNotesInput = document.getElementById("invoice-notes");
const rentAmountInput = document.getElementById("rent-amount");
const electricityAmountInput = document.getElementById("electricity-amount");
const waterAmountInput = document.getElementById("water-amount");
const otherAmountInput = document.getElementById("other-amount");
const invoiceStatusSelect = document.getElementById("invoice-status");
const invoiceList = document.getElementById("invoice-list");

// ----- ESTADO GLOBAL -----
let selectedBuildingId = null;
let selectedBuildingName = null;
let selectedUnitId = null;
let selectedUnitName = null;
let selectedUnitStatus = null;
let activeTenantId = null;
let activeTenantName = null;

// ===== UTILIDADES =====
function setTenantFormEnabled(enabled) {
  const elements = tenantForm.querySelectorAll("input, button, textarea");
  elements.forEach((el) => {
    el.disabled = !enabled;
  });
  if (!enabled) {
    tenantNameInput.value = "";
    tenantDocInput.value = "";
    tenantPhoneInput.value = "";
    tenantEmailInput.value = "";
    tenantStartDateInput.value = "";
    if (tenantEndDateInput) tenantEndDateInput.value = "";
    if (tenantRentInput) tenantRentInput.value = "";
    if (tenantNotesInput) tenantNotesInput.value = "";
  }
}

function setInvoiceFormEnabled(enabled) {
  const elements = invoiceForm.querySelectorAll("input, button, select, textarea");
  elements.forEach((el) => {
    el.disabled = !enabled;
  });
}

function initYearSelector() {
  const currentYear = new Date().getFullYear();
  const start = currentYear - 1;
  const end = currentYear + 2;
  for (let y = start; y <= end; y++) {
    const opt = document.createElement("option");
    opt.value = String(y);
    opt.textContent = String(y);
    if (y === currentYear) opt.selected = true;
    invoiceYearInput.appendChild(opt);
  }
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
  if (invoiceMonthInput) {
    invoiceMonthInput.value = currentMonth;
  }
}

initYearSelector();

setTenantFormEnabled(false);
setInvoiceFormEnabled(false);

// ===== EDIFICIOS =====
async function cargarEdificios() {
  buildingList.innerHTML = "";

  const snapshot = await getDocs(collection(db, "buildings"));

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();

    const li = document.createElement("li");

    const codigoAguaTexto = data.codigoAgua ? ` - Agua: ${data.codigoAgua}` : "";
    const codigoInternetTexto = data.codigoInternet ? ` - Internet: ${data.codigoInternet}` : "";
    const codigoGasTexto = data.codigoGas ? ` - Gas: ${data.codigoGas}` : "";
    const empresaInternetTexto = data.empresaInternet ? ` - Prov: ${data.empresaInternet}` : "";

    const mainSpan = document.createElement("span");
    mainSpan.textContent =
      `${data.nombre} (${data.tipo}) - ${data.direccion || "Sin dirección"}` +
      `${codigoAguaTexto}${codigoInternetTexto}${codigoGasTexto}${empresaInternetTexto}`;
    mainSpan.style.cursor = "pointer";
    mainSpan.addEventListener("click", () => {
      seleccionarEdificio(docSnap.id, data.nombre);
    });
    li.appendChild(mainSpan);

    // Botón "Personal" con icono
    const staffBtn = document.createElement("button");
    staffBtn.type = "button";
    staffBtn.className = "btn btn-info btn-xs";
    staffBtn.innerHTML = `
      <span class="material-symbols-outlined">engineering</span>
      <span class="btn-label">Personal</span>
    `;
    staffBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      seleccionarEdificioParaPersonal(docSnap.id, data.nombre);
    });
    li.appendChild(staffBtn);

    // Botón "Editar servicios" con icono
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn btn-outline btn-xs";
    editBtn.innerHTML = `
      <span class="material-symbols-outlined">tune</span>
      <span class="btn-label">Servicios</span>
    `;
    editBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await editarEdificioServicios(docSnap.id, data);
    });
    li.appendChild(editBtn);

    buildingList.appendChild(li);
  });
}

function seleccionarEdificioParaPersonal(id, nombre) {
  selectedBuildingId = id;
  selectedBuildingName = nombre;

  if (selectedBuildingLabel) {
    selectedBuildingLabel.textContent = nombre;
  }

  const staffBuildingLabel = document.getElementById("staff-building-label");
  if (staffBuildingLabel) {
    staffBuildingLabel.textContent = nombre;
  }

  const currentBuildingHidden = document.getElementById("current-building-id");
  if (currentBuildingHidden) {
    currentBuildingHidden.value = id;
    currentBuildingHidden.dispatchEvent(new Event("change"));
  }
}

async function editarEdificioServicios(id, dataActual) {
  const nuevoCodigoAgua = prompt(
    "Código medidor de agua:",
    dataActual.codigoAgua || ""
  );
  if (nuevoCodigoAgua === null) return;

  const nuevoCodigoInternet = prompt(
    "Código internet (edificio):",
    dataActual.codigoInternet || ""
  );
  if (nuevoCodigoInternet === null) return;

  const nuevaEmpresaInternet = prompt(
    "Empresa / proveedor de internet:",
    dataActual.empresaInternet || ""
  );
  if (nuevaEmpresaInternet === null) return;

  const nuevoCodigoGas = prompt(
    "Código medidor de gas:",
    dataActual.codigoGas || ""
  );
  if (nuevoCodigoGas === null) return;

  const buildingRef = doc(db, "buildings", id);
  await updateDoc(buildingRef, {
    codigoAgua: nuevoCodigoAgua,
    codigoInternet: nuevoCodigoInternet,
    empresaInternet: nuevaEmpresaInternet,
    codigoGas: nuevoCodigoGas
  });

  await cargarEdificios();
}

buildingForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = buildingNameInput.value.trim();
  const tipo = buildingTypeSelect.value;
  const direccion = buildingAddressInput.value.trim();
  const codigoAgua = buildingWaterMeterInput
    ? buildingWaterMeterInput.value.trim()
    : "";
  const codigoInternet = buildingInternetCodeInput
    ? buildingInternetCodeInput.value.trim()
    : "";
  const empresaInternet = buildingInternetCompanyInput
    ? buildingInternetCompanyInput.value.trim()
    : "";
  const codigoGas = buildingGasCodeInput
    ? buildingGasCodeInput.value.trim()
    : "";

  if (!nombre) return;

  const nombreNormalizado = nombre.toLowerCase();
  const qDup = query(
    collection(db, "buildings"),
    where("nombreNormalizado", "==", nombreNormalizado)
  );
  const dupSnap = await getDocs(qDup);

  if (!dupSnap.empty) {
    alert("Ya existe un inmueble con ese nombre. Elige otro nombre.");
    return;
  }

  await addDoc(collection(db, "buildings"), {
    nombre,
    nombreNormalizado,
    tipo,
    direccion,
    codigoAgua,
    codigoInternet,
    empresaInternet,
    codigoGas,
    creadoEn: new Date()
  });

  buildingNameInput.value = "";
  buildingAddressInput.value = "";
  if (buildingWaterMeterInput) buildingWaterMeterInput.value = "";
  if (buildingInternetCodeInput) buildingInternetCodeInput.value = "";
  if (buildingInternetCompanyInput) buildingInternetCompanyInput.value = "";
  if (buildingGasCodeInput) buildingGasCodeInput.value = "";
  await cargarEdificios();
});

function seleccionarEdificio(id, nombre) {
  selectedBuildingId = id;
  selectedBuildingName = nombre;
  if (selectedBuildingLabel) {
    selectedBuildingLabel.textContent = nombre;
  }

  const tabUnidades = document.getElementById("tab-unidades");
  if (tabUnidades) tabUnidades.checked = true;

  selectedUnitId = null;
  selectedUnitName = null;
  selectedUnitStatus = null;
  if (selectedUnitLabel) {
    selectedUnitLabel.textContent = "Ninguna";
  }
  tenantList.innerHTML = "";
  setTenantFormEnabled(false);

  activeTenantId = null;
  activeTenantName = null;
  invoiceUnitLabel.textContent = "Ninguna";
  invoiceTenantLabel.textContent = "Ninguno";
  invoiceList.innerHTML = "";
  setInvoiceFormEnabled(false);

  cargarUnidades(id);
}

// ===== UNIDADES =====
async function cargarUnidades(buildingId) {
  unitList.innerHTML = "";

  const q = query(
    collection(db, "units"),
    where("buildingId", "==", buildingId)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    const li = document.createElement("li");
    li.textContent = "No hay unidades registradas para este inmueble.";
    unitList.appendChild(li);
    return;
  }

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const estadoTexto = data.estado === "ocupado" ? "[OCUPADO]" : "[LIBRE]";
    const codLuz = data.codigoLuz || "s/c";

    const li = document.createElement("li");

    const infoSpan = document.createElement("span");
    infoSpan.textContent =
      `${data.nombreUnidad} (${data.tipoUnidad}) - ${estadoTexto} - Luz: ${codLuz}`;
    infoSpan.style.cursor = "pointer";
    infoSpan.addEventListener("click", () => {
      seleccionarUnidad(docSnap.id, data.nombreUnidad, data.estado);
    });
    li.appendChild(infoSpan);

    // Botón "Editar" unidad con icono
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn btn-outline btn-xs";
    editBtn.innerHTML = `
      <span class="material-symbols-outlined">edit</span>
      <span class="btn-label">Editar</span>
    `;
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      editarUnidad(docSnap.id, data);
    });
    li.appendChild(editBtn);

    unitList.appendChild(li);
  });
}

async function editarUnidad(unitId, dataActual) {
  if (!selectedBuildingId) {
    alert("Primero selecciona un inmueble.");
    return;
  }

  const nuevoNombre = prompt(
    "Nuevo nombre o número de unidad:",
    dataActual.nombreUnidad || ""
  );
  if (nuevoNombre === null) return;
  const nombreTrim = nuevoNombre.trim();
  if (!nombreTrim) {
    alert("El nombre de la unidad no puede estar vacío.");
    return;
  }

  const nuevoTipo = prompt(
    "Tipo de unidad (departamento / habitacion / casa completa):",
    dataActual.tipoUnidad || ""
  );
  if (nuevoTipo === null) return;
  const tipoTrim = nuevoTipo.trim() || dataActual.tipoUnidad;

  const nuevoEstado = prompt(
    'Estado (libre / ocupado):',
    dataActual.estado || "libre"
  );
  if (nuevoEstado === null) return;
  const estadoTrim =
    (nuevoEstado.trim().toLowerCase() === "ocupado") ? "ocupado" : "libre";

  const nuevoCodLuz = prompt(
    "Código de medidor de luz:",
    dataActual.codigoLuz || ""
  );
  if (nuevoCodLuz === null) return;
  const codLuzTrim = nuevoCodLuz.trim();

  const nombreLower = nombreTrim.toLowerCase();
  if (nombreLower !== dataActual.nombreUnidadLower) {
    const qDup = query(
      collection(db, "units"),
      where("buildingId", "==", selectedBuildingId),
      where("nombreUnidadLower", "==", nombreLower)
    );
    const dupSnap = await getDocs(qDup);
    let existeOtro = false;
    dupSnap.forEach((d) => {
      if (d.id !== unitId) existeOtro = true;
    });
    if (existeOtro) {
      alert("Ya existe otra unidad con ese nombre en este inmueble.");
      return;
    }
  }

  const unitRef = doc(db, "units", unitId);
  await updateDoc(unitRef, {
    nombreUnidad: nombreTrim,
    nombreUnidadLower: nombreLower,
    tipoUnidad: tipoTrim,
    estado: estadoTrim,
    codigoLuz: codLuzTrim
  });

  if (selectedUnitId === unitId) {
    selectedUnitName = nombreTrim;
    selectedUnitStatus = estadoTrim;
    const estadoTexto = estadoTrim === "ocupado" ? "OCUPADO" : "LIBRE";
    selectedUnitLabel.textContent = `${nombreTrim} (${estadoTexto})`;
    invoiceUnitLabel.textContent = nombreTrim;
  }

  await cargarUnidades(selectedBuildingId);
}

unitForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!selectedBuildingId) {
    alert("Primero selecciona un edificio.");
    return;
  }

  const nombreUnidad = unitNameInput.value.trim();
  const tipoUnidad = unitTypeSelect.value;
  const estado = unitStatusSelect.value;
  const codigoLuz = unitElectricCodeInput
    ? unitElectricCodeInput.value.trim()
    : "";

  if (!nombreUnidad) return;

  const nombreUnidadLower = nombreUnidad.toLowerCase();
  const qDup = query(
    collection(db, "units"),
    where("buildingId", "==", selectedBuildingId),
    where("nombreUnidadLower", "==", nombreUnidadLower)
  );
  const dupSnap = await getDocs(qDup);

  if (!dupSnap.empty) {
    alert("Ya existe una unidad con ese número/nombre en este inmueble.");
    return;
  }

  await addDoc(collection(db, "units"), {
    buildingId: selectedBuildingId,
    nombreUnidad,
    nombreUnidadLower,
    tipoUnidad,
    estado,
    codigoLuz,
    creadoEn: new Date()
  });

  unitNameInput.value = "";
  if (unitElectricCodeInput) unitElectricCodeInput.value = "";
  await cargarUnidades(selectedBuildingId);
});

function seleccionarUnidad(id, nombreUnidad, estado) {
  selectedUnitId = id;
  selectedUnitName = nombreUnidad;
  selectedUnitStatus = estado;

  const estadoTexto = estado === "ocupado" ? "OCUPADO" : "LIBRE";
  selectedUnitLabel.textContent = `${nombreUnidad} (${estadoTexto})`;

  const tabInquilinos = document.getElementById("tab-inquilinos");
  if (tabInquilinos) tabInquilinos.checked = true;

  const staffUnitLabel = document.getElementById("staff-unit-label");
  if (staffUnitLabel) {
    staffUnitLabel.textContent = `${nombreUnidad} (${estadoTexto})`;
  }
  const currentUnitHidden = document.getElementById("current-unit-id");
  if (currentUnitHidden) {
    currentUnitHidden.value = id;
    currentUnitHidden.dispatchEvent(new Event("change"));
  }

  activeTenantId = null;
  activeTenantName = null;
  invoiceUnitLabel.textContent = nombreUnidad;
  invoiceTenantLabel.textContent = "Ninguno";
  invoiceList.innerHTML = "";
  setInvoiceFormEnabled(false);

  if (estado === "ocupado") {
    setTenantFormEnabled(false);
  } else {
    setTenantFormEnabled(true);
  }

  cargarInquilinos(id);
  cargarRecibos(id);
}

// ===== INQUILINOS =====
async function cargarInquilinos(unitId) {
  tenantList.innerHTML = "";

  const q = query(
    collection(db, "tenants"),
    where("unitId", "==", unitId)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    const li = document.createElement("li");
    li.textContent = "No hay inquilinos registrados para esta unidad.";
    tenantList.appendChild(li);

    selectedUnitStatus = "libre";
    setTenantFormEnabled(true);
    invoiceTenantLabel.textContent = "Ninguno";
    setInvoiceFormEnabled(false);
    return;
  }

  let hayActivo = false;
  activeTenantId = null;
  activeTenantName = null;

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const li = document.createElement("li");

    const fechaInicio = data.fechaInicio || "sin fecha inicio";
    const fechaFin = data.fechaFin || "sin fecha fin";
    const estadoText = data.estado || "N/A";
    const monto = Number(data.montoAlquiler || 0);
    const notas = data.notasContrato ? ` - Notas: ${data.notasContrato}` : "";

    const infoSpan = document.createElement("span");
    infoSpan.textContent =
      `${data.nombre} - DNI: ${data.documento || "N/A"} - Tel: ${data.telefono || "N/A"} ` +
      `- Inicio: ${fechaInicio} - Fin: ${fechaFin} - Alquiler: ${monto.toFixed(2)} - Estado: ${estadoText}${notas}`;
    li.appendChild(infoSpan);

    li.style.cursor = "pointer";
    li.addEventListener("click", () => {
      if (data.estado !== "activo") {
        alert("Solo los inquilinos activos pueden generar nuevos recibos.");
        return;
      }
      activeTenantId = docSnap.id;
      activeTenantName = data.nombre;
      invoiceTenantLabel.textContent = activeTenantName;
      setInvoiceFormEnabled(true);

      const tabRecibos = document.getElementById("tab-recibos");
      if (tabRecibos) tabRecibos.checked = true;

      cargarRecibos(unitId);
    });

    // Botón "Ver recibos" con icono
    const viewBtn = document.createElement("button");
    viewBtn.type = "button";
    viewBtn.className = "btn btn-info btn-xs";
    viewBtn.innerHTML = `
      <span class="material-symbols-outlined">receipt_long</span>
      <span class="btn-label">Recibos</span>
    `;
    viewBtn.addEventListener("click", async (event) => {
      event.stopPropagation();
      await verRecibosDeTenant(docSnap.id, data.nombre);
    });
    li.appendChild(viewBtn);

    // Botón "Editar" inquilino con icono
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn btn-outline btn-xs";
    editBtn.innerHTML = `
      <span class="material-symbols-outlined">edit</span>
      <span class="btn-label">Editar</span>
    `;
    editBtn.addEventListener("click", async (event) => {
      event.stopPropagation();
      await editarInquilino(docSnap.id, data);
    });
    li.appendChild(editBtn);

    // Botón "Rescindir contrato" con icono (solo si está activo)
    if (data.estado === "activo") {
      const rescBtn = document.createElement("button");
      rescBtn.type = "button";
      rescBtn.className = "btn btn-danger btn-xs";
      rescBtn.innerHTML = `
        <span class="material-symbols-outlined">block</span>
        <span class="btn-label">Rescindir</span>
      `;
      rescBtn.addEventListener("click", async (event) => {
        event.stopPropagation();
        const ok = confirm(
          `¿Deseas rescindir el contrato de ${data.nombre}? La unidad quedará libre y el inquilino pasará a histórico.`
        );
        if (!ok) return;
        await rescindirContrato(docSnap.id, unitId);
      });
      li.appendChild(rescBtn);
    }

    tenantList.appendChild(li);

    if (data.estado === "activo") {
      hayActivo = true;
      activeTenantId = docSnap.id;
      activeTenantName = data.nombre;
    }
  });

  if (hayActivo) {
    selectedUnitStatus = "ocupado";
    setTenantFormEnabled(false);
    invoiceTenantLabel.textContent = activeTenantName || "Inquilino activo";
    setInvoiceFormEnabled(true);
  } else {
    selectedUnitStatus = "libre";
    setTenantFormEnabled(true);
    invoiceTenantLabel.textContent = "Ninguno";
    setInvoiceFormEnabled(false);
  }
}

async function editarInquilino(tenantId, dataActual) {
  const nuevoNombre = prompt("Nombre completo:", dataActual.nombre || "");
  if (nuevoNombre === null) return;
  const nombreTrim = nuevoNombre.trim();
  if (!nombreTrim) {
    alert("El nombre no puede quedar vacío.");
    return;
  }

  const nuevoDoc = prompt("Documento / DNI:", dataActual.documento || "");
  if (nuevoDoc === null) return;
  const docTrim = nuevoDoc.trim();

  const nuevoTel = prompt("Teléfono:", dataActual.telefono || "");
  if (nuevoTel === null) return;
  const telTrim = nuevoTel.trim();

  const nuevoEmail = prompt("Email:", dataActual.email || "");
  if (nuevoEmail === null) return;
  const emailTrim = nuevoEmail.trim();

  const nuevaFechaInicio = prompt(
    "Fecha inicio (YYYY-MM-DD):",
    dataActual.fechaInicio || ""
  );
  if (nuevaFechaInicio === null) return;
  const fiTrim = nuevaFechaInicio.trim();

  const nuevaFechaFin = prompt(
    "Fecha fin (YYYY-MM-DD):",
    dataActual.fechaFin || ""
  );
  if (nuevaFechaFin === null) return;
  const ffTrim = nuevaFechaFin.trim();

  const montoStr = prompt(
    "Monto alquiler mensual:",
    dataActual.montoAlquiler != null ? String(dataActual.montoAlquiler) : ""
  );
  if (montoStr === null) return;
  const montoNum = parseFloat(montoStr);
  if (isNaN(montoNum) || montoNum <= 0) {
    alert("El monto de alquiler debe ser un número mayor a 0.");
    return;
  }

  const nuevasNotas = prompt(
    "Notas del contrato:",
    dataActual.notasContrato || ""
  );
  if (nuevasNotas === null) return;
  const notasTrim = nuevasNotas.trim();

  const tenantRef = doc(db, "tenants", tenantId);
  await updateDoc(tenantRef, {
    nombre: nombreTrim,
    documento: docTrim,
    telefono: telTrim,
    email: emailTrim,
    fechaInicio: fiTrim,
    fechaFin: ffTrim,
    montoAlquiler: montoNum,
    notasContrato: notasTrim
  });

  if (activeTenantId === tenantId) {
    activeTenantName = nombreTrim;
    invoiceTenantLabel.textContent = nombreTrim;
  }

  await cargarInquilinos(selectedUnitId);
}

async function rescindirContrato(tenantId, unitId) {
  const hoy = new Date().toISOString().slice(0, 10);

  const tenantRef = doc(db, "tenants", tenantId);
  await updateDoc(tenantRef, {
    estado: "rescendido",
    fechaFin: hoy
  });

  const unitRef = doc(db, "units", unitId);
  await updateDoc(unitRef, {
    estado: "libre"
  });

  selectedUnitStatus = "libre";
  activeTenantId = null;
  activeTenantName = null;
  invoiceTenantLabel.textContent = "Ninguno";
  setInvoiceFormEnabled(false);
  setTenantFormEnabled(true);

  await cargarInquilinos(unitId);
  await cargarUnidades(selectedBuildingId);
}

tenantForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!selectedUnitId) {
    alert("Primero selecciona una unidad.");
    return;
  }

  if (selectedUnitStatus === "ocupado") {
    alert("Esta unidad ya está ocupada. No se pueden agregar más inquilinos.");
    setTenantFormEnabled(false);
    return;
  }

  const nombre = tenantNameInput.value.trim();
  const documento = tenantDocInput.value.trim();
  const telefono = tenantPhoneInput.value.trim();
  const email = tenantEmailInput.value.trim();
  const fechaInicio = tenantStartDateInput.value;
  const fechaFin = tenantEndDateInput ? tenantEndDateInput.value : "";
  const montoAlquiler = tenantRentInput ? parseFloat(tenantRentInput.value) : NaN;
  const notasContrato = tenantNotesInput ? tenantNotesInput.value.trim() : "";

  if (!nombre || !fechaInicio || !fechaFin || isNaN(montoAlquiler)) {
    alert("Nombre, fecha inicio, fecha fin y monto de alquiler son obligatorios.");
    return;
  }

  if (montoAlquiler <= 0) {
    alert("El monto de alquiler debe ser mayor a 0.");
    return;
  }

  const qActivo = query(
    collection(db, "tenants"),
    where("unitId", "==", selectedUnitId),
    where("estado", "==", "activo")
  );
  const existingActive = await getDocs(qActivo);

  if (!existingActive.empty) {
    alert("Esta unidad ya tiene un inquilino activo.");
    selectedUnitStatus = "ocupado";
    setTenantFormEnabled(false);
    return;
  }

  const docRef = await addDoc(collection(db, "tenants"), {
    buildingId: selectedBuildingId,
    unitId: selectedUnitId,
    nombre,
    documento,
    telefono,
    email,
    fechaInicio,
    fechaFin,
    montoAlquiler,
    notasContrato,
    estado: "activo",
    creadoEn: new Date()
  });

  const unitRef = doc(db, "units", selectedUnitId);
  await updateDoc(unitRef, { estado: "ocupado" });
  selectedUnitStatus = "ocupado";
  setTenantFormEnabled(false);

  activeTenantId = docRef.id;
  activeTenantName = nombre;
  invoiceTenantLabel.textContent = nombre;
  setInvoiceFormEnabled(true);

  generarPdfContratoInquilino({
    buildingNombre: selectedBuildingName,
    unitNombre: selectedUnitName,
    tenantNombre: nombre,
    documento,
    telefono,
    email,
    fechaInicio,
    fechaFin,
    montoAlquiler,
    notasContrato
  });

  tenantNameInput.value = "";
  tenantDocInput.value = "";
  tenantPhoneInput.value = "";
  tenantEmailInput.value = "";
  tenantStartDateInput.value = "";
  if (tenantEndDateInput) tenantEndDateInput.value = "";
  if (tenantRentInput) tenantRentInput.value = "";
  if (tenantNotesInput) tenantNotesInput.value = "";

  await cargarInquilinos(selectedUnitId);
  await cargarUnidades(selectedBuildingId);
});

// ===== RECIBOS =====
async function cargarRecibos(unitId) {
  invoiceList.innerHTML = "";

  const q = query(
    collection(db, "invoices"),
    where("unitId", "==", unitId)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    const li = document.createElement("li");
    li.textContent = "No hay recibos generados para esta unidad.";
    invoiceList.appendChild(li);
    return;
  }

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;

    const li = document.createElement("li");
    const mes = data.mes || "";
    const anio = data.anio || "";
    const dia = data.dia || "";
    const total = Number(data.total || 0);
    const estado = data.estadoPago || "pendiente";
    const numero = data.numeroRecibo || id.slice(-6);
    const notasRecibo = data.notasRecibo || "";

    const label = document.createElement("span");
    const fechaTexto = dia ? `${dia}/${mes}/${anio}` : `${mes}/${anio}`;
    label.textContent = `#${numero} - ${fechaTexto} - Total: ${total.toFixed(
      2
    )} - Estado: ${estado.toUpperCase()}` + (notasRecibo ? ` - Notas: ${notasRecibo}` : "");
    li.appendChild(label);

    // Botón PDF con icono
    const pdfBtn = document.createElement("button");
    pdfBtn.type = "button";
    pdfBtn.className = "btn btn-info btn-xs";
    pdfBtn.innerHTML = `
      <span class="material-symbols-outlined">picture_as_pdf</span>
      <span class="btn-label">PDF</span>
    `;
    pdfBtn.addEventListener("click", () => {
      const invoiceForPdf = {
        buildingId: data.buildingId,
        buildingNombre: data.buildingNombre,
        unitId: data.unitId,
        unitNombre: data.unitNombre,
        tenantId: data.tenantId,
        tenantNombre: data.tenantNombre,
        numeroRecibo: numero,
        mes,
        anio,
        dia,
        notasRecibo,
        alquiler: Number(data.alquiler || 0),
        luz: Number(data.luz || 0),
        agua: Number(data.agua || 0),
        otros: Number(data.otros || 0),
        total,
        estadoPago: estado
      };
      generarPdfRecibo(invoiceForPdf);
    });
    li.appendChild(pdfBtn);

    if (estado === "pendiente") {
      // Botón "Marcar pagado" con icono
      const payBtn = document.createElement("button");
      payBtn.type = "button";
      payBtn.className = "btn btn-success btn-xs";
      payBtn.innerHTML = `
        <span class="material-symbols-outlined">paid</span>
        <span class="btn-label">Pagado</span>
      `;
      payBtn.addEventListener("click", async () => {
        const ok = confirm("¿Marcar este recibo como PAGADO?");
        if (!ok) return;
        await marcarReciboPagado(id);
      });
      li.appendChild(payBtn);
      li.style.color = "#b91c1c";
    } else {
      li.style.color = "#065f46";
    }

    invoiceList.appendChild(li);
  });
}

async function verRecibosDeTenant(tenantId, tenantNombre) {
  if (!selectedUnitId) {
    alert("Primero selecciona una unidad.");
    return;
  }

  const tabRecibos = document.getElementById("tab-recibos");
  if (tabRecibos) tabRecibos.checked = true;

  invoiceUnitLabel.textContent = selectedUnitName || "Unidad";
  invoiceTenantLabel.textContent = tenantNombre || "Inquilino";

  if (tenantId !== activeTenantId) {
    setInvoiceFormEnabled(false);
  } else {
    setInvoiceFormEnabled(true);
  }

  invoiceList.innerHTML = "";

  const q = query(
    collection(db, "invoices"),
    where("unitId", "==", selectedUnitId),
    where("tenantId", "==", tenantId)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    const li = document.createElement("li");
    li.textContent = "Este inquilino no tiene recibos registrados.";
    invoiceList.appendChild(li);
    return;
  }

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;

    const li = document.createElement("li");

    const mes = data.mes || "";
    const anio = data.anio || "";
    const dia = data.dia || "";
    const total = Number(data.total || 0);
    const estado = data.estadoPago || "pendiente";
    const numero = data.numeroRecibo || id.slice(-6);
    const notasRecibo = data.notasRecibo || "";

    const label = document.createElement("span");
    const fechaTexto = dia ? `${dia}/${mes}/${anio}` : `${mes}/${anio}`;
    label.textContent =
      `#${numero} - ${fechaTexto} - Total: ${total.toFixed(2)} - Estado: ${estado.toUpperCase()}` +
      (notasRecibo ? ` - Notas: ${notasRecibo}` : "");
    li.appendChild(label);

    // Botón PDF con icono
    const pdfBtn = document.createElement("button");
    pdfBtn.type = "button";
    pdfBtn.className = "btn btn-info btn-xs";
    pdfBtn.innerHTML = `
      <span class="material-symbols-outlined">picture_as_pdf</span>
      <span class="btn-label">PDF</span>
    `;
    pdfBtn.addEventListener("click", () => {
      const invoiceForPdf = {
        buildingId: data.buildingId,
        buildingNombre: data.buildingNombre,
        unitId: data.unitId,
        unitNombre: data.unitNombre,
        tenantId: data.tenantId,
        tenantNombre: data.tenantNombre,
        numeroRecibo: numero,
        mes,
        anio,
        dia,
        notasRecibo,
        alquiler: Number(data.alquiler || 0),
        luz: Number(data.luz || 0),
        agua: Number(data.agua || 0),
        otros: Number(data.otros || 0),
        total,
        estadoPago: estado
      };
      generarPdfRecibo(invoiceForPdf);
    });
    li.appendChild(pdfBtn);

    if (estado === "pendiente") {
      const payBtn = document.createElement("button");
      payBtn.type = "button";
      payBtn.className = "btn btn-success btn-xs";
      payBtn.innerHTML = `
        <span class="material-symbols-outlined">paid</span>
        <span class="btn-label">Pagado</span>
      `;
      payBtn.addEventListener("click", async () => {
        const ok = confirm("¿Marcar este recibo como PAGADO?");
        if (!ok) return;
        await marcarReciboPagado(id);
      });
      li.appendChild(payBtn);
      li.style.color = "#b91c1c";
    } else {
      li.style.color = "#065f46";
    }

    invoiceList.appendChild(li);
  });
}

async function marcarReciboPagado(invoiceId) {
  const invoiceRef = doc(db, "invoices", invoiceId);
  await updateDoc(invoiceRef, {
    estadoPago: "pagado",
    fechaPago: new Date()
  });
  if (selectedUnitId) {
    await cargarRecibos(selectedUnitId);
  }
}

invoiceForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!selectedUnitId || !activeTenantId) {
    alert(
      "Debes tener una unidad ocupada con un inquilino activo para generar recibos."
    );
    return;
  }

  const mes = invoiceMonthInput.value;
  const anio = invoiceYearInput.value;
  const dia = invoiceDayInput ? invoiceDayInput.value.trim() : "";
  const alquiler = parseFloat(rentAmountInput.value) || 0;
  const luz = parseFloat(electricityAmountInput.value) || 0;
  const agua = parseFloat(waterAmountInput.value) || 0;
  const otros = parseFloat(otherAmountInput.value) || 0;
  const estadoPago = invoiceStatusSelect.value;
  const notasRecibo = invoiceNotesInput ? invoiceNotesInput.value.trim() : "";

  if (!mes || !anio) {
    alert("Selecciona mes y año del recibo.");
    return;
  }

  if (dia) {
    const diaNum = parseInt(dia, 10);
    if (isNaN(diaNum) || diaNum < 1 || diaNum > 31) {
      alert("El día debe estar entre 1 y 31.");
      return;
    }
  }

  const qDup = query(
    collection(db, "invoices"),
    where("unitId", "==", selectedUnitId)
  );
  const dupSnap = await getDocs(qDup);

  let existeMismoPeriodo = false;
  dupSnap.forEach((docSnap) => {
    const d = docSnap.data();
    if (d.mes === mes && d.anio === anio) {
      existeMismoPeriodo = true;
    }
  });

  if (existeMismoPeriodo) {
    alert("Ya existe un recibo para esta unidad en ese mes y año.");
    return;
  }

  const total = alquiler + luz + agua + otros;
  const numeroRecibo = "R-" + Date.now();

  const invoiceData = {
    buildingId: selectedBuildingId,
    buildingNombre: selectedBuildingName,
    unitId: selectedUnitId,
    unitNombre: selectedUnitName,
    tenantId: activeTenantId,
    tenantNombre: activeTenantName,
    numeroRecibo,
    mes,
    anio,
    dia,
    notasRecibo,
    alquiler,
    luz,
    agua,
    otros,
    total,
    estadoPago,
    creadoEn: new Date()
  };

  await addDoc(collection(db, "invoices"), invoiceData);

  generarPdfRecibo(invoiceData);

  rentAmountInput.value = 0;
  electricityAmountInput.value = 0;
  waterAmountInput.value = 0;
  otherAmountInput.value = 0;
  invoiceStatusSelect.value = "pendiente";
  if (invoiceDayInput) invoiceDayInput.value = "";
  if (invoiceNotesInput) invoiceNotesInput.value = "";

  await cargarRecibos(selectedUnitId);
});

// ===== PDF CONTRATO INQUILINO =====
function formatearFechaISO(iso) {
  if (!iso) return "";
  const partes = iso.split("-");
  if (partes.length !== 3) return iso;
  const [y, m, d] = partes;
  return `${d}/${m}/${y}`;
}

function generarPdfContratoInquilino(data) {
  const docPdf = new jsPDF({
    unit: "mm",
    format: "a4"
  });

  const fechaEmision = new Date();
  const fechaStr = fechaEmision.toLocaleDateString("es-ES");

  docPdf.setFont("helvetica", "bold");
  docPdf.setFontSize(18);
  docPdf.text("CONTRATO DE ALQUILER - RESUMEN", 105, 20, { align: "center" });

  docPdf.setFontSize(11);
  docPdf.setFont("helvetica", "normal");
  docPdf.text(`Fecha de emisión: ${fechaStr}`, 10, 30);

  docPdf.line(10, 33, 200, 33);

  let y = 40;

  docPdf.setFont("helvetica", "bold");
  docPdf.text("Datos del inmueble", 10, y);
  y += 6;
  docPdf.setFont("helvetica", "normal");
  docPdf.text(`Inmueble: ${data.buildingNombre || ""}`, 12, y); y += 5;
  docPdf.text(`Unidad: ${data.unitNombre || ""}`, 12, y); y += 10;

  docPdf.setFont("helvetica", "bold");
  docPdf.text("Datos del inquilino", 10, y);
  y += 6;
  docPdf.setFont("helvetica", "normal");
  docPdf.text(`Nombre: ${data.tenantNombre || ""}`, 12, y); y += 5;
  docPdf.text(`Documento: ${data.documento || ""}`, 12, y); y += 5;
  docPdf.text(`Teléfono: ${data.telefono || ""}`, 12, y); y += 5;
  docPdf.text(`Email: ${data.email || ""}`, 12, y); y += 10;

  docPdf.setFont("helvetica", "bold");
  docPdf.text("Condiciones principales", 10, y);
  y += 6;
  docPdf.setFont("helvetica", "normal");
  docPdf.text(`Fecha inicio: ${formatearFechaISO(data.fechaInicio)}`, 12, y); y += 5;
  docPdf.text(`Fecha fin: ${formatearFechaISO(data.fechaFin)}`, 12, y); y += 5;
  docPdf.text(`Monto mensual de alquiler: ${Number(data.montoAlquiler || 0).toFixed(2)}`, 12, y); y += 5;

  if (data.notasContrato) {
    docPdf.text(`Notas de contrato: ${data.notasContrato}`, 12, y, { maxWidth: 180 });
    y += 10;
  } else {
    y += 5;
  }

  docPdf.setFontSize(9);
  docPdf.text(
    "Este documento constituye un resumen de las condiciones principales del contrato de alquiler celebrado entre las partes.",
    10,
    y,
    { maxWidth: 190 }
  );
  y += 12;
  docPdf.text(
    "Se recomienda conservar este documento junto al contrato completo firmado.",
    10,
    y,
    { maxWidth: 190 }
  );

  const fileName = `contrato_${(data.tenantNombre || "inquilino").replace(/\s+/g, "_")}.pdf`;
  docPdf.save(fileName);
}

// ===== PDF RECIBO =====
function generarPdfRecibo(data) {
  const docPdf = new jsPDF({
    unit: "mm",
    format: "a4"
  });

  const mesesTexto = {
    "01": "Enero", "02": "Febrero", "03": "Marzo", "04": "Abril",
    "05": "Mayo", "06": "Junio", "07": "Julio", "08": "Agosto",
    "09": "Septiembre", "10": "Octubre", "11": "Noviembre", "12": "Diciembre"
  };

  const fechaEmision = new Date();
  const fechaStr = fechaEmision.toLocaleDateString("es-ES");
  const mesTexto = mesesTexto[data.mes] || data.mes;
  const diaTexto = data.dia ? String(data.dia).padStart(2, "0") : "";

  docPdf.setFont("helvetica", "bold");
  docPdf.setFontSize(18);
  docPdf.text("RECIBO DE ALQUILER Y SERVICIOS", 105, 20, { align: "center" });

  docPdf.setFontSize(11);
  docPdf.setFont("helvetica", "normal");
  docPdf.text(`N.º recibo: ${data.numeroRecibo}`, 10, 30);
  docPdf.text(`Fecha de emisión: ${fechaStr}`, 150, 30);

  docPdf.line(10, 33, 200, 33);

  let y = 40;

  docPdf.setFont("helvetica", "bold");
  docPdf.text("Datos del inmueble", 10, y);
  y += 6;
  docPdf.setFont("helvetica", "normal");
  docPdf.text(`Inmueble: ${data.buildingNombre || ""}`, 12, y); y += 5;
  docPdf.text(`Unidad: ${data.unitNombre || ""}`, 12, y); y += 8;

  docPdf.setFont("helvetica", "bold");
  docPdf.text("Datos del inquilino", 10, y);
  y += 6;
  docPdf.setFont("helvetica", "normal");
  docPdf.text(`Nombre: ${data.tenantNombre || ""}`, 12, y); y += 8;

  docPdf.setFont("helvetica", "bold");
  docPdf.text("Periodo facturado", 10, y);
  y += 6;
  docPdf.setFont("helvetica", "normal");
  docPdf.text(`Mes: ${mesTexto}`, 12, y);
  docPdf.text(`Año: ${data.anio}`, 80, y);
  if (diaTexto) {
    y += 5;
    docPdf.text(`Día: ${diaTexto}`, 12, y);
  }
  y += 10;

  docPdf.setFont("helvetica", "bold");
  docPdf.text("Detalle de conceptos", 10, y);
  y += 6;

  docPdf.setFont("helvetica", "bold");
  docPdf.text("Concepto", 12, y);
  docPdf.text("Importe", 150, y);
  y += 5;
  docPdf.line(10, y, 200, y);
  y += 6;

  docPdf.setFont("helvetica", "normal");
  const fila = (label, value) => {
    docPdf.text(label, 12, y);
    docPdf.text(value.toFixed(2), 170, y, { align: "right" });
    y += 6;
  };

  fila("Alquiler", Number(data.alquiler || 0));
  fila("Luz", Number(data.luz || 0));
  fila("Agua", Number(data.agua || 0));
  fila("Otros", Number(data.otros || 0));

  y += 2;
  docPdf.line(10, y, 200, y);
  y += 8;

  docPdf.setFont("helvetica", "bold");
  docPdf.text("TOTAL A PAGAR:", 12, y);
  docPdf.text(Number(data.total || 0).toFixed(2), 170, y, { align: "right" });
  y += 10;

  docPdf.setFont("helvetica", "bold");
  docPdf.text("Estado de pago:", 12, y);
  docPdf.setFont("helvetica", "normal");
  docPdf.text(data.estadoPago.toUpperCase(), 60, y);
  y += 10;

  if (data.notasRecibo) {
    docPdf.setFont("helvetica", "bold");
    docPdf.text("Notas del recibo:", 10, y);
    y += 6;
    docPdf.setFont("helvetica", "normal");
    docPdf.text(data.notasRecibo, 12, y, { maxWidth: 180 });
    y += 10;
  }

  docPdf.setFontSize(9);
  docPdf.setFont("helvetica", "normal");
  docPdf.text(
    "Este documento sirve como comprobante del pago de alquiler y servicios para el periodo indicado.",
    10,
    y,
    { maxWidth: 190 }
  );

  const fileName = `recibo_${data.unitNombre || "unidad"}_${data.mes}-${data.anio}.pdf`;
  docPdf.save(fileName);
}

// cargar edificios al inicio
cargarEdificios();
