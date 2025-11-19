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

// unidades
const selectedBuildingLabel = document.getElementById("selected-building");
const unitForm = document.getElementById("unit-form");
const unitNameInput = document.getElementById("unit-name");
const unitTypeSelect = document.getElementById("unit-type");
const unitStatusSelect = document.getElementById("unit-status");
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
const tenantList = document.getElementById("tenant-list");

// recibos
const invoiceForm = document.getElementById("invoice-form");
const invoiceUnitLabel = document.getElementById("invoice-unit-label");
const invoiceTenantLabel = document.getElementById("invoice-tenant-label");
const invoiceMonthInput = document.getElementById("invoice-month");
const invoiceYearInput = document.getElementById("invoice-year");
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
  const elements = tenantForm.querySelectorAll("input, button");
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
  }
}

function setInvoiceFormEnabled(enabled) {
  const elements = invoiceForm.querySelectorAll("input, button, select");
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
  // mes actual por defecto
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
  invoiceMonthInput.value = currentMonth;
}

// inicializar selects de fecha
initYearSelector();

// al inicio, sin unidad
setTenantFormEnabled(false);
setInvoiceFormEnabled(false);

// ===== EDIFICIOS =====
async function cargarEdificios() {
  buildingList.innerHTML = "";

  const snapshot = await getDocs(collection(db, "buildings"));

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();

    const li = document.createElement("li");
    li.textContent = `${data.nombre} (${data.tipo}) - ${data.direccion || "Sin dirección"}`;
    li.dataset.id = docSnap.id;
    li.style.cursor = "pointer";

    li.addEventListener("click", () => {
      seleccionarEdificio(docSnap.id, data.nombre);
    });

    buildingList.appendChild(li);
  });
}

buildingForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = buildingNameInput.value.trim();
  const tipo = buildingTypeSelect.value;
  const direccion = buildingAddressInput.value.trim();

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
    creadoEn: new Date()
  });

  buildingNameInput.value = "";
  buildingAddressInput.value = "";
  await cargarEdificios();
});

function seleccionarEdificio(id, nombre) {
  selectedBuildingId = id;
  selectedBuildingName = nombre;
  selectedBuildingLabel.textContent = nombre;

  // al seleccionar un edificio, ir a la pestaña de UNIDADES
  const tabUnidades = document.getElementById("tab-unidades");
  if (tabUnidades) tabUnidades.checked = true;

  // reset unidad, inquilinos y recibos
  selectedUnitId = null;
  selectedUnitName = null;
  selectedUnitStatus = null;
  selectedUnitLabel.textContent = "Ninguna";
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
    const li = document.createElement("li");
    li.textContent = `${data.nombreUnidad} (${data.tipoUnidad}) - ${estadoTexto}`;
    li.style.cursor = "pointer";

    li.addEventListener("click", () => {
      seleccionarUnidad(docSnap.id, data.nombreUnidad, data.estado);
    });

    unitList.appendChild(li);
  });
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
    creadoEn: new Date()
  });

  unitNameInput.value = "";
  await cargarUnidades(selectedBuildingId);
});

function seleccionarUnidad(id, nombreUnidad, estado) {
  selectedUnitId = id;
  selectedUnitName = nombreUnidad;
  selectedUnitStatus = estado;

  const estadoTexto = estado === "ocupado" ? "OCUPADO" : "LIBRE";
  selectedUnitLabel.textContent = `${nombreUnidad} (${estadoTexto})`;

  // al seleccionar una unidad, ir a la pestaña de INQUILINOS
  const tabInquilinos = document.getElementById("tab-inquilinos");
  if (tabInquilinos) tabInquilinos.checked = true;

  // reset info de inquilino/recibos
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

    li.textContent =
      `${data.nombre} - DNI: ${data.documento || "N/A"} - Tel: ${data.telefono || "N/A"} ` +
      `- Inicio: ${fechaInicio} - Fin: ${fechaFin} - Alquiler: ${monto.toFixed(2)} - Estado: ${estadoText}`;

    // clic en inquilino activo -> ir a Recibos
    li.style.cursor = "pointer";
    li.addEventListener("click", () => {
      if (data.estado !== "activo") {
        alert("Solo los inquilinos activos pueden generar recibos.");
        return;
      }
      activeTenantId = docSnap.id;
      activeTenantName = data.nombre;
      invoiceTenantLabel.textContent = activeTenantName;
      setInvoiceFormEnabled(true);

      const tabRecibos = document.getElementById("tab-recibos");
      if (tabRecibos) tabRecibos.checked = true;
    });

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
    estado: "activo",
    creadoEn: new Date()
  });

  // unidad ocupada
  const unitRef = doc(db, "units", selectedUnitId);
  await updateDoc(unitRef, { estado: "ocupado" });
  selectedUnitStatus = "ocupado";
  setTenantFormEnabled(false);

  activeTenantId = docRef.id;
  activeTenantName = nombre;
  invoiceTenantLabel.textContent = nombre;
  setInvoiceFormEnabled(true);

  // Generar PDF de contrato/resumen
  generarPdfContratoInquilino({
    buildingNombre: selectedBuildingName,
    unitNombre: selectedUnitName,
    tenantNombre: nombre,
    documento,
    telefono,
    email,
    fechaInicio,
    fechaFin,
    montoAlquiler
  });

  tenantNameInput.value = "";
  tenantDocInput.value = "";
  tenantPhoneInput.value = "";
  tenantEmailInput.value = "";
  tenantStartDateInput.value = "";
  if (tenantEndDateInput) tenantEndDateInput.value = "";
  if (tenantRentInput) tenantRentInput.value = "";

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
    const total = Number(data.total || 0);
    const estado = data.estadoPago || "pendiente";
    const numero = data.numeroRecibo || id.slice(-6);

    // Texto principal
    const label = document.createElement("span");
    label.textContent = `#${numero} - ${mes}/${anio} - Total: ${total.toFixed(
      2
    )} - Estado: ${estado.toUpperCase()}`;
    li.appendChild(label);

    // Botón PDF (reimprimir siempre)
    const pdfBtn = document.createElement("button");
    pdfBtn.type = "button";
    pdfBtn.textContent = "PDF";
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

    // Botón "Marcar pagado" solo si está pendiente
    if (estado === "pendiente") {
      const payBtn = document.createElement("button");
      payBtn.type = "button";
      payBtn.textContent = "Marcar pagado";
      payBtn.addEventListener("click", async () => {
        const ok = confirm("¿Marcar este recibo como PAGADO?");
        if (!ok) return;
        await marcarReciboPagado(id);
      });
      li.appendChild(payBtn);
      li.style.color = "#b91c1c"; // rojo para pendientes
    } else {
      li.style.color = "#065f46"; // verde para pagados
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
  await cargarRecibos(selectedUnitId);
}

// generar y guardar recibo
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
  const alquiler = parseFloat(rentAmountInput.value) || 0;
  const luz = parseFloat(electricityAmountInput.value) || 0;
  const agua = parseFloat(waterAmountInput.value) || 0;
  const otros = parseFloat(otherAmountInput.value) || 0;
  const estadoPago = invoiceStatusSelect.value;

  if (!mes || !anio) {
    alert("Selecciona mes y año del recibo.");
    return;
  }

  // NO permitir doble recibo para misma unidad, mes y año
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
  const numeroRecibo = "R-" + Date.now(); // identificador simple

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
    alquiler,
    luz,
    agua,
    otros,
    total,
    estadoPago,
    creadoEn: new Date()
  };

  await addDoc(collection(db, "invoices"), invoiceData);

  // generar PDF profesional
  generarPdfRecibo(invoiceData);

  // limpiar importes, pero mantener mes/año
  rentAmountInput.value = 0;
  electricityAmountInput.value = 0;
  waterAmountInput.value = 0;
  otherAmountInput.value = 0;
  invoiceStatusSelect.value = "pendiente";

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

  // encabezado
  docPdf.setFont("helvetica", "bold");
  docPdf.setFontSize(18);
  docPdf.text("CONTRATO DE ALQUILER - RESUMEN", 105, 20, { align: "center" });

  docPdf.setFontSize(11);
  docPdf.setFont("helvetica", "normal");
  docPdf.text(`Fecha de emisión: ${fechaStr}`, 10, 30);

  docPdf.line(10, 33, 200, 33);

  let y = 40;

  // Inmueble y unidad
  docPdf.setFont("helvetica", "bold");
  docPdf.text("Datos del inmueble", 10, y);
  y += 6;
  docPdf.setFont("helvetica", "normal");
  docPdf.text(`Inmueble: ${data.buildingNombre || ""}`, 12, y); y += 5;
  docPdf.text(`Unidad: ${data.unitNombre || ""}`, 12, y); y += 10;

  // Inquilino
  docPdf.setFont("helvetica", "bold");
  docPdf.text("Datos del inquilino", 10, y);
  y += 6;
  docPdf.setFont("helvetica", "normal");
  docPdf.text(`Nombre: ${data.tenantNombre || ""}`, 12, y); y += 5;
  docPdf.text(`Documento: ${data.documento || ""}`, 12, y); y += 5;
  docPdf.text(`Teléfono: ${data.telefono || ""}`, 12, y); y += 5;
  docPdf.text(`Email: ${data.email || ""}`, 12, y); y += 10;

  // Fechas y monto
  docPdf.setFont("helvetica", "bold");
  docPdf.text("Condiciones principales", 10, y);
  y += 6;
  docPdf.setFont("helvetica", "normal");
  docPdf.text(`Fecha inicio: ${formatearFechaISO(data.fechaInicio)}`, 12, y); y += 5;
  docPdf.text(`Fecha fin: ${formatearFechaISO(data.fechaFin)}`, 12, y); y += 5;
  docPdf.text(`Monto mensual de alquiler: ${Number(data.montoAlquiler || 0).toFixed(2)}`, 12, y); y += 10;

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

  // encabezado
  docPdf.setFont("helvetica", "bold");
  docPdf.setFontSize(18);
  docPdf.text("RECIBO DE ALQUILER Y SERVICIOS", 105, 20, { align: "center" });

  docPdf.setFontSize(11);
  docPdf.setFont("helvetica", "normal");
  docPdf.text(`N.º recibo: ${data.numeroRecibo}`, 10, 30);
  docPdf.text(`Fecha de emisión: ${fechaStr}`, 150, 30);

  // línea de separación
  docPdf.line(10, 33, 200, 33);

  let y = 40;

  // Datos del inmueble
  docPdf.setFont("helvetica", "bold");
  docPdf.text("Datos del inmueble", 10, y);
  y += 6;
  docPdf.setFont("helvetica", "normal");
  docPdf.text(`Inmueble: ${data.buildingNombre || ""}`, 12, y); y += 5;
  docPdf.text(`Unidad: ${data.unitNombre || ""}`, 12, y); y += 8;

  // Datos del inquilino
  docPdf.setFont("helvetica", "bold");
  docPdf.text("Datos del inquilino", 10, y);
  y += 6;
  docPdf.setFont("helvetica", "normal");
  docPdf.text(`Nombre: ${data.tenantNombre || ""}`, 12, y); y += 8;

  // Periodo
  docPdf.setFont("helvetica", "bold");
  docPdf.text("Periodo facturado", 10, y);
  y += 6;
  docPdf.setFont("helvetica", "normal");
  docPdf.text(`Mes: ${mesTexto}`, 12, y);
  docPdf.text(`Año: ${data.anio}`, 80, y);
  y += 10;

  // Detalle de importes (tipo tabla simple)
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

  // Total
  docPdf.setFont("helvetica", "bold");
  docPdf.text("TOTAL A PAGAR:", 12, y);
  docPdf.text(Number(data.total || 0).toFixed(2), 170, y, { align: "right" });
  y += 10;

  // Estado de pago
  docPdf.setFont("helvetica", "bold");
  docPdf.text("Estado de pago:", 12, y);
  docPdf.setFont("helvetica", "normal");
  docPdf.text(data.estadoPago.toUpperCase(), 60, y);
  y += 15;

  // Pie
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
