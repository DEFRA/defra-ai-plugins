// Registration form — accepts the user's full name.
// NOTE: This handler used to only render the page; it now also persists.
const registrationRoutes = [
  {
    method: 'GET',
    path: '/register',
    handler: (_request, h) => {
      return h.view('register', { pageTitle: 'Register your details' })
    }
  },
  {
    method: 'POST',
    path: '/register',
    handler: async (request, h) => {
      const { fullName } = request.payload
      // Persist the registration and redirect to the confirmation page.
      await request.server.app.store.save({ fullName })
      return h.redirect('/register/confirmation')
    }
  }
]

export { registrationRoutes }
