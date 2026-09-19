// dados.js
// Base de dados simulada (in-memory). Em produção seria substituída
// por um banco de dados relacional ou NoSQL.

const bairros = [
  {
    id_bairro: 'BR001',
    nome: 'Centro',
    zona: 'Central',
    populacao_estimada: 18400,
    empresa_responsavel: 'Sustentare Saneamento',
    domiciliar: { dias: ['segunda', 'quarta', 'sexta'], turno: 'noturno' },
    seletiva: { dias: ['terca'], turno: 'matutino' }
  },
  {
    id_bairro: 'BR002',
    nome: 'Tomba',
    zona: 'Sul',
    populacao_estimada: 32100,
    empresa_responsavel: 'Sustentare Saneamento',
    domiciliar: { dias: ['terca', 'quinta', 'sabado'], turno: 'matutino' },
    seletiva: { dias: ['quarta'], turno: 'vespertino' }
  },
  {
    id_bairro: 'BR003',
    nome: 'Cidade Nova',
    zona: 'Norte',
    populacao_estimada: 27800,
    empresa_responsavel: 'Limpel Ambiental',
    domiciliar: { dias: ['segunda', 'quarta', 'sexta'], turno: 'matutino' },
    seletiva: { dias: ['sabado'], turno: 'matutino' }
  },
  {
    id_bairro: 'BR004',
    nome: 'Brasília',
    zona: 'Leste',
    populacao_estimada: 21500,
    empresa_responsavel: 'Limpel Ambiental',
    domiciliar: { dias: ['terca', 'quinta', 'sabado'], turno: 'vespertino' },
    seletiva: { dias: ['segunda'], turno: 'matutino' }
  },
  {
    id_bairro: 'BR005',
    nome: 'Santa Mônica',
    zona: 'Oeste',
    populacao_estimada: 15900,
    empresa_responsavel: 'Sustentare Saneamento',
    domiciliar: { dias: ['segunda', 'quinta'], turno: 'noturno' },
    seletiva: { dias: ['sexta'], turno: 'vespertino' }
  },
  {
    id_bairro: 'BR006',
    nome: 'Campo Limpo',
    zona: 'Norte',
    populacao_estimada: 12300,
    empresa_responsavel: 'Limpel Ambiental',
    domiciliar: { dias: ['quarta', 'sabado'], turno: 'matutino' },
    seletiva: { dias: ['quinta'], turno: 'matutino' }
  }
];

const ecopontos = [
  {
    id_ecoponto: 'EP01',
    nome: 'Ecoponto Feira X',
    endereco: 'Av. Presidente Dutra, s/n - Feira X',
    latitude: -12.2489,
    longitude: -38.9598,
    materiais_aceitos: ['vidro', 'papel', 'plastico', 'metal'],
    horario_funcionamento: 'Seg a Sex, 07h às 17h'
  },
  {
    id_ecoponto: 'EP02',
    nome: 'Ecoponto Tomba',
    endereco: 'Rua Juracy Magalhães, 210 - Tomba',
    latitude: -12.2801,
    longitude: -38.9712,
    materiais_aceitos: ['papel', 'plastico', 'eletronico', 'oleo'],
    horario_funcionamento: 'Seg a Sáb, 08h às 18h'
  },
  {
    id_ecoponto: 'EP03',
    nome: 'Ecoponto Cidade Nova',
    endereco: 'Rua Barão de Cotegipe, 55 - Cidade Nova',
    latitude: -12.2312,
    longitude: -38.9481,
    materiais_aceitos: ['entulho', 'metal', 'vidro'],
    horario_funcionamento: 'Seg a Sex, 07h às 16h'
  },
  {
    id_ecoponto: 'EP04',
    nome: 'Ecoponto Campo Limpo',
    endereco: 'Rodovia BR-324, km 512 - Campo Limpo',
    latitude: -12.2205,
    longitude: -38.9903,
    materiais_aceitos: ['entulho', 'oleo', 'eletronico'],
    horario_funcionamento: 'Ter a Dom, 08h às 17h'
  }
];

// Ocorrências são criadas em tempo de execução via POST /ocorrencias
const ocorrencias = [];

const TIPOS_OCORRENCIA = [
  'coleta_nao_realizada',
  'acumulo_irregular',
  'container_danificado',
  'descarte_entulho'
];

module.exports = { bairros, ecopontos, ocorrencias, TIPOS_OCORRENCIA };