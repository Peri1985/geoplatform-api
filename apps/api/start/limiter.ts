/*
|--------------------------------------------------------------------------
| Define HTTP limiters
|--------------------------------------------------------------------------
|
| The "limiter.define" method creates an HTTP middleware to apply rate
| limits on a route or a group of routes. Feel free to define as many
| throttle middleware as needed.
|
*/

import limiter from '@adonisjs/limiter/services/main'

/**
 * Login and signup: 10 requests per minute per IP, against password guessing
 */
export const authThrottle = limiter.define('auth', () => {
  return limiter.allowRequests(10).every('1 minute')
})
