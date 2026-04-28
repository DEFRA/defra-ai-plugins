const homeRoutes = [
  {
    method: 'GET',
    path: '/',
    handler: (_request, h) => {
      return h.view('home', {
        pageTitle: 'Register your details'
      })
    }
  }
]

export { homeRoutes }
