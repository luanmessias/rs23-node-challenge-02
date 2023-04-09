import { knex } from '../database'
import { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import crypto from 'crypto'
import { checkUserSession } from '../middlewares/check-user-session'
import { checkMealOwnership } from '../middlewares/check-meal-ownership'

interface userIdRequest extends FastifyRequest {
  userId?: string
}

interface mealInterface {
  id: string
  name: string
  description: string
  dateTime: string
  isMealDiet: boolean
}

export async function mealsRoutes(app: FastifyInstance) {
  app.post(
    '/',
    {
      preHandler: [checkUserSession],
    },
    async (request, reply) => {
      const createMealBodySchema = z.object({
        id: z.string().uuid(),
        name: z.string(),
        description: z.string(),
        dateTime: z.string(),
        isMealDiet: z.boolean(),
        userId: z.string().uuid(),
      })

      const { userId } = request as userIdRequest
      const { name, description, dateTime, isMealDiet } =
        request.body as mealInterface

      const meal = createMealBodySchema.parse({
        id: crypto.randomUUID(),
        name,
        description,
        dateTime,
        isMealDiet,
        userId,
      })

      await knex('meals').insert(meal)

      return reply.status(201).send()
    },
  )

  app.put(
    '/:id',
    {
      preHandler: [checkUserSession, checkMealOwnership],
    },
    async (request, reply) => {
      const updateMealBodySchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        dateTime: z.string().optional(),
        isMealDiet: z.boolean().optional(),
      })
      const { id } = request.params as { id: string }

      const meal = await knex('meals').where({ id }).first()

      const { name, description, dateTime, isMealDiet } =
        updateMealBodySchema.parse(request.body)

      await knex('meals')
        .where({ id })
        .update({
          name: name || meal.name,
          description: description || meal.description,
          dateTime: dateTime || meal.dateTime,
          isMealDiet: isMealDiet !== undefined ? isMealDiet : meal.isMealDiet,
        })

      return reply.status(200).send()
    },
  )

  app.delete(
    '/:id',
    {
      preHandler: [checkUserSession, checkMealOwnership],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }

      await knex('meals').where({ id }).delete()

      return reply.status(200).send()
    },
  )

  app.get(
    '/',
    {
      preHandler: [checkUserSession],
    },
    async (request, reply) => {
      const { userId } = request as userIdRequest

      const meals = await knex('meals').where({ userId })

      return reply.status(200).send(meals)
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkUserSession, checkMealOwnership],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }

      const meal = await knex('meals').where({ id }).first()

      return reply.status(200).send(meal)
    },
  )

  app.get(
    '/stats',
    {
      preHandler: [checkUserSession],
    },
    async (request, reply) => {
      const { userId } = request as userIdRequest

      try {
        const totalMeals = await knex('meals')
          .count('* as count')
          .where({ userId })
          .first()

        const totalDietMeals = await knex('meals')
          .count('* as count')
          .where({ userId, isMealDiet: true })
          .first()

        const totalNonDietMeals = await knex('meals')
          .count('* as count')
          .where({ userId, isMealDiet: false })
          .first()

        const bestSequencesByDay = await knex('meals')
          .count('* as count')
          .where({ userId, isMealDiet: true })
          .groupByRaw('date("dateTime")')
          .orderBy('count', 'desc')
          .first()

        const stats = {
          totalMeals: totalMeals?.count,
          totalDietMeals: totalDietMeals?.count,
          totalNonDietMeals: totalNonDietMeals?.count,
          bestSequencesByDay: bestSequencesByDay?.count,
        }

        return reply.status(200).send(stats)
      } catch (error) {
        console.error(error)
        return reply.status(500).send('An error occurred')
      }
    },
  )
}
