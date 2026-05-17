import Holidays from 'date-holidays';

const hd = new Holidays('BR');

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
  const data = new Date(`${ano}-${mes}-${dia}T00:00:00`);

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  if (
    data.getFullYear() !== Number(ano) ||
    data.getMonth() + 1 !== Number(mes) ||
    data.getDate() !== Number(dia)
  ) {
    return null;
  }

  return `${ano}-${mes}-${dia}`;
}

export function converterISOParaDate(dataISO) {
  return new Date(`${dataISO}T00:00:00`);
}

export function converterDateParaISO(data) {
  return data.toISOString().split('T')[0];
}

export function ehFimDeSemana(data) {
  const diaSemana = data.getDay();
  return diaSemana === 0 || diaSemana === 6;
}

export function ehFeriado(data) {
  const feriados = hd.isHoliday(data);
  return !!feriados;
}

export function ehDiaUtil(data) {
  return !ehFimDeSemana(data) && !ehFeriado(data);
}

export function proximoDiaUtil(data) {
  const resultado = new Date(data);

  while (!ehDiaUtil(resultado)) {
    resultado.setDate(resultado.getDate() + 1);
  }

  return resultado;
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

  let dataAtual = converterISOParaDate(dataInicioISO);
  let diasContados = 0;
  const quantidade = Number(prazoDias);

  if (!incluirPrimeiroDia) {
    dataAtual.setDate(dataAtual.getDate() + 1);
  }

  if (tipoContagem === 'uteis') {
    while (diasContados < quantidade) {
      if (ehDiaUtil(dataAtual)) {
        diasContados += 1;
      }

      if (diasContados < quantidade) {
        dataAtual.setDate(dataAtual.getDate() + 1);
      }
    }
  } else {
    dataAtual.setDate(dataAtual.getDate() + quantidade - 1);

    if (prorrogarSeNaoUtil) {
      dataAtual = proximoDiaUtil(dataAtual);
    }
  }

  return converterDateParaISO(dataAtual);
}