const API_URL = 'https://script.google.com/macros/s/AKfycbz1uozXvdFllDE_nAn5WFTdLsbl6UDa6L_zI64qVCXNZfHlkGPNPl_s9NvEIgk2W_An/exechttps://script.google.com/macros/s/AKfycbwFH_n3QSf0V6F9rZIQ5OHECFlPsMsRy34xThsBMCdZBJqWynXXXjDp-Gsm9j7hVxDK/exec';

async function carregarCustos() {
  const res = await fetch(API_URL);
  const dados = await res.json();

  const select = document.getElementById('custoSelect');

  dados
    .filter(item => item.saldo > 0)
    .forEach(item => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = `${item.descricao} - R$ ${item.saldo}`;
      select.appendChild(option);
    });
}

async function registrarPagamento() {
  const id_custo = document.getElementById('custoSelect').value;
  const valor_pago = Number(document.getElementById('valorPago').value);
  const observacao = document.getElementById('obs').value;

  if (!id_custo || !valor_pago) {
    alert('Preencha todos os campos');
    return;
  }

  await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id_custo,
      valor_pago,
      observacao
    })
  });

  alert('Pagamento registrado com sucesso!');
  window.location.reload();
}

document.addEventListener('DOMContentLoaded', carregarCustos);
