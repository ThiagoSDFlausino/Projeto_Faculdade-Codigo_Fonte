package faculdade.ManterClientes.dto;

import java.util.Date;
import java.util.List;

import faculdade.ManterClientes.model.Cliente;
import faculdade.ManterClientes.model.StatusCliente;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ClienteDTO(
    Integer id,
    @NotBlank(message = "O nome do cliente é obrigatório!") 
    String nome,
    @NotBlank(message = "O telefone é obrigatório!") 
    String telefone,
    @Email(message = "Email inválido!")
    @NotBlank(message = "O email é obrigatório!") 
    String email,
    Date dataNascimento,
    String foto,
    List<String> tags,
    String observacoes,
    @NotNull(message = "O status do cliente é obrigatório!")
    StatusCliente statusCliente
) {

    public static ClienteDTO from(Cliente cliente) {
        return new ClienteDTO(
            cliente.getId(),
            cliente.getNome(),
            cliente.getTelefone(),
            cliente.getEmail(),
            cliente.getDataNascimento(),
            cliente.getFoto(),
            cliente.getTags(),
            cliente.getObservacoes(),
            cliente.getStatusCliente()
        );
    }
}