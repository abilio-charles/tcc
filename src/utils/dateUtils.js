import Holidays from 'date-holidays';

const holidays = new Holidays('BR');

export function formatarCampoData(text) {
  const numeros = text.replace(/\D/g, '').slice(0, 8);

  if (numeros.length <= 2) return numeros;
  if (numeros.length <= 4) return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;

  return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4)}`;
}

export function formatarDataBR(dataISO) {
  if (!dataISO) return '';
  return dataISO.split('-').reverse().join('/');
}

export function converterDataBRParaISO(dataBR) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dataBR)) {
    return null;
  }

  const [dia, mes, ano] = dataBR.split('/');
  return `${ano}-${mes}-${dia}`;
}

export function converterDateParaISO(date) {
  return date.toISOString().split('T')[0];
}

function criarDataLocal(dataISO) {
  return new Date(`${dataISO}T00:00:00`);
}

function dataParaISO(data) {
  return data.toISOString().split('T')[0];
}

function ehFinalDeSemana(data) {
  const diaSemana = data.getDay();
  return diaSemana === 0 || diaSemana === 6;
}

function ehFeriadoNacional(data) {
  const resultado = holidays.isHoliday(data);
  return !!resultado;
}

function ehDiaUtil(data) {
  return !ehFinalDeSemana(data) && !ehFeriadoNacional(data);
}

function avancarParaProximoDiaUtil(data) {
  const novaData = new Date(data);

  while (!ehDiaUtil(novaData)) {
    novaData.setDate(novaData.getDate() + 1);
  }

  return novaData;
}

export function calcularPrazo({
  dataInicioBR,
  prazoDias,
  incluirPrimeiroDia = false,
  tipoContagem = 'uteis',
  prorrogarSeNaoUtil = true,
}) {
  const dataInicioISO = converterDataBRParaISO(dataInicioBR);

  if (!dataInicioISO || !prazoDias) {
    return null;
  }

  let dataAtual = criarDataLocal(dataInicioISO);
  const quantidadeDias = Number(prazoDias);
  let diasContados = 0;

  if (!incluirPrimeiroDia) {
    dataAtual.setDate(dataAtual.getDate() + 1);
  }

  if (tipoContagem === 'uteis') {
    while (diasContados < quantidadeDias) {
      if (ehDiaUtil(dataAtual)) {
        diasContados += 1;
      }

      if (diasContados < quantidadeDias) {
        dataAtual.setDate(dataAtual.getDate() + 1);
      }
    }

    return dataParaISO(dataAtual);
  }

  dataAtual.setDate(dataAtual.getDate() + quantidadeDias - 1);

  if (prorrogarSeNaoUtil) {
    dataAtual = avancarParaProximoDiaUtil(dataAtual);
  }

  return dataParaISO(dataAtual);
}