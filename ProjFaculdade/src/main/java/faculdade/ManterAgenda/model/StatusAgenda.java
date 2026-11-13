package demo.ManterAgenda.model;

public enum StatusAgenda {
    AGENDADO(1),
    CONFIRMADO(2),
    CONCLUIDO(3),
    CANCELADO(4);

    private final int valor;

    StatusAgenda(int valor) {
        this.valor = valor;
    }

    public int getValor() {
        return valor;
    }
}