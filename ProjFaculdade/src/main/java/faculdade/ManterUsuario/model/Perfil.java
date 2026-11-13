package faculdade.ManterUsuario.model;

public enum Perfil {
    ADM(1),
    PROFISSIONAL(2),
    SECRETARIA(3);

    private final Integer valor;

    Perfil(Integer valor) {
        this.valor = valor;
    }

    public Integer getValor() {
        return valor;
    }
}