package faculdade.ManterProcedimento.model;

import jakarta.annotation.Nullable;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import lombok.Getter;
import lombok.Setter;

import faculdade.ManterProcedimento.model.CategoriaProcedimento;

@Getter
@Setter
@Entity
public class Procedimento {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private @Nullable Integer id;
    private String nome;
    private String descricao;
    private Integer duracao;
    private Float preco;
    private Boolean ativo;

    @Enumerated(EnumType.STRING)
    private CategoriaProcedimento categoriaProcedimento;

    public Procedimento() {}

    public Procedimento(Integer id, String nome, String descricao, Integer duracao, Float preco, Boolean ativo, CategoriaProcedimento categoriaProcedimento) {
        this.id = id;
        this.nome = nome;
        this.descricao = descricao;
        this.duracao = duracao;
        this.preco = preco;
        this.ativo = ativo;
        this.categoriaProcedimento = categoriaProcedimento;
    }
}