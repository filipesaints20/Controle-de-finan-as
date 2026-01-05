// ===============================
// CONFIG
// ===============================
const API_URL = "https://script.google.com/macros/s/AKfycbzLMXyt2QHPt5KWl4ZbFYKJKaCfVD7cYkYFhNM3Zg3_qEp-yt7ksFCRP0b_7eoRpQ_O/exec";

// ===============================
// ESTADO
// ===============================
let despesas = [];
let pagamentos = [];

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  carregarDados();
  atualizarDashboard();
});

// ===============================
// NAVEGAÇÃO
// ===============================
function showPage(id, el) {
  document.querySelectorAll(".page-section").forEach(s => s.classList.remove("active-section"));
  document.getElementById(id).classList.add("active-section");

  if (el) {
    document.querySelectorAll(".menu-item").forEach(m => m.classList.remove("active"));
    el.classList.add("active");
  }
}

// ===============================
// DESPESAS
// ===============================
const formDespesa = document.getElementById("formDespesa");
if (formDespesa) {
  formDespesa.addEventListener("submit", e => {
    e.preventDefault();

    const despesa = {
      id: Date.now(),
      descricao: desc.value,
      categoria: categoria.value,
      valor_total: Number(valorTotal.value),
      vencimento: vencimento.value,
      criado_em: new Date().toLocaleDateString("pt-BR")
    };

    despesas.push(despesa);
    salvarLocal();
    enviarParaSheet(despesa, "despesa");

    formDespesa.reset();
    atualizarTudo();
  });
}

// ===============================
// PAGAMENTOS
// ===============================
function registrarPagamento(idDespesa) {
  const valor = prompt("Valor pago:");
  if (!valor) return;

  const pagamento = {
    id: Date.now(),
    id_despesa: idDespesa,
    valor: Number(valor),
    data: new Date().toLocaleDateString("pt-BR")
  };

  pagamentos.push(pagamento);
  salvarLocal();
  enviarParaSheet(pagamento, "pagamento");
  atualizarTudo();
}

// ===============================
// DASHBOARD
// ===============================
function atualizarDashboard() {
  let totalDespesas = 0;
  let totalPago = 0;

  despesas.forEach(d => {
    totalDespesas += d.valor_total;
    totalPago += pagamentos
      .filter(p => p.id_despesa === d.id)
      .reduce((s, p) => s + p.valor, 0);
  });

  const totalPendente = totalDespesas - totalPago;

  document.getElementById("totalDespesas").innerText = moeda(totalDespesas);
  document.getElementById("totalPago").innerText = moeda(totalPago);
  document.getElementById("totalPendente").innerText = moeda(totalPendente);

  gerarGrafico(totalPago, totalPendente);
}

// ===============================
// TABELA PAGAMENTOS
// ===============================
function renderPagamentos() {
  const tbody = document.getElementById("tabelaPagamentos");
  if (!tbody) return;

  tbody.innerHTML = "";

  despesas.forEach(d => {
    const pago = pagamentos
      .filter(p => p.id_despesa === d.id)
      .reduce((s, p) => s + p.valor, 0);

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
    const despesa = despesas.find(d => d.id === p.id_despesa);

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
let chart;
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
// STORAGE
// ===============================
function salvarLocal() {
  localStorage.setItem("despesas", JSON.stringify(despesas));
  localStorage.setItem("pagamentos", JSON.stringify(pagamentos));
}

function carregarDados() {
  despesas = JSON.parse(localStorage.getItem("despesas")) || [];
  pagamentos = JSON.parse(localStorage.getItem("pagamentos")) || [];
}

// ===============================
// GOOGLE SHEETS
// ===============================
function enviarParaSheet(obj, tipo) {
  if (!API_URL.includes("script.google")) return;

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tipo, ...obj })
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
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
