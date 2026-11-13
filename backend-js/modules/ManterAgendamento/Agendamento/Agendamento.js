import { StatusAgenda } from "../Enum/StatusAgenda.js";

export class Agendamento {
  constructor(data = {}) {
    this.id = data.id || "";
    this.cliente_id = data.cliente_id || "";
    this.cliente_name = data.cliente_name || "";
    this.professional_id = data.professional_id || "";
    this.professional = data.professional || "";
    this.procedure_id = data.procedure_id || "";
    this.procedure = data.procedure || "";
    this.data_hora_inicio = data.data_hora_inicio || data.datetime || "";
    this.data_hora_fim = data.data_hora_fim || "";
    this.datetime = this.data_hora_inicio;
    this.valor_cobrado = Number(data.valor_cobrado ?? data.value) || 0;
    this.value = this.valor_cobrado;
    this.observacoes = data.observacoes || data.notes || "";
    this.room = data.room || "";
    this.status = data.status || StatusAgenda.AGENDADO;
    this.created_at = data.created_at || data.createdAt || null;
  }

  toDocument() {
    return {
      id: this.id,
      cliente_id: this.cliente_id,
      cliente_name: this.cliente_name,
      professional_id: this.professional_id,
      professional: this.professional,
      procedure_id: this.procedure_id,
      procedure: this.procedure,
      data_hora_inicio: this.data_hora_inicio,
      data_hora_fim: this.data_hora_fim,
      datetime: this.data_hora_inicio,
      valor_cobrado: this.valor_cobrado,
      value: this.valor_cobrado,
      observacoes: this.observacoes,
      room: this.room,
      status: this.status,
      created_at: this.created_at,
    };
  }
}
