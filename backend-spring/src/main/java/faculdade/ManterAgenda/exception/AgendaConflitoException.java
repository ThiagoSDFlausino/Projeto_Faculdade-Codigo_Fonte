package faculdade.ManterAgenda.exception;

public class AgendaConflitoException extends RuntimeException {

    public AgendaConflitoException(String mensagem) {
        super(mensagem);
    }
}