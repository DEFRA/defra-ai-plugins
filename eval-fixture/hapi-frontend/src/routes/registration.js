import Joi from 'joi'

const registrationRoutes = [
  {
    method: 'GET',
    path: '/register/name',
    handler: (_request, h) => {
      return h.view('registration/name', {
        pageTitle: 'What is your full name?'
      })
    }
  },
  {
    method: 'POST',
    path: '/register/name',
    options: {
      validate: {
        payload: Joi.object({
          fullName: Joi.string().trim().required().messages({
            'string.empty': 'Enter your full name',
            'any.required': 'Enter your full name'
          }),
          crumb: Joi.string()
        }),
        failAction: (_request, h, error) => {
          const errors = error.details.map((detail) => ({
            text: detail.message,
            href: `#${detail.context.key}`
          }))
          return h.view('registration/name', {
            pageTitle: 'Error: What is your full name?',
            errorSummary: errors,
            errors: Object.fromEntries(
              error.details.map((d) => [d.context.key, { text: d.message }])
            )
          }).takeover()
        }
      }
    },
    handler: (_request, h) => {
      return h.redirect('/register/email')
    }
  }
]

export { registrationRoutes }
