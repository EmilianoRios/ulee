import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

crons.interval(
  'transition-expired-reservations',
  { minutes: 5 },
  internal.functions.reservations.mutations.transitionExpiredReservations,
)

export default crons
