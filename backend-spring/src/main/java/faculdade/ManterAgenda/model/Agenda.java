package faculdade.ManterAgenda.model;

import java.util.Date;
import jakarta.annotation.Nullable;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import lombok.Getter;
import lombok.Setter;

import faculdade.ManterUsuario.model.Usuario;
import faculdade.ManterProcedimento.model.Procedimento;
import faculdade.ManterClientes.model.Cliente;
import faculdade.ManterAgenda.model.StatusAgenda;

@Getter
@Setter
@Entity

public class Agenda {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private @Nullable Integer id;
    private Date dataHoraInicio;
    private Date dataHoraFim;
    private Float valorCobrado;
    private String observacoes;

    private Usuario profissional;
    private Procedimento procedimento;
    private Cliente cliente;

    @Enumerated(EnumType.STRING)
    private StatusAgenda statusAgenda;

    public Agenda() {}

    public Agenda(Integer id, Date dataHoraInicio, Date dataHoraFim, Float valorCobrado, String observacoes, Usuario profissional, Procedimento procedimento, StatusAgenda statusAgenda) {
        this.id = id;
        this.dataHoraInicio = dataHoraInicio;
        this.dataHoraFim = dataHoraFim;
        this.valorCobrado = valorCobrado;
        this.observacoes = observacoes;
        this.profissional = profissional;
        this.cliente = cliente;
        this.procedimento = procedimento;
        this.statusAgenda = statusAgenda;
    }
}