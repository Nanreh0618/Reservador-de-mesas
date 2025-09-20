const reservas = {};
function toggleReserva(mesa) {
  if (reservas[mesa]) {
    cancelarReserva(mesa);
  } else {
    reservarMesa(mesa);
  }
}

function reservarMesa(mesa) {
  const nombre = document.getElementById("nombre").value.trim();
  const fechaInput = document.getElementById("fecha").value;
  const duracionMinutos = parseInt(document.getElementById("duracion").value);

  if (!nombre) {
    alert("Por favor ingresa tu nombre ❗");
    return;
  }
  if (!fechaInput) {
    alert("Por favor selecciona una fecha y hora ❗");
    return;
  }

  const fechaInicio = new Date(fechaInput);
  const ahora = new Date();

  if (fechaInicio <= ahora) {
    alert("La fecha y hora deben ser futuras ❗");
    return;
  }

  const fechaFin = new Date(fechaInicio.getTime() + duracionMinutos * 60000);

  if (reservas[mesa]) {
    alert(`❌ La mesa ${mesa} ya está reservada hasta ${new Date(reservas[mesa].fechaFin).toLocaleString()}`);
    return;
  }

  const historial = JSON.parse(localStorage.getItem("historial")) || [];
  const conflicto = historial.some(r => {
    if (r.mesa == mesa) {
      const inicioExistente = new Date(r.inicio);
      const finExistente = new Date(r.fin);
      return (fechaInicio < finExistente && fechaFin > inicioExistente);
    }
    return false;
  });

  if (conflicto) {
    alert("❌ No se puede reservar: el rango horario se solapa con otra reserva.");
    return;
  }

  const mesaDiv = document.getElementById(`mesa-${mesa}`);
  const img = mesaDiv.querySelector("img");
  const boton = mesaDiv.querySelector("button");

  img.src = "img/mesa-ocupada.png";
  boton.textContent = "Cancelar reserva";
  boton.classList.add("cancelar");

  const tiempoRestante = fechaFin - ahora;
  const timeout = setTimeout(() => liberarMesa(mesa), tiempoRestante);

  reservas[mesa] = { fechaFin, cliente: nombre, timeout };

  guardarReservas();
  guardarHistorial(mesa, nombre, fechaInicio, fechaFin);

  alert(`✔️ Mesa ${mesa} reservada por ${nombre} hasta ${fechaFin.toLocaleString()}`);
}

function cancelarReserva(mesa) {
  clearTimeout(reservas[mesa].timeout);
  liberarMesa(mesa);
  alert(`❌ Reserva de la mesa ${mesa} cancelada`);
}

function liberarMesa(mesa) {
  const mesaDiv = document.getElementById(`mesa-${mesa}`);
  const img = mesaDiv.querySelector("img");
  const boton = mesaDiv.querySelector("button");

  img.src = "img/mesa-disponible.png";
  boton.textContent = "Reservar";
  boton.classList.remove("cancelar");

  delete reservas[mesa];
  guardarReservas();
}

function guardarReservas() {
  const data = {};
  Object.keys(reservas).forEach(mesa => {
    data[mesa] = { fechaFin: reservas[mesa].fechaFin, cliente: reservas[mesa].cliente };
  });
  localStorage.setItem("reservas", JSON.stringify(data));
}

function guardarHistorial(mesa, cliente, inicio, fin) {
  const historial = JSON.parse(localStorage.getItem("historial")) || [];
  historial.push({ mesa, cliente, inicio: inicio.toISOString(), fin: fin.toISOString() });
  localStorage.setItem("historial", JSON.stringify(historial));
  renderHistorial();
}

function renderHistorial() {
  const historialBody = document.getElementById("historial-body");
  historialBody.innerHTML = "";
  const historial = JSON.parse(localStorage.getItem("historial")) || [];

  historial.forEach((r, index) => {
    const fila = `<tr>
      <td>${r.mesa}</td>
      <td>${r.cliente}</td>
      <td>${new Date(r.inicio).toLocaleString()}</td>
      <td>${new Date(r.fin).toLocaleString()}</td>
      <td><button class="borrarFila" onclick="borrarReservaHistorial(${index})">❌</button></td>
    </tr>`;
    historialBody.innerHTML += fila;
  });
}

function borrarReservaHistorial(index) {
  const historial = JSON.parse(localStorage.getItem("historial")) || [];
  if (confirm(`¿Seguro que quieres eliminar la reserva de ${historial[index].cliente}? ❓`)) {
    historial.splice(index, 1);
    localStorage.setItem("historial", JSON.stringify(historial));
    renderHistorial();
    alert("✔️ Reserva eliminada del historial");
  }
}

function borrarHistorial() {
  if (confirm("¿Estás seguro de borrar TODO el historial de reservas? ❓")) {
    localStorage.removeItem("historial");
    renderHistorial();
    alert("📛 Historial eliminado con éxito");
  }
}

window.onload = () => {
  const dataGuardada = localStorage.getItem("reservas");
  if (dataGuardada) {
    const data = JSON.parse(dataGuardada);
    const ahora = new Date();

    Object.keys(data).forEach(mesa => {
      const fechaFin = new Date(data[mesa].fechaFin);
      if (fechaFin > ahora) {
        const tiempoRestante = fechaFin - ahora;
        const timeout = setTimeout(() => liberarMesa(mesa), tiempoRestante);

        reservas[mesa] = { fechaFin, cliente: data[mesa].cliente, timeout };

        const mesaDiv = document.getElementById(`mesa-${mesa}`);
        const img = mesaDiv.querySelector("img");
        const boton = mesaDiv.querySelector("button");

        img.src = "img/mesa-ocupada.png";
        boton.textContent = "Cancelar reserva";
        boton.classList.add("cancelar");
      } else {
        liberarMesa(mesa);
      }
    });
  }
  renderHistorial();
};
