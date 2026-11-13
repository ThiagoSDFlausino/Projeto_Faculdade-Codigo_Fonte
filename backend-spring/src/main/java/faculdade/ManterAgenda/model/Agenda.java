package faculdade.ManterAgenda.model;

import java.util.Date;

import faculdade.ManterClientes.model.Cliente;
import faculdade.ManterProcedimento.model.Procedimento;
import faculdade.ManterUsuario.model.Usuario;
import jakarta.annotation.Nullable;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.Setter;

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
    private Date dataConclusao;
    private String observacoes;

    @ManyToOne
    private Usuario profissional;

    @ManyToOne
    private Procedimento procedimento;

    @ManyToOne
    private Cliente cliente;

    @Enumerated(EnumType.STRING)
    private StatusAgenda statusAgenda;

    public Agenda() {
    }

    public Agenda(
            Integer id,
            Date dataHoraInicio,
            Date dataHoraFim,
            Float valorCobrado,
            Date dataConclusao,
            String observacoes,
            Usuario profissional,
            Cliente cliente,
            Procedimento procedimento,
            StatusAgenda statusAgenda) {

        this.id = id;
        this.dataHoraInicio = dataHoraInicio;
        this.dataHoraFim = dataHoraFim;
        this.valorCobrado = valorCobrado;
        this.dataConclusao = dataConclusao;
        this.observacoes = observacoes;
        this.profissional = profissional;
        this.cliente = cliente;
        this.procedimento = procedimento;
        this.statusAgenda = statusAgenda;
    }
}
