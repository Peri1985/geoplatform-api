/**
 * The paginated lists (GET /organizations, /files, /geocoding/organizations/:id/usage): every page
 * has the same number of rows. Clients choose only the page (?page=2).
 */
const paginationConfig = {
  perPage: 20,
}

export default paginationConfig
