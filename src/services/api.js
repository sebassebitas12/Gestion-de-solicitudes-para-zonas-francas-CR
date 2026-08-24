const API_URL = 'http://localhost:3001';

export async function fetchAPI(
  endpoint,
  options = {}
) {

  try {

    const response =
      await fetch(
        `${API_URL}${endpoint}`,
        {
          ...options,

          headers: {
            Accept: 'application/json',

            ...(options.body
              ? {
                  'Content-Type':
                    'application/json',
                }
              : {}),

            ...options.headers,
          },
        }
      );


    if (!response.ok) {

      let detalle =
        response.statusText;


      try {

        const error =
          await response.json();

        detalle =
          error.message ||
          error.error ||
          detalle;

      } catch {
        // La respuesta no contiene JSON.
      }


      throw new Error(
        `Error ${response.status}: ${detalle}`
      );
    }


    if (response.status === 204) {
      return null;
    }


    return await response.json();

  } catch (error) {

    if (
      error instanceof TypeError
    ) {

      throw new Error(
        'No se pudo conectar con json-server. ' +
        'Ejecute: npm run server'
      );
    }


    throw error;
  }
}