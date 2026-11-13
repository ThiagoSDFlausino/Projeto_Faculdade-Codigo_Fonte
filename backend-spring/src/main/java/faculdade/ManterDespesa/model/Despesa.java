package faculdade.ManterDespesa.model;

import java.util.Date;
import jakarta.annotation.Nullable;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import faculdade.ManterUsuario.model.Usuario;
import jakarta.persistence.ManyToOne;

@Getter
@Setter
@Entity
public class Despesa {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private @Nullable Integer id;
    @NotNull
    private Date data;
    private String descricao;
    @NotNull
    private Float valor;

    @ManyToOne
    private Usuario usuario;

    public Despesa() {}

    
    public Despesa(Integer id, Date data, String descricao, Float valor, Usuario usuario) {
        this.id = id;
        this.data = data;
        this.descricao = descricao;
        this.valor = valor;
        this.usuario = usuario;
    }
}