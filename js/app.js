const API_URL = 'https://script.google.com/macros/s/AKfycbzLMXyt2QHPt5KWl4ZbFYKJKaCfVD7cYkYFhNM3Zg3_qEp-yt7ksFCRP0b_7eoRpQ_O/exec';

let grafico;

/* --------- TELAS --------- */
function mostrarPagamento() {
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('telaPagamento').style.display = 'block';
  carregarCustosPagamento();
}

function mostrarDashboard() {
  document.getElementById('dashboard').style.display = 'block';
  document.getElementById('telaPagamento').style.display = 'none';
}

/* --------- DASHBOARD --------- */
async function carregarDashboard() {
  const res = await fetch(API_URL);
  const dados = await res.json();

  let total = 0;
  let pago = 0;
  let pendente = 0;

  dados.forEach(item => {
    total += Number(item.valor_total);
    pago += Number(item.valor_pago);
    pendente += Number(item.saldo);
  });

  document.getElementById('totalGeral').innerText =
    total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  document.getElementById('totalPago').innerText =
    pago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  document.getElementById('totalPendente').innerText =
    pendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  gerarGrafico(pago, pendente);
}

function gerarGrafico(pago, pendente) {
  const ctx = document.getElementById('graficoFinanceiro');

  if (grafico) grafico.destroy();

  grafico = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Pago', 'Pendente'],
      datasets: [{
        data: [pago, pendente]
      }]
    }
  });
}

/* --------- PAGAMENTO --------- */
async function carregarCustosPagamento() {
  const res = await fetch(API_URL);
  const dados = await res.json();

  const select = document.getElementById('selectCusto');
  select.innerHTML = '<option value="">Selecione um custo</option>';

  dados.filter(i => i.saldo > 0).forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.textContent = `${item.descricao} - R$ ${item.saldo}`;
    select.appendChild(opt);
  });
}

document.getElementById('formPagamento').addEventListener('submit', async e => {
  e.preventDefault();

  const payload = {
    id_custo: document.getElementById('selectCusto').value,
    valor_pago: Number(document.getElementById('valorPago').value),
    observacao: document.getElementById('obsPagamento').value
  };

  await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  alert('Pagamento registrado!');
  location.reload();
});

/* --------- INIT --------- */
document.addEventListener('DOMContentLoaded', carregarDashboard);

