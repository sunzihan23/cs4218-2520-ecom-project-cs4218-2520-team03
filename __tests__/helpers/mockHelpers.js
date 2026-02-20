import { jest } from '@jest/globals';

export const createMockReq = (overrides = {}) => ({
    body: {},
    params: {},
    user: {},
    ...overrides
  });
  
  export const createMockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };