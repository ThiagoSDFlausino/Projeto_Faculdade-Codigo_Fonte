package faculdade.ManterClientes.model;

import java.util.Date;
import java.util.List;
import jakarta.annotation.Nullable;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class Cliente {
    @Id @GeneratedValue
    private Integer id;
    private String nome;
    private String telefone;
    private String email;
    private Date dataNascimento;
    private String foto;
    private List<String> tags;
    private String observacoes;
    
    @Enumerated(EnumType.STRING)
    private StatusCliente statusCliente;

    public Cliente() {
    }

    public Cliente(Integer id, String nome, String telefone, String email, Date dataNascimento, String foto, List<String> tags, String observacoes, StatusCliente statusCliente) {
        this.id = id;
        this.nome = nome;
        this.telefone = telefone;
        this.email = email;
        this.dataNascimento = dataNascimento;
        this.foto = foto;
        this.tags = tags;
        this.observacoes = observacoes;
        this.statusCliente = statusCliente;
    }
}