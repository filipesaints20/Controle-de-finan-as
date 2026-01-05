const API_URL = 'https://script.google.com/macros/s/AKfycbz9XiZnpy344Fa_F6BGqqxEFYqWbskY2ThiE_MjLeJsncvJyqdfs_iDvVaS9-KQTDg0fA/exec';

function gerarGrafico(pago, pendente) {
  const ctx = document.getElementById('graficoFinanceiro');

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Pago', 'Pendente'],
      datasets: [{
        data: [pago, pendente]
      }]
    }
  });
}

async function carregarDashboard() {
  const res = await fetch(API_URL);
  const dados = await res.json();

  let total = 0;
  let pago = 0;
  let pendente = 0;

  dados.forEach(item => {
    total += Number(item.Valor_total) || 0;
    pago += Number(item.Valor_pago) || 0;
    pendente += Number(item.Saldo) || 0;
  });

  document.getElementById('totalGeral').innerText =
    total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  document.getElementById('totalPago').innerText =
    pago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  document.getElementById('totalPendente').innerText =
    pendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  gerarGrafico(pago, pendente);
}

document.addEventListener('DOMContentLoaded', carregarDashboard);


