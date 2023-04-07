import fastify from 'fastify'
import { mealsRoutes } from './routes/meals'
import cookie from '@fastify/cookie'
import { usersRoutes } from './routes/users'
import { loginRoutes } from './routes/login'

export const app = fastify()

app.register(cookie)

app.register(loginRoutes, {
  prefix: 'login',
})

app.register(mealsRoutes, {
  prefix: 'meals',
})

app.register(usersRoutes, {
  prefix: 'users',
})
