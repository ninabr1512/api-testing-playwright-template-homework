import { expect, test } from '@playwright/test'
import { StatusCodes } from 'http-status-codes'
import { AccountDTO } from '../../dto/AccountDTO'

const baseUrl = 'https://shop.tl-academy.ee'
const authHeader = { 'X-API-KEY': 'my-api-key' }

type CreatedAccountResp = {
  id: number
  owner: string
  currency: string
  balance: number
  createdAt: string
}

type CreatedAccountErrorResp = {
  error: string
}

test.describe('/api/accounts critical path', () => {
  test('TL-11-1 POST /api/accounts with valid data without currency', async ({ request }) => {
    const account = new AccountDTO('Test Owner')
    console.log(account)
    const response = await request.post(baseUrl + '/api/accounts', {
      headers: authHeader,
      data: account,
    })
    const respBody: CreatedAccountResp = await response.json()
    console.log(respBody)
    expect(response.status()).not.toBe(StatusCodes.FORBIDDEN)
    expect(response.status()).toBe(StatusCodes.CREATED)
    expect(respBody.owner).toBe(account.owner)
  })
  const currencies: string[] = ['USD', 'EUR', 'GBP']

  test(`TL-11-2 POST /api/accounts with valid data and all supported currencies: ${currencies}`, async ({
    request,
  }) => {
    for (const currency of currencies) {
      const account = new AccountDTO('Test Owner', currency)
      const response = await request.post(baseUrl + '/api/accounts', {
        headers: authHeader,
        data: account,
      })
      const respBody: CreatedAccountResp = await response.json()
      console.log(respBody)
      expect
        .soft(response.status(), `Tested ${currency} currency`)
        .not.toBe(StatusCodes.UNAUTHORIZED)
      expect.soft(response.status(), `Tested ${currency} currency`).toBe(StatusCodes.CREATED)
      expect.soft(respBody.owner, `Tested ${currency} currency`).toBe(account.owner)
      expect.soft(respBody.currency, `Tested ${currency} currency`).toBe(account.currency)
    }
  })
})

test.describe('/api/accounts negative tests', () => {
  test('TL-11-3 POST /api/accounts with invalid data', async ({ request }) => {
    const account = new AccountDTO('Test Owner', 'PLN')
    const response = await request.post(baseUrl + '/api/accounts', {
      headers: authHeader,
      data: account,
    })
    const respBody: CreatedAccountErrorResp = await response.json()
    console.log(respBody)
    expect.soft(response.status()).not.toBe(StatusCodes.UNAUTHORIZED)
    expect.soft(response.status()).toBe(StatusCodes.BAD_REQUEST)
    expect.soft(respBody.error).not.toBeUndefined()
    expect.soft(respBody.error.length).toBeGreaterThan(0)
  })
})

test.describe('/api/accounts', () => {
  test('TL-11-4 GET/api/accounts', async ({ request }) => {
    const response = await request.get(baseUrl + '/api/accounts', {
      headers: authHeader,
    })
    const responseBody: CreatedAccountResp[] = await response.json()
    const statusCode = response.status()

    console.log('response body:', responseBody)
    expect.soft(statusCode).toBe(StatusCodes.OK)
    expect.soft(responseBody).toBeInstanceOf(Array)
    expect.soft(responseBody.length).toBeGreaterThan(0)
    for (const account of responseBody) {
      expect.soft(typeof account.id).toBe('number')
      expect.soft(typeof account.currency).toBe('string')
      expect.soft(typeof account.owner).toBe('string')
      expect.soft(typeof account.balance).toBe('number')
      expect.soft(typeof account.createdAt).toBe('string')
    }
  })

  test('TL-11-5 GET/api/account without API key', async ({ request }) => {
    const response = await request.get(baseUrl + '/api/accounts', {})
    const responseBody = await response.json()
    const statusCode = response.status()

    console.log('response body:', responseBody)
    expect.soft(statusCode).toBe(StatusCodes.UNAUTHORIZED)
    expect.soft(responseBody.error).toBe('Invalid or missing X-API-KEY')
  })
  test('TL-11-6 GET/api/account with {id}', async ({ request }) => {
    const account = new AccountDTO('Test Owner', 'USD')
    const createResponse = await request.post(baseUrl + '/api/accounts', {
      headers: authHeader,
      data: account,
    })
    const created: CreatedAccountResp = await createResponse.json()
    const response = await request.get(baseUrl + '/api/accounts/' + created.id, {
      headers: authHeader,
    })
    const responseBody = await response.json()
    const statusCode = response.status()
    console.log('response body:', responseBody)
    expect.soft(statusCode).toBe(StatusCodes.OK)
    expect.soft(responseBody).toEqual(created)
  })

  test('TL-11-7 GET/api/account with wrong {id}', async ({ request }) => {
    const response = await request.get(baseUrl + '/api/accounts/10000000', { headers: authHeader })
    const responseBody = await response.json()
    const statusCode = response.status()

    console.log('response body:', responseBody)
    expect.soft(statusCode).toBe(StatusCodes.NOT_FOUND)
    expect.soft(responseBody.error).toBe('Account not found')
  })

  test('TL-11-8 GET/api/account with wrong ID format', async ({ request }) => {
    const invalidId = ['abfsed4d', '0', '-1', '2.5']
    for (const id of invalidId) {
      const response = await request.get(baseUrl + '/api/accounts/' + id, {
        headers: authHeader,
      })
      const responseBody = await response.json()
      const statusCode = response.status()

      console.log('response body:', responseBody)
      expect.soft(statusCode).toBe(StatusCodes.BAD_REQUEST)
      expect.soft(responseBody.error).toBe('Invalid account id')
    }
  })

  test('TL-11-9 GET/api/account with no key', async ({ request }) => {
    const response = await request.get(baseUrl + '/api/accounts/1')
    const responseBody = await response.json()
    const statusCode = response.status()
    console.log('response body:', responseBody)
    expect.soft(statusCode).toBe(StatusCodes.UNAUTHORIZED)
    expect.soft(responseBody.error).toBe('Invalid or missing X-API-KEY')
  })
})
