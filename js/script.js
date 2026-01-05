// ===============================
// CONFIG
// ===============================
const API_URL = "https://script.google.com/macros/s/AKfycbw7MbUY-e5RSapZ9kVNLmOQGCO4DrvCvNeVol4c4TbmV4uk4CYAAaiWOzcLpghyPBZ-ew/exec";

// ===============================
// ESTADO
// ===============================
let despesas = [];
let pagamentos = [];
let chart;

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  await carregarDadosAPI();
  atualizarTudo();
});

// ===============================
// API
// ===============================
async function carregarDadosAPI() {
  const res = await fetch(API_URL);
  const data = await res.json();

  despesas = data.despesas || [];
  pagamentos = data.pagamentos || [];
}

// ===============================
// DASHBOARD
// ===============================
function atualizarDashboard() {
  let totalDespesas = 0;
  let totalPago = 0;

  despesas.forEach(d => {
    totalDespesas += Number(d.valor_total) || 0;
  });

  pagamentos.forEach(p => {
    totalPago += Number(p.valor) || 0;
  });

  const totalPendente = totalDespesas - totalPago;

  document.getElementById("totalDespesas").innerText = moeda(totalDespesas);
  document.getElementById("totalPago").innerText = moeda(totalPago);
  document.getElementById("totalPendente").innerText = moeda(totalPendente);

  gerarGrafico(totalPago, totalPendente);
}

// ===============================
// PAGAMENTOS (REGISTRO)
// ===============================
async function registrarPagamento(idDespesa) {
  const valor = prompt("Valor pago:");
  if (!valor || isNaN(valor)) return;

  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tipo: "pagamento",
      id_despesa: idDespesa,
      valor: Number(valor)
    })
  });

  await carregarDadosAPI();
  atualizarTudo();
}

// ===============================
// TABELA DE DESPESAS
// ===============================
function renderPagamentos() {
  const tbody = document.getElementById("tabelaPagamentos");
  if (!tbody) return;

  tbody.innerHTML = "";

  despesas.forEach(d => {
    const pago = pagamentos
      .filter(p => p.id_despesa == d.id)
      .reduce((s, p) => s + Number(p.valor), 0);

    const pendente = d.valor_total - pago;

    tbody.innerHTML += `
      <tr>
        <td>${d.descricao}</td>
        <td>${moeda(d.valor_total)}</td>
        <td class="text-green">${moeda(pago)}</td>
        <td class="text-red">${moeda(pendente)}</td>
        <td>
          <button class="btn btn-primary" onclick="registrarPagamento(${d.id})">
            Pagar
          </button>
        </td>
      </tr>
    `;
  });
}

// ===============================
// HISTÓRICO
// ===============================
function renderHistorico() {
  const tbody = document.getElementById("historicoTable");
  if (!tbody) return;

  tbody.innerHTML = "";

  pagamentos.forEach(p => {
    const despesa = despesas.find(d => d.id == p.id_despesa);

    tbody.innerHTML += `
      <tr>
        <td>${p.data}</td>
        <td>${despesa?.descricao || "-"}</td>
        <td>Pagamento</td>
        <td>${moeda(p.valor)}</td>
      </tr>
    `;
  });
}

// ===============================
// GRÁFICO
// ===============================
function gerarGrafico(pago, pendente) {
  const ctx = document.getElementById("graficoFinanceiro");
  if (!ctx) return;

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Pago", "Pendente"],
      datasets: [{
        data: [pago, pendente]
      }]
    }
  });
}

// ===============================
// HELPERS
// ===============================
function atualizarTudo() {
  atualizarDashboard();
  renderPagamentos();
  renderHistorico();
}

function moeda(v) {
  return Number(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

