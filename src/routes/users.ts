import { knex } from '../database'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'

export async function usersRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    const users = await knex('users').select({
      name: 'name',
      email: 'email',
      avatar: 'avatar',
    })

    return {
      users,
    }
  })

  app.get('/:id', async (request) => {
    const getUserParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getUserParamsSchema.parse(request.params)

    const user = await knex('users')
      .select({
        name: 'name',
        email: 'email',
        avatar: 'avatar',
      })
      .where({ id })
      .first()

    return {
      user,
    }
  })

  app.post('/', async (request, reply) => {
    const createUserBodySchema = z.object({
      name: z.string(),
      email: z.string().email(),
      password: z.string(),
      avatar: z.string().optional(),
    })

    const { name, email, password, avatar } = createUserBodySchema.parse(
      request.body,
    )

    const userAlreadyExists = await knex('users')
      .select({ email: 'email' })
      .where({ email })
      .first()

    if (userAlreadyExists) {
      return reply.status(400).send({
        error: 'User already exists',
      })
    }

    await knex('users').insert({
      id: crypto.randomUUID(),
      name,
      email,
      password,
      avatar,
    })

    return reply.status(201).send()
  })
}
