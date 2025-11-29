/**
 * Utilitário para formatação de datas no fuso horário de Brasília (UTC-3)
 */

/**
 * Formata uma data para o fuso horário de Brasília
 * @param dateString - String da data (ISO 8601) ou objeto Date
 * @param options - Opções de formatação
 * @returns String formatada no padrão brasileiro
 */
export const formatDateBrasilia = (
  dateString: string | Date,
  options: {
    showTime?: boolean;
    showSeconds?: boolean;
    onlyTime?: boolean;
    onlyDate?: boolean;
  } = { showTime: true }
): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  // Opções de formatação para pt-BR com timezone de São Paulo
  const dateOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Sao_Paulo',
  };

  if (options.onlyTime) {
    dateOptions.hour = '2-digit';
    dateOptions.minute = '2-digit';
    if (options.showSeconds) {
      dateOptions.second = '2-digit';
    }
  } else if (options.onlyDate) {
    dateOptions.day = '2-digit';
    dateOptions.month = '2-digit';
    dateOptions.year = 'numeric';
  } else {
    dateOptions.day = '2-digit';
    dateOptions.month = '2-digit';
    dateOptions.year = 'numeric';
    if (options.showTime !== false) {
      dateOptions.hour = '2-digit';
      dateOptions.minute = '2-digit';
      if (options.showSeconds) {
        dateOptions.second = '2-digit';
      }
    }
  }

  return date.toLocaleString('pt-BR', dateOptions);
};

/**
 * Formata data e hora completa (ex: "28/11/2025 às 16:57")
 */
export const formatDateTime = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  const dateFormatted = date.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const timeFormatted = date.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${dateFormatted} às ${timeFormatted}`;
};

/**
 * Formata apenas a data (ex: "28/11/2025")
 */
export const formatDate = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  return date.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Formata apenas a hora (ex: "16:57")
 */
export const formatTime = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  return date.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formata data por extenso (ex: "28 de novembro de 2025")
 */
export const formatDateLong = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  return date.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Formata data relativa (ex: "Hoje", "Ontem", "28/11/2025")
 */
export const formatDateRelative = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  
  // Ajustar para timezone de Brasília para comparação
  const dateInBrasilia = new Date(date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const nowInBrasilia = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  
  const dateOnly = new Date(dateInBrasilia.getFullYear(), dateInBrasilia.getMonth(), dateInBrasilia.getDate());
  const todayOnly = new Date(nowInBrasilia.getFullYear(), nowInBrasilia.getMonth(), nowInBrasilia.getDate());
  
  const diffTime = todayOnly.getTime() - dateOnly.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return `Hoje às ${formatTime(date)}`;
  } else if (diffDays === 1) {
    return `Ontem às ${formatTime(date)}`;
  } else if (diffDays === -1) {
    return `Amanhã às ${formatTime(date)}`;
  } else {
    return formatDateTime(date);
  }
};


