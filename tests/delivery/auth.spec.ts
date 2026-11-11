import { expect, test } from '@playwright/test'
import { Login } from '../../dto/login-dto'
import { createOrder, fetchJwt } from '../../helpers/api-helper'
import { StatusCodes } from 'http-status-codes'

let loginDto: Login
export const baseUrl = 'https://backend.tallinn-learning.ee'
export const loginEndpoint = '/login/student'
export const ordersEndpoint = '/orders'

test.describe('Authorization flow', () => {
  test.beforeAll(() => {
    loginDto = new Login(process.env['DL_USERNAME']!, process.env['DL_PASSWORD']!)
  })

  test('TL-12-1 should login and receive authorization token', async ({ request }) => {
    const user: Login = {
      username: process.env.DL_USERNAME!,
      password: process.env.DL_PASSWORD!,
    }
    const response = await request.post(baseUrl + loginEndpoint, {
      data: user,
    })
    const token = await response.text()
    expect(token).toBeDefined()
  })

  test('TL-12-2 should create order', async ({ request }) => {
    const token = await fetchJwt(request, loginDto)
    const orderId = await createOrder(request, token)
    expect(orderId).toBeDefined()
  })

  test('TL-12-4 should NOT create order', async ({ request }) => {
    const response = await request.post(baseUrl + ordersEndpoint, {
      data: {
        status: 'OPEN',
        courierId: 0,
        customerName: 'vladimir',
        customerPhone: '55445566',
        comment: 'hello',
        id: 0,
      },
      headers: {
        Authorization: `Bearer`,
      },
    })
    expect(response.status()).toBe(StatusCodes.UNAUTHORIZED)
  })

  test('TL-12-5 should get orders with authorization token', async ({ request }) => {
    const token = await fetchJwt(request, loginDto)

    const response = await request.get(baseUrl + ordersEndpoint, {
      headers: {
        accept: '*/*',
        Authorization: `Bearer ${token}`,
      },
    })

    expect(response.status()).toBe(200)
    const orders = await response.json()
    console.log('Orders:', JSON.stringify(orders, null, 2))
    expect(orders).toBeTruthy()
  })
})
