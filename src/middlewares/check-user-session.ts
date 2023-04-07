import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import { env } from '../env'

interface TokenPayload {
  id: string
}

interface CustomRequest extends FastifyRequest {
  userId?: string
}

export async function checkUserSession(
  request: CustomRequest,
  reply: FastifyReply,
) {
  const token = request.cookies.user

  if (!token) {
    reply.status(401)
    throw new Error('Unauthorized')
  }

  const decodedToken = jwt.verify(token, env.JWT_SECRET) as TokenPayload

  const { id } = decodedToken

  request.userId = id
}
