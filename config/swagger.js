/**
 * Swagger API documentation configuration
 * Defines paths, parameters, schemas, and responses for OpenAPI 3.0
 */
const config = require('./environment');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'AWS Deployment Demo API',
    version: '1.0.0',
    description: 'A clean, modular Express API built to demonstrate and learn AWS deployment strategies. Includes liveness checks, configuration metadata, and items CRUD.',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.PORT}`,
      description: 'Local Development Server',
    },
  ],
  paths: {
    '/api/info': {
      get: {
        tags: ['System'],
        summary: 'Get application info and environment metadata',
        description: 'Returns metadata such as current port, running environment configuration, and server timestamp. Helpful for verifying AWS env setups.',
        responses: {
          200: {
            description: 'Successfully retrieved configuration info',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Welcome to the AWS Deployment Demo API!' },
                    environment: { type: 'string', example: 'development' },
                    port: { type: 'integer', example: 5000 },
                    timestamp: { type: 'string', format: 'date-time' },
                    documentation: { type: 'string', example: 'See README.md for endpoint and deployment details' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Perform liveness/health check',
        description: 'Provides system statistics including memory usage, node version, OS platform, and uptime. Used by AWS Target Groups / ELB to monitor instances.',
        responses: {
          200: {
            description: 'Server is healthy and running',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'UP' },
                    uptime: { type: 'number', example: 124.5 },
                    timestamp: { type: 'string', format: 'date-time' },
                    nodeVersion: { type: 'string', example: 'v20.20.2' },
                    memoryUsage: {
                      type: 'object',
                      properties: {
                        rss: { type: 'integer', example: 52100000 },
                        heapTotal: { type: 'integer', example: 8400000 },
                        heapUsed: { type: 'integer', example: 6200000 }
                      }
                    },
                    platform: { type: 'string', example: 'linux' }
                  }
                }
              }
            }
          },
          500: {
            description: 'Server is down or experiencing issues',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'DOWN' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/items': {
      get: {
        tags: ['Items CRUD'],
        summary: 'Retrieve all items',
        description: 'Returns the full list of items currently stored in the in-memory database simulation.',
        responses: {
          200: {
            description: 'Successfully retrieved items list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    count: { type: 'integer', example: 2 },
                    data: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Item'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Items CRUD'],
        summary: 'Create a new item',
        description: 'Add a new item into the in-memory database.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: {
                    type: 'string',
                    description: 'Name of the item/AWS service',
                    example: 'AWS Lambda'
                  },
                  description: {
                    type: 'string',
                    description: 'Brief description of the item/AWS service',
                    example: 'Serverless compute service that runs code in response to events.'
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Item created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Item created successfully' },
                    data: {
                      $ref: '#/components/schemas/Item'
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Bad request (missing required name parameter)'
          }
        }
      }
    },
    '/api/items/{id}': {
      get: {
        tags: ['Items CRUD'],
        summary: 'Retrieve a single item',
        description: 'Get details of an item by its path parameter ID.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID of the item to retrieve',
            schema: { type: 'string', example: '1' }
          }
        ],
        responses: {
          200: {
            description: 'Item details retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      $ref: '#/components/schemas/Item'
                    }
                  }
                }
              }
            }
          },
          404: {
            description: 'Item with requested ID not found'
          }
        }
      },
      put: {
        tags: ['Items CRUD'],
        summary: 'Update an existing item',
        description: 'Updates properties of an item by its ID. Modified properties take effect instantly.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID of the item to update',
            schema: { type: 'string', example: '1' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    description: 'Updated name',
                    example: 'AWS EC2 Elastic Compute'
                  },
                  description: {
                    type: 'string',
                    description: 'Updated description',
                    example: 'Resizable virtual servers running in the cloud.'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Item updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Item updated successfully' },
                    data: {
                      $ref: '#/components/schemas/Item'
                    }
                  }
                }
              }
            }
          },
          404: {
            description: 'Item with requested ID not found'
          }
        }
      },
      delete: {
        tags: ['Items CRUD'],
        summary: 'Delete an item',
        description: 'Removes an item from the in-memory database by its ID.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID of the item to delete',
            schema: { type: 'string', example: '1' }
          }
        ],
        responses: {
          200: {
            description: 'Item deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Item deleted successfully' },
                    data: {
                      $ref: '#/components/schemas/Item'
                    }
                  }
                }
              }
            }
          },
          404: {
            description: 'Item with requested ID not found'
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Item: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Auto-incrementing unique identifier',
            example: '1'
          },
          name: {
            type: 'string',
            description: 'Name of the item/AWS service',
            example: 'AWS EC2 Instance'
          },
          description: {
            type: 'string',
            description: 'Detailed description',
            example: 'Virtual server in Amazon\'s Elastic Compute Cloud (EC2)'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Item creation timestamp',
            example: '2026-05-27T09:51:46.094Z'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Item last modification timestamp',
            example: '2026-05-27T09:51:46.094Z'
          }
        }
      }
    }
  }
};

module.exports = swaggerDefinition;
