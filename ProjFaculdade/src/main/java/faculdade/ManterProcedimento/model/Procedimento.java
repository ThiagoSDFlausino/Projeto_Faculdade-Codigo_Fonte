package demo.ManterProcedimento.model;

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
public class Procedimento {
    private Integer id;
    private String nome;
    private String descricao;
    private Integer duracao;
    private Float preco;
    private Boolean ativo;
    
   
    private categoriaProcedimento categoriaProcedimento;

    public Procedimento() {}

    public Procedimento(Integer id, String nome, String descricao, Integer duracao, Float preco, Boolean ativo, categoriaProcedimento categoriaProcedimento) {
        this.id = id;
        this.nome = nome;
        this.descricao = descricao;
        this.duracao = duracao;
        this.preco = preco;
        this.ativo = ativo;
        this.categoriaProcedimento = categoriaProcedimento;
    }
}