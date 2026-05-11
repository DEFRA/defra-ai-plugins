// Home page — read-only GET. Already covered by tests.
const homeRoutes = [
  {
    method: 'GET',
    path: '/',
    handler: (_request, h) => {
      return h.view('home', { pageTitle: 'Welcome' })
    }
  }
]

export { homeRoutes }
