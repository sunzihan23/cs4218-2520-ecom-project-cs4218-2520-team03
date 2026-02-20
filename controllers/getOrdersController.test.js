import { jest } from '@jest/globals';

jest.mock('../models/orderModel.js');

import { getOrdersController } from './authController.js';
import orderModel from '../models/orderModel.js';
import { createMockReq, createMockRes } from '../__tests__/helpers/mockHelpers.js';



// dont clutter test output
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

describe('Test Cases for getOrdersController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
  });

  // SUCCESS CASES

  describe('Success Cases', () => {
    it('should return orders for authenticated user as JSON array', async () => {
      // arrange
      const mockOrders = [
        { 
          _id: 'order1', 
          buyer: 'user123',
          products: [{ _id: 'prod1', name: 'Product 1' }],
          status: 'Processing'
        },
        { 
          _id: 'order2', 
          buyer: 'user123',
          products: [{ _id: 'prod2', name: 'Product 2' }],
          status: 'Shipped'
        }
      ];

      const mockReq = createMockReq({
        user: { _id: 'user123' }
      });
      const mockRes = createMockRes();

      // Mock the chained methods: find().populate().populate()
      //orderModel.find() returns an object with a populate function. 
      //populate function returns an object with a another populate function.
      // and that returns the mockOrders data object

      orderModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockOrders)
        })
      });

      // Act
      await getOrdersController(mockReq, mockRes);

      // Assert 
      expect(mockRes.json).toHaveBeenCalledWith(mockOrders);
      expect(mockRes.json).toHaveBeenCalledTimes(1);
      
      // verify find was called (but not check exact parameters)
      expect(orderModel.find).toHaveBeenCalled();
    });

    it('should return empty array when user has no orders', async () => {

      //arrange
      const mockReq = createMockReq({
        user : {_id : 'user123'}
      });
      const mockRes = createMockRes();

      orderModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue([])
        })
      })

      // act
      await getOrdersController(mockReq, mockRes);

      // assert
      expect(mockRes.json).toHaveBeenCalledWith([])
      expect(mockRes.json).toHaveBeenCalledTimes(1)
      expect(orderModel.find).toHaveBeenCalled();
    });

    it('should handle user with single order', async () => {
      // Arrange
      const singleOrder = [
        { 
          _id: 'order1', 
          buyer: 'user123',
          products: [{ _id: 'prod1' }]
        }
      ];

      const mockReq = createMockReq({
        user: { _id: 'user123' }
      });
      const mockRes = createMockRes();

      orderModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(singleOrder)
        })
      });

      // Act
      await getOrdersController(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(singleOrder);
    });
  });

  // ====== FAILURE CASES ======

  describe('Failure Cases', () => {
    it('should return 500 error when database query fails', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      const mockReq = createMockReq({
        user: { _id: 'user123' }
      });
      const mockRes = createMockRes();

      // Mock database error in the populate chain - use mockRejectedValue to trigger catch block
      orderModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValue(dbError)
        })
      });

      // Act
      await getOrdersController(mockReq, mockRes);

      // Assert - Check error response structure
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error WHile Geting Orders",
          error: dbError
        })
      );
      
      // Verify error was logged
      expect(consoleLogSpy).toHaveBeenCalledWith(dbError);
    });

    it('should return 500 error when find() throws error', async () => {
      // Arrange
      const findError = new Error('Find operation failed');
      const mockReq = createMockReq({
        user: { _id: 'user123' }
      });
      const mockRes = createMockRes();

      // Mock error at find level
      orderModel.find = jest.fn().mockImplementation(() => {
        throw findError;
      });

      // Act
      await getOrdersController(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error WHile Geting Orders"
        })
      );
    });

    it('should return 500 error when populate() throws error', async () => {
      // Arrange
      const populateError = new Error('Populate failed');
      const mockReq = createMockReq({
        user: { _id: 'user123' }
      });
      const mockRes = createMockRes();

      // Mock error in populate chain - following same pattern as other error tests
      orderModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValue(populateError)
        })
      });

      // Act
      await getOrdersController(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error WHile Geting Orders",
          error: populateError
        })
      );
    });

    it('should handle network timeout error', async () => {
      // Arrange
      const timeoutError = new Error('ETIMEDOUT');
      timeoutError.code = 'ETIMEDOUT';
      
      const mockReq = createMockReq({
        user: { _id: 'user123' }
      });
      const mockRes = createMockRes();

      orderModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValue(timeoutError)
        })
      });

      // Act
      await getOrdersController(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error WHile Geting Orders"
        })
      );
    });
  });

  // EDGE CASES

  describe('Edge Cases', () => {
    it('should handle undefined user object gracefully', async () => {
      // Arrange
      const mockReq = createMockReq({
        user: undefined // User not authenticated (shouldn't happen with middleware, but test anyway)
      });
      const mockRes = createMockRes();

      orderModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockRejectedValue(new Error('Cannot read property _id'))
      });

      // Act
      await getOrdersController(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should handle orders with null values in populated fields', async () => {
      // Arrange
      const ordersWithNulls = [
        { 
          _id: 'order1', 
          buyer: null, // Buyer might be deleted
          products: [null, { _id: 'prod1' }] // or some products might be deleted
        }
      ];

      const mockReq = createMockReq({
        user: { _id: 'user123' }
      });
      const mockRes = createMockRes();

      orderModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(ordersWithNulls)
        })
      });

      // Act
      await getOrdersController(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(ordersWithNulls);
    });
  });
});