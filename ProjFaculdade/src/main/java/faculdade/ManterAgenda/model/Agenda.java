package demo.ManterAgenda.model;

import java.util.Date;
import jakarta.annotation.Nullable;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import demo.ManterUsuario.model.Usuario;
import demo.ManterProcedimento.model.Procedimento;

@Getter
@Setter
@Entity

public class Agenda {
    private Integer id;
    private Date dataHoraInicio;
    private Date dataHoraFim;
    private Float valorCobrado;
    private String observacoes;

    private Usuario profissional;
    private Procedimento procedimento;
    private Cliente cliente;
    private StatusAgenda statusAgenda;

    public Agenda() {}

    public Agenda(Integer id, Date dataHoraInicio, Date dataHoraFim, Float valorCobrado, String observacoes, Usuario profissional, Procedimento procedimento, StatusAgenda statusAgenda) {
        this.id = id;
        this.dataHoraInicio = dataHoraInicio;
        this.dataHoraFim = dataHoraFim;
        this.valorCobrado = valorCobrado;
        this.observacoes = observacoes;
        this.profissional = profissional;
        this.procedimento = procedimento;
        this.statusAgenda = statusAgenda;
    }
}