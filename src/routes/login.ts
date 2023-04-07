import { knex } from '../database'
import { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import { env } from '../env'
import { checkUserSession } from '../middlewares/check-user-session'

interface userIdRequest extends FastifyRequest {
  userId?: string
}

export async function loginRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const loginSchema = z.object({
      email: z.string().email(),
      password: z.string(),
    })

    const { email, password } = loginSchema.parse(request.body)

    const user = await knex('users').where({ email }).first()

    if (!user) {
      return reply.status(400).send({
        error: 'Invalid credentials',
      })
    }

    const isPasswordValid = user.password === password

    if (!isPasswordValid) {
      return reply.status(400).send({
        error: 'Invalid credentials',
      })
    }

    const token = jwt.sign({ id: user.id }, env.JWT_SECRET)

    reply.setCookie('user', token)

    return reply.status(201).send()
  })

  app.get(
    '/me',
    {
      preHandler: [checkUserSession],
    },
    async (request: userIdRequest, reply) => {
      try {
        const { userId } = request

        const user = await knex('users')
          .select('name', 'email', 'avatar')
          .where({ id: userId })
          .first()

        if (!user) {
          return reply.status(400).send({
            error: 'User not found',
          })
        }

        return reply.status(200).send(user)
      } catch {
        return reply.status(401).send({ message: 'Unauthorized' })
      }
    },
  )
}
