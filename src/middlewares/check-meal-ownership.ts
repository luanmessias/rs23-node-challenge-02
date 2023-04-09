import { knex } from '../database'
import { FastifyRequest, FastifyReply } from 'fastify'

interface userIdRequest extends FastifyRequest {
  userId?: string
}

export async function checkMealOwnership(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { userId } = request as userIdRequest
  const { id } = request.params as { id: string }

  const meal = await knex('meals').where({ id }).first()

  if (!meal) {
    return reply.status(404).send({
      error: 'Meal not found',
    })
  }

  const isUserMeal = userId === meal.userId

  if (!isUserMeal) {
    return reply.status(403).send({
      error: 'You do not have permission to perform this action',
    })
  }
}
