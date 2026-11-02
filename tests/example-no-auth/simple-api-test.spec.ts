import { StatusCodes } from 'http-status-codes'
import { expect, test } from '@playwright/test'

test('get product with correct id should receive code 200', async ({ request }) => {
  // Build and send a GET request to the server
  const response = await request.get('https://shop.tl-academy.ee/api/products/1')

  // parse raw response body to json
  const responseBody = await response.json()
  const statusCode = response.status()

  // Log the response status, body and headers
  console.log('response body:', responseBody)
  // Check if the response status is 200
  expect(statusCode).toBe(StatusCodes.OK)
})

test('post product with correct data should receive code 201', async ({ request }) => {
  // prepare request body
  const requestBody = {
    name: 'Orange',
    category: 'Fruit',
    price: 2.39,
    quantity: 10,
  }
  // Send a POST request to the server
  const response = await request.post('https://shop.tl-academy.ee/api/products', {
    data: requestBody,
  })
  // parse raw response body to json
  const responseBody = await response.json()
  const statusCode = response.status()

  // Log the response status and body
  console.log('response status:', statusCode)
  console.log('response body:', responseBody)
  expect(statusCode).toBe(StatusCodes.CREATED)
  // check that body.name is string type
  expect(typeof responseBody.name).toBe('string')
  // check that body.price is number type
  expect(typeof responseBody.price).toBe('number')
})

test.describe('GET /api/products/{id}', () => {
  test('get product with incorrect id should receive 400', async ({ request }) => {
    const response = await request.get('https://shop.tl-academy.ee/api/products/dj4js4j')

    const responseBody = await response.json()
    const statusCode = response.status()

    console.log('response body:', responseBody)
    expect(statusCode).toBe(StatusCodes.BAD_REQUEST)
    expect(responseBody).toEqual({ error: 'Invalid product id' })
  })

  test('get product with negative id should receive 400', async ({ request }) => {
    const response = await request.get('https://shop.tl-academy.ee/api/products/-20')

    const responseBody = await response.json()
    const statusCode = response.status()

    console.log('response body:', responseBody)
    expect(statusCode).toBe(StatusCodes.BAD_REQUEST)
    expect(responseBody).toEqual({ error: 'Invalid product id' })
  })

  test('get product with non-existent id should receive 404', async ({ request }) => {
    const allProductsResponse = await request.get('https://shop.tl-academy.ee/api/products')
    const allProductsBody = await allProductsResponse.json()

    const lastProductId: number = allProductsBody.length
    const notExistingId = lastProductId + 1000

    const oneProductResponse = await request.get(
      `https://shop.tl-academy.ee/api/products/${notExistingId}`,
    )
    const oneProductBody = await oneProductResponse.json()

    console.log('response body:', oneProductBody)
    expect(oneProductResponse.status()).toBe(StatusCodes.NOT_FOUND)
    expect(oneProductBody).toEqual({ error: 'Product not found' })
  })

  test('get product with zero id should receive 400', async ({ request }) => {
    const response = await request.get('https://shop.tl-academy.ee/api/products/0')

    const responseBody = await response.json()
    const statusCode = response.status()

    console.log('response body:', responseBody)
    expect(statusCode).toBe(StatusCodes.BAD_REQUEST)
    expect(responseBody).toEqual({ error: 'Invalid product id' })
  })

  test('get product with decimal id should receive 400', async ({ request }) => {
    const response = await request.get('https://shop.tl-academy.ee/api/products/1.5')

    const responseBody = await response.json()
    const statusCode = response.status()

    console.log('response body:', responseBody)
    expect(statusCode).toBe(StatusCodes.BAD_REQUEST)
    expect(responseBody).toEqual({ error: 'Invalid product id' })
  })
})

test.describe('GET /api/products', () => {
  test('products with minPrice=2 should receive only products with price 2 or more', async ({
    request,
  }) => {
    const response = await request.get('https://shop.tl-academy.ee/api/products?minPrice=2')

    const responseBody = await response.json()
    const statusCode = response.status()

    console.log('response body:', responseBody)
    expect(statusCode).toBe(StatusCodes.OK)
    expect(Array.isArray(responseBody)).toBe(true)
    for (const product of responseBody) {
      expect(product.price).toBeGreaterThanOrEqual(2)
    }
  })

  test('available for products must be true or false', async ({ request }) => {
    const response = await request.get('https://shop.tl-academy.ee/api/products')

    const responseBody = await response.json()

    console.log('response body:', responseBody)
    expect(Array.isArray(responseBody)).toBe(true)
    for (const product of responseBody) {
      expect(typeof product.available).toBe('boolean')
    }
  })
})

test.describe('POST /api/products/', () => {
  test('post product without name should receive code 400', async ({ request }) => {
    const requestBody = {
      category: 'Fruit',
      price: 2.39,
      quantity: 10,
    }
    const response = await request.post('https://shop.tl-academy.ee/api/products', {
      data: requestBody,
    })
    const responseBody = await response.json()
    const statusCode = response.status()
    console.log('response status:', statusCode)
    console.log('response body:', responseBody)
    expect(statusCode).toBe(StatusCodes.BAD_REQUEST)
    expect(responseBody).toEqual({ error: 'Name is required' })
  })

  test('Post product with price 0 should receive code 400', async ({ request }) => {
    const requestBody = {
      name: 'Milk',
      category: 'Fruit',
      price: 0,
      quantity: 10,
    }
    const response = await request.post('https://shop.tl-academy.ee/api/products', {
      data: requestBody,
    })
    const responseBody = await response.json()
    const statusCode = response.status()
    console.log('response status:', statusCode)
    console.log('response body:', responseBody)
    expect(statusCode).toBe(StatusCodes.BAD_REQUEST)
    expect(responseBody).toEqual({ error: 'Price must be greater than 0' })
  })

  test('Price with a string format should receive code 400', async ({ request }) => {
    const requestBody = {
      name: 'Milk',
      category: 'Fruit',
      price: '100',
      quantity: 10,
    }
    const response = await request.post('https://shop.tl-academy.ee/api/products', {
      data: requestBody,
    })
    const responseBody = await response.json()
    const statusCode = response.status()
    console.log('response status:', statusCode)
    console.log('response body:', responseBody)
    expect(statusCode).toBe(StatusCodes.BAD_REQUEST)
    expect(responseBody).toEqual({ error: 'Price must be a number' })
  })

  test('Quantity with a negative integer should receive code 400', async ({ request }) => {
    const requestBody = {
      name: 'Milk',
      category: 'Fruit',
      price: 100,
      quantity: -5,
    }
    const response = await request.post('https://shop.tl-academy.ee/api/products', {
      data: requestBody,
    })
    const responseBody = await response.json()
    const statusCode = response.status()
    console.log('response status:', statusCode)
    console.log('response body:', responseBody)
    expect(statusCode).toBe(StatusCodes.BAD_REQUEST)
    expect(responseBody).toEqual({ error: 'Quantity must be a non-negative integer' })
  })

  test('Product with quantity 0 and available: true should receive code 400', async ({
    request,
  }) => {
    const requestBody = {
      name: 'Milk',
      category: 'Fruit',
      price: 100,
      quantity: 0,
      available: true,
    }
    const response = await request.post('https://shop.tl-academy.ee/api/products', {
      data: requestBody,
    })
    const responseBody = await response.json()
    const statusCode = response.status()
    console.log('response status:', statusCode)
    console.log('response body:', responseBody)
    expect(statusCode).toBe(StatusCodes.BAD_REQUEST)
    expect(responseBody).toEqual({ error: 'Product with quantity 0 cannot be available' })
  })

  test('Product with no category should receive code 400', async ({ request }) => {
    const requestBody = {
      name: 'Milk',
      price: 100,
      quantity: 4,
      available: true,
    }
    const response = await request.post('https://shop.tl-academy.ee/api/products', {
      data: requestBody,
    })
    const responseBody = await response.json()
    const statusCode = response.status()
    console.log('response status:', statusCode)
    console.log('response body:', responseBody)
    expect(statusCode).toBe(StatusCodes.BAD_REQUEST)
    expect(responseBody).toEqual({ error: 'Category is required' })
  })
})
