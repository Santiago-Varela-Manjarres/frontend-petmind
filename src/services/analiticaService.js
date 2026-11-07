import { apiGet } from './api'

// Datos agregados por la API de analítica en Python (petmind-analitica). El frontend no la llama
// directamente: Spring Boot expone GET /api/analitica, le pide el tablero a Python y reenvía el JSON.
export function obtenerAnalitica() {
  return apiGet('/analitica')
}
