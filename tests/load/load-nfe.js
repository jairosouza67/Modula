import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<10000'], // 95% das requisições devem ser menores que 10s (LOAD-05)
  },
};

export default function () {
  const payload = JSON.stringify({
    os_id: 's0000000-0000-0000-0000-000000000001',
    tipo: 'VENDA'
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Simula a emissão de NF-e (Edge Function mockada)
  const res = http.post('http://localhost:54321/functions/v1/emitir-nfe', payload, params);
  
  check(res, {
    'is status 200 or 201': (r) => r.status === 200 || r.status === 201,
  });
  
  sleep(5); // Emissão é um processo lento, espera mais entre VUs
}
