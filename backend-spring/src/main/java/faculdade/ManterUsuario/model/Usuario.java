package faculdade.ManterUsuario.model;

import jakarta.annotation.Nullable;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.persistence.ManyToOne;
import faculdade.ManterProcedimento.model.Procedimento;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class Usuario {

	@Id
	@GeneratedValue(strategy = GenerationType.AUTO)
	private @Nullable Integer id;

	@NotBlank
	private String nome;
	@NotBlank @Email
    private String email;
	@NotBlank
	private String senha;
	private String funcao;
	@NotNull
	@Enumerated(EnumType.STRING)
	private Perfil perfil;

	@ManyToOne
	private Procedimento procedimento;
	
	public Usuario() {}
	
	public Usuario(String nome, String email, String senha, String funcao, Perfil perfil, Procedimento procedimento) {
		super();
		this.nome = nome;
		this.email = email;
		this.senha = senha;
		this.funcao = funcao;
		this.perfil = perfil;
		this.procedimento = procedimento;
	}

	public Usuario(Integer id, String nome, String email, String senha, String funcao, Perfil perfil, Procedimento procedimento) {
		super();
		this.id = id;
		this.nome = nome;
		this.email = email;
		this.senha = senha;
		this.funcao = funcao;
		this.perfil = perfil;
		this.procedimento = procedimento;
	}
	
}