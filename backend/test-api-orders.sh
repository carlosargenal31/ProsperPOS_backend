#!/bin/bash

# First, try to register a test customer
echo "=== Attempting to register test customer ==="
curl -s -X POST http://localhost:3000/api/v1/ecommerce/customers/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "test@test.com",
    "password": "123456",
    "phone": "99999999"
  }' | jq '.'

echo ""
echo "=== Logging in as test customer ==="
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/ecommerce/customers/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "123456"
  }' | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "Login failed, trying admin credentials"
  TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/ecommerce/customers/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "carlosargenal04@gmail.com",
      "password": "123456"
    }' | jq -r '.token')
fi

echo "Token: $TOKEN"
echo ""

if [ "$TOKEN" != "null" ] && [ ! -z "$TOKEN" ]; then
  echo "=== Fetching orders ==="
  curl -s -X GET http://localhost:3000/api/v1/ecommerce/orders \
    -H "Authorization: Bearer $TOKEN" | jq '.orders[0]'

  echo ""
  echo "=== Checking first order items ==="
  ORDER_NUMBER=$(curl -s -X GET http://localhost:3000/api/v1/ecommerce/orders \
    -H "Authorization: Bearer $TOKEN" | jq -r '.orders[0].order_number')

  if [ "$ORDER_NUMBER" != "null" ] && [ ! -z "$ORDER_NUMBER" ]; then
    echo "Fetching details for order: $ORDER_NUMBER"
    curl -s -X GET "http://localhost:3000/api/v1/ecommerce/orders/$ORDER_NUMBER" \
      -H "Authorization: Bearer $TOKEN" | jq '.order.items[] | {product_name, unit, quantity}'
  fi
else
  echo "Could not obtain valid token"
fi
