// server.js
// Servidor REST (Node.js + Express) - API Pública de Coleta de Resíduos Urbanos
// TDE Parte 1 - Sistemas Distribuídos 2026.2 - UNIFAN

const express = require('express');
const path = require('path');
const { bairros, ecopontos, ocorrencias, TIPOS_OCORRENCIA } = require('./dados');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Log simples de cada requisição - ajuda a demonstrar a transparência
// de acesso durante a apresentação (o cliente Python aparece aqui).
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Documentação interativa em http://localhost:3000/docs (opcional)
try {
  const swaggerUi = require('swagger-ui-express');
  const YAML = require('yamljs');
  const spec = YAML.load(path.join(__dirname, '..', 'openapi.yaml'));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));
  console.log('Swagger UI disponível em /docs');
} catch (e) {
  console.warn('Swagger UI não carregado (dependências opcionais ausentes).');
}

// ---------------------------------------------------------------------------
// Funções auxiliares
// ---------------------------------------------------------------------------

const DIAS_SEMANA = [
  'domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'
];

function somarDias(data, dias) {
  const nova = new Date(data);
  nova.setDate(nova.getDate() + dias);
  return nova;
}

function formatarData(data) {
  return data.toISOString().slice(0, 10);
}

/**
 * Calcula, a partir de hoje, quantos dias faltam para a próxima ocorrência
 * de um dos dias da semana informados. Retorna 0 quando a coleta é hoje.
 */
function proximaOcorrencia(diasSemana) {
  const hoje = new Date();
  const indiceHoje = hoje.getDay();

  for (let offset = 0; offset < 8; offset++) {
    const nomeDia = DIAS_SEMANA[(indiceHoje + offset) % 7];
    if (diasSemana.includes(nomeDia)) {
      return { dias_restantes: offset, data: formatarData(somarDias(hoje, offset)) };
    }
  }
  return null;
}

function montarDetalhe(config) {
  const proxima = proximaOcorrencia(config.dias);
  return {
    dias_semana: config.dias,
    turno: config.turno,
    proxima_coleta: proxima ? proxima.data : null,
    dias_restantes: proxima ? proxima.dias_restantes : null
  };
}

function buscarBairro(id) {
  return bairros.find((b) => b.id_bairro.toUpperCase() === String(id).toUpperCase());
}

function erro404(res, mensagem) {
  return res.status(404).json({ erro: 'NAO_ENCONTRADO', mensagem });
}

function publicoBairro(b) {
  return {
    id_bairro: b.id_bairro,
    nome: b.nome,
    zona: b.zona,
    populacao_estimada: b.populacao_estimada,
    empresa_responsavel: b.empresa_responsavel
  };
}

// ---------------------------------------------------------------------------
// Rotas - Bairros
// ---------------------------------------------------------------------------

app.get('/bairros', (req, res) => {
  const { zona } = req.query;
  let lista = bairros;

  if (zona) {
    lista = lista.filter((b) => b.zona.toLowerCase() === String(zona).toLowerCase());
  }

  res.status(200).json({
    total: lista.length,
    bairros: lista.map(publicoBairro)
  });
});

app.get('/bairros/:id_bairro', (req, res) => {
  const bairro = buscarBairro(req.params.id_bairro);
  if (!bairro) return erro404(res, `Bairro ${req.params.id_bairro} não cadastrado.`);
  res.status(200).json(publicoBairro(bairro));
});

app.get('/bairros/:id_bairro/coleta', (req, res) => {
  const bairro = buscarBairro(req.params.id_bairro);
  if (!bairro) return erro404(res, `Bairro ${req.params.id_bairro} não cadastrado.`);

  res.status(200).json({
    id_bairro: bairro.id_bairro,
    bairro: bairro.nome,
    consultado_em: new Date().toISOString(),
    coleta_domiciliar: montarDetalhe(bairro.domiciliar),
    coleta_seletiva: montarDetalhe(bairro.seletiva)
  });
});

app.get('/bairros/:id_bairro/status', (req, res) => {
  const bairro = buscarBairro(req.params.id_bairro);
  if (!bairro) return erro404(res, `Bairro ${req.params.id_bairro} não cadastrado.`);

  const agora = new Date();
  const diaHoje = DIAS_SEMANA[agora.getDay()];
  const hora = agora.getHours();

  let tipo = 'nenhuma';
  let turno = null;

  if (bairro.domiciliar.dias.includes(diaHoje)) {
    tipo = 'domiciliar';
    turno = bairro.domiciliar.turno;
  } else if (bairro.seletiva.dias.includes(diaHoje)) {
    tipo = 'seletiva';
    turno = bairro.seletiva.turno;
  }

  // Janelas de operação por turno
  const janelas = { matutino: [6, 12], vespertino: [12, 18], noturno: [18, 23] };

  let status = 'SEM_COLETA';
  let mensagem = 'Não há coleta prevista para este bairro hoje.';

  if (tipo !== 'nenhuma') {
    const [inicio, fim] = janelas[turno];
    if (hora < inicio) {
      status = 'AGENDADA';
      mensagem = `Coleta ${tipo} prevista para o turno ${turno}. Deixe os resíduos até ${inicio}h.`;
    } else if (hora < fim) {
      status = 'EM_ROTA';
      mensagem = `Equipe em rota para a coleta ${tipo} no bairro ${bairro.nome}.`;
    } else {
      status = 'CONCLUIDA';
      mensagem = `Coleta ${tipo} do turno ${turno} já foi concluída.`;
    }
  }

  res.status(200).json({
    id_bairro: bairro.id_bairro,
    bairro: bairro.nome,
    data: formatarData(agora),
    ha_coleta_hoje: tipo !== 'nenhuma',
    tipo,
    status_operacional: status,
    mensagem
  });
});

// ---------------------------------------------------------------------------
// Rotas - Ecopontos
// ---------------------------------------------------------------------------

app.get('/ecopontos', (req, res) => {
  const { material } = req.query;
  let lista = ecopontos;

  if (material) {
    lista = lista.filter((e) =>
      e.materiais_aceitos.includes(String(material).toLowerCase())
    );
  }

  res.status(200).json({ total: lista.length, ecopontos: lista });
});

// ---------------------------------------------------------------------------
// Rotas - Ocorrências
// ---------------------------------------------------------------------------

app.post('/ocorrencias', (req, res) => {
  const { id_bairro, tipo, descricao, solicitante } = req.body || {};

  if (!id_bairro || !tipo || !descricao) {
    return res.status(400).json({
      erro: 'REQUISICAO_INVALIDA',
      mensagem: 'Os campos id_bairro, tipo e descricao são obrigatórios.'
    });
  }

  const bairro = buscarBairro(id_bairro);
  if (!bairro) {
    return res.status(400).json({
      erro: 'REQUISICAO_INVALIDA',
      mensagem: `Bairro ${id_bairro} não cadastrado.`
    });
  }

  if (!TIPOS_OCORRENCIA.includes(tipo)) {
    return res.status(400).json({
      erro: 'REQUISICAO_INVALIDA',
      mensagem: `Tipo inválido. Valores aceitos: ${TIPOS_OCORRENCIA.join(', ')}.`
    });
  }

  const sequencial = String(ocorrencias.length + 1).padStart(4, '0');
  const ocorrencia = {
    protocolo: `OC-${new Date().getFullYear()}-${sequencial}`,
    id_bairro: bairro.id_bairro,
    bairro: bairro.nome,
    tipo,
    descricao,
    solicitante: solicitante || 'Anônimo',
    status: 'ABERTA',
    registrada_em: new Date().toISOString()
  };

  ocorrencias.push(ocorrencia);
  res.status(201).json(ocorrencia);
});

app.get('/ocorrencias/:protocolo', (req, res) => {
  const protocolo = String(req.params.protocolo).toUpperCase();
  const ocorrencia = ocorrencias.find((o) => o.protocolo === protocolo);
  if (!ocorrencia) return erro404(res, `Protocolo ${protocolo} não localizado.`);
  res.status(200).json(ocorrencia);
});

// ---------------------------------------------------------------------------
// Tratamento de rota inexistente
// ---------------------------------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    erro: 'ROTA_INEXISTENTE',
    mensagem: `O recurso ${req.method} ${req.originalUrl} não existe nesta API.`
  });
});

app.listen(PORT, () => {
  console.log('==============================================');
  console.log(' API Pública de Coleta de Resíduos Urbanos');
  console.log(` Servidor Node.js ouvindo em http://localhost:${PORT}`);
  console.log('==============================================');
});
