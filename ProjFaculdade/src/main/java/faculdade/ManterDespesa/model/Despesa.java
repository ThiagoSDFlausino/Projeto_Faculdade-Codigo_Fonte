package demo.ManterDespesa.model;

import jakarta.annotation.Nullable;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class Despesa {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private @Nullable Integer id;
    @NotBlank
    private Date data;
    private String descricao;
    @NotBlank
    private Float valor;

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