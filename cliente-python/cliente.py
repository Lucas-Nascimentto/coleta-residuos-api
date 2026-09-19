"""
cliente.py
Cliente de terminal (Python) que consome a API REST escrita em Node.js.

TDE Parte 1 - Sistemas Distribuidos 2026.2 - UNIFAN
Demonstra a transparencia de acesso: o cliente nao sabe (e nao precisa saber)
em qual linguagem o servidor foi escrito. O unico acoplamento entre os dois
lados e o contrato OpenAPI (openapi.yaml).
"""

import sys

import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 5  # segundos

TIPOS_OCORRENCIA = [
    "coleta_nao_realizada",
    "acumulo_irregular",
    "container_danificado",
    "descarte_entulho",
]


# ---------------------------------------------------------------------------
# Camada de acesso HTTP
# ---------------------------------------------------------------------------

def requisitar(metodo, caminho, **kwargs):
    """Executa a chamada HTTP e trata os erros de rede e de aplicacao."""
    url = f"{BASE_URL}{caminho}"
    try:
        resposta = requests.request(metodo, url, timeout=TIMEOUT, **kwargs)
    except requests.exceptions.ConnectionError:
        print("\n[ERRO] Nao foi possivel conectar ao servidor Node.js.")
        print(f"       Verifique se ele esta rodando em {BASE_URL}.")
        return None
    except requests.exceptions.Timeout:
        print("\n[ERRO] O servidor demorou demais para responder.")
        return None

    try:
        corpo = resposta.json()
    except ValueError:
        print(f"\n[ERRO] Resposta nao esta em JSON (HTTP {resposta.status_code}).")
        return None

    if resposta.status_code >= 400:
        print(f"\n[HTTP {resposta.status_code}] {corpo.get('mensagem', corpo)}")
        return None

    return corpo


# ---------------------------------------------------------------------------
# Operacoes
# ---------------------------------------------------------------------------

def listar_bairros():
    dados = requisitar("GET", "/bairros")
    if not dados:
        return

    print(f"\n--- Bairros atendidos ({dados['total']}) ---")
    print(f"{'ID':<8}{'BAIRRO':<18}{'ZONA':<10}EMPRESA")
    for bairro in dados["bairros"]:
        print(
            f"{bairro['id_bairro']:<8}"
            f"{bairro['nome']:<18}"
            f"{bairro['zona']:<10}"
            f"{bairro['empresa_responsavel']}"
        )


def consultar_coleta():
    id_bairro = input("Informe o ID do bairro (ex: BR001): ").strip()
    if not id_bairro:
        print("ID nao informado.")
        return

    dados = requisitar("GET", f"/bairros/{id_bairro}/coleta")
    if not dados:
        return

    print(f"\n--- Cronograma de {dados['bairro']} ({dados['id_bairro']}) ---")
    for rotulo, chave in (
        ("Coleta domiciliar", "coleta_domiciliar"),
        ("Coleta seletiva", "coleta_seletiva"),
    ):
        item = dados[chave]
        restantes = item["dias_restantes"]
        quando = "HOJE" if restantes == 0 else (
            "amanha" if restantes == 1 else f"em {restantes} dias"
        )
        print(f"\n{rotulo}")
        print(f"  Dias fixos    : {', '.join(item['dias_semana'])}")
        print(f"  Turno         : {item['turno']}")
        print(f"  Proxima coleta: {item['proxima_coleta']} ({quando})")


def consultar_status():
    id_bairro = input("Informe o ID do bairro (ex: BR002): ").strip()
    dados = requisitar("GET", f"/bairros/{id_bairro}/status")
    if not dados:
        return

    print(f"\n--- Status em {dados['data']} - {dados['bairro']} ---")
    print(f"  Coleta hoje : {'sim' if dados['ha_coleta_hoje'] else 'nao'}")
    print(f"  Tipo        : {dados['tipo']}")
    print(f"  Situacao    : {dados['status_operacional']}")
    print(f"  Mensagem    : {dados['mensagem']}")


def listar_ecopontos():
    material = input("Filtrar por material (enter para todos): ").strip().lower()
    params = {"material": material} if material else None

    dados = requisitar("GET", "/ecopontos", params=params)
    if not dados:
        return

    if dados["total"] == 0:
        print("\nNenhum ecoponto recebe esse material.")
        return

    print(f"\n--- Ecopontos ({dados['total']}) ---")
    for ponto in dados["ecopontos"]:
        print(f"\n[{ponto['id_ecoponto']}] {ponto['nome']}")
        print(f"  Endereco : {ponto['endereco']}")
        print(f"  Materiais: {', '.join(ponto['materiais_aceitos'])}")
        print(f"  Horario  : {ponto['horario_funcionamento']}")
        print(f"  Coords   : {ponto['latitude']}, {ponto['longitude']}")


def registrar_ocorrencia():
    id_bairro = input("ID do bairro: ").strip()

    print("\nTipos disponiveis:")
    for indice, tipo in enumerate(TIPOS_OCORRENCIA, start=1):
        print(f"  {indice}. {tipo}")
    escolha = input("Escolha o tipo (numero): ").strip()

    if not escolha.isdigit() or not 1 <= int(escolha) <= len(TIPOS_OCORRENCIA):
        print("Tipo invalido.")
        return

    corpo = {
        "id_bairro": id_bairro,
        "tipo": TIPOS_OCORRENCIA[int(escolha) - 1],
        "descricao": input("Descricao: ").strip(),
        "solicitante": input("Seu nome (enter para anonimo): ").strip() or "Anonimo",
    }

    dados = requisitar("POST", "/ocorrencias", json=corpo)
    if not dados:
        return

    print("\nOcorrencia registrada com sucesso.")
    print(f"  Protocolo : {dados['protocolo']}")
    print(f"  Bairro    : {dados['bairro']}")
    print(f"  Status    : {dados['status']}")
    print(f"  Registro  : {dados['registrada_em']}")


def consultar_ocorrencia():
    protocolo = input("Informe o protocolo (ex: OC-2026-0001): ").strip()
    dados = requisitar("GET", f"/ocorrencias/{protocolo}")
    if not dados:
        return

    print(f"\n--- Protocolo {dados['protocolo']} ---")
    print(f"  Bairro    : {dados['bairro']}")
    print(f"  Tipo      : {dados['tipo']}")
    print(f"  Descricao : {dados['descricao']}")
    print(f"  Solicitante: {dados['solicitante']}")
    print(f"  Status    : {dados['status']}")


# ---------------------------------------------------------------------------
# Menu principal
# ---------------------------------------------------------------------------

MENU = {
    "1": ("Listar bairros atendidos", listar_bairros),
    "2": ("Consultar cronograma de coleta", consultar_coleta),
    "3": ("Consultar status da coleta de hoje", consultar_status),
    "4": ("Listar ecopontos", listar_ecopontos),
    "5": ("Registrar ocorrencia", registrar_ocorrencia),
    "6": ("Consultar ocorrencia por protocolo", consultar_ocorrencia),
}


def main():
    print("=" * 52)
    print(" COLETA DE RESIDUOS URBANOS - Cliente Python")
    print(f" Servidor REST (Node.js): {BASE_URL}")
    print("=" * 52)

    while True:
        print("\nMENU")
        for chave, (rotulo, _) in MENU.items():
            print(f"  {chave}. {rotulo}")
        print("  0. Sair")

        opcao = input("\nOpcao: ").strip()

        if opcao == "0":
            print("Encerrando o cliente.")
            return

        acao = MENU.get(opcao)
        if acao is None:
            print("Opcao invalida.")
            continue

        acao[1]()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nInterrompido pelo usuario.")
        sys.exit(0)