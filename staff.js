import { getApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Reutilizamos la misma app Firebase inicializada en app.js
const app = getApp();
const db = getFirestore(app);

// ----- DOM -----
const staffForm = document.getElementById("staff-form");
const staffNameInput = document.getElementById("staff-name");
const staffPhoneInput = document.getElementById("staff-phone");
const staffNotesInput = document.getElementById("staff-notes");
const staffList = document.getElementById("staff-list");

const staffBuildingLabel = document.getElementById("staff-building-label");
const staffUnitLabel = document.getElementById("staff-unit-label");

const currentBuildingHidden = document.getElementById("current-building-id");
const currentUnitHidden = document.getElementById("current-unit-id");

// ===== UTILIDADES =====
function setStaffFormEnabled(enabled) {
  if (!staffForm) return;
  const elements = staffForm.querySelectorAll("input, textarea, button");
  elements.forEach((el) => {
    if (el.type !== "hidden") {
      el.disabled = !enabled;
    }
  });

  if (!enabled) {
    if (staffNameInput) staffNameInput.value = "";
    if (staffPhoneInput) staffPhoneInput.value = "";
    if (staffNotesInput) staffNotesInput.value = "";
  }
}

function mostrarMensajeSinPersonal(texto) {
  if (!staffList) return;
  staffList.innerHTML = "";
  const li = document.createElement("li");
  li.textContent = texto;
  staffList.appendChild(li);
}

// ===== CARGAR PERSONAL =====
async function cargarPersonalEdificio(buildingId) {
  if (!staffList) return;

  if (!buildingId) {
    mostrarMensajeSinPersonal("Selecciona un inmueble para ver el personal.");
    setStaffFormEnabled(false);
    return;
  }

  // Limpia lista
  staffList.innerHTML = "";

  const q = query(
    collection(db, "staffRecords"), // <--- cambia el nombre de la colección si usas otro
    where("buildingId", "==", buildingId)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    mostrarMensajeSinPersonal("No hay personal registrado para este inmueble.");
    setStaffFormEnabled(true);
    return;
  }

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;

    const nombre = data.nombre || "Sin nombre";
    const telefono = data.telefono || "Sin teléfono";
    const notas = data.notas || "";
    const activo = data.activo !== false; // por defecto true

    const li = document.createElement("li");

    // Texto principal
    const infoSpan = document.createElement("span");
    const estadoTexto = activo ? "ACTIVO" : "INACTIVO";
    infoSpan.textContent =
      `${nombre} - Tel: ${telefono} - Estado: ${estadoTexto}` +
      (notas ? ` - Notas: ${notas}` : "");
    li.appendChild(infoSpan);

    // --- Botón activar / baja con icono ---
    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = `btn btn-xs ${activo ? "btn-warning" : "btn-success"}`;
    toggleBtn.innerHTML = activo
      ? `
        <span class="material-symbols-outlined">person_off</span>
        <span class="btn-label">Baja</span>
      `
      : `
        <span class="material-symbols-outlined">person_add</span>
        <span class="btn-label">Activar</span>
      `;
    toggleBtn.addEventListener("click", async () => {
      const staffRef = doc(db, "staffRecords", id);
      await updateDoc(staffRef, { activo: !activo });
      await cargarPersonalEdificio(buildingId);
    });
    li.appendChild(toggleBtn);

    // --- Botón eliminar con icono ---
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn btn-danger btn-xs";
    deleteBtn.innerHTML = `
      <span class="material-symbols-outlined">delete</span>
      <span class="btn-label">Eliminar</span>
    `;
    deleteBtn.addEventListener("click", async () => {
      const ok = confirm(`¿Eliminar definitivamente a ${nombre}?`);
      if (!ok) return;
      const staffRef = doc(db, "staffRecords", id);
      await deleteDoc(staffRef);
      await cargarPersonalEdificio(buildingId);
    });
    li.appendChild(deleteBtn);

    staffList.appendChild(li);
  });

  setStaffFormEnabled(true);
}

// ===== ESCUCHAR CAMBIOS DESDE app.js =====

// Cuando cambia el inmueble seleccionado (hidden en app.js)
if (currentBuildingHidden) {
  currentBuildingHidden.addEventListener("change", () => {
    const buildingId = currentBuildingHidden.value;
    if (buildingId) {
      cargarPersonalEdificio(buildingId);
      setStaffFormEnabled(true);
    } else {
      mostrarMensajeSinPersonal("Selecciona un inmueble para ver el personal.");
      setStaffFormEnabled(false);
    }
  });
}

// (Opcional) Si manejas personal por unidad, puedes leer currentUnitHidden
if (currentUnitHidden && staffUnitLabel) {
  currentUnitHidden.addEventListener("change", () => {
    const unitId = currentUnitHidden.value;
    if (unitId) {
      staffUnitLabel.textContent = `Unidad seleccionada`;
    } else {
      staffUnitLabel.textContent = `Sin unidad`;
    }
  });
}

// ===== ALTA DE PERSONAL =====
if (staffForm) {
  staffForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const buildingId = currentBuildingHidden ? currentBuildingHidden.value : null;
    if (!buildingId) {
      alert("Primero selecciona un inmueble para asociar el personal.");
      return;
    }

    const nombre = staffNameInput ? staffNameInput.value.trim() : "";
    const telefono = staffPhoneInput ? staffPhoneInput.value.trim() : "";
    const notas = staffNotesInput ? staffNotesInput.value.trim() : "";

    if (!nombre) {
      alert("El nombre del personal es obligatorio.");
      return;
    }

    await addDoc(collection(db, "staffRecords"), {
      buildingId,
      nombre,
      telefono,
      notas,
      activo: true,
      creadoEn: new Date()
    });

    if (staffNameInput) staffNameInput.value = "";
    if (staffPhoneInput) staffPhoneInput.value = "";
    if (staffNotesInput) staffNotesInput.value = "";

    await cargarPersonalEdificio(buildingId);
  });
}

// Estado inicial
setStaffFormEnabled(false);
if (currentBuildingHidden && currentBuildingHidden.value) {
  cargarPersonalEdificio(currentBuildingHidden.value);
  setStaffFormEnabled(true);
} else {
  mostrarMensajeSinPersonal("Selecciona un inmueble para ver el personal.");
}
