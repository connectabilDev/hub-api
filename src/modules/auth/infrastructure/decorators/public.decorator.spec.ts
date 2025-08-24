import { SetMetadata } from '@nestjs/common';
import { Public } from './public.decorator';

jest.mock('@nestjs/common', () => ({
  SetMetadata: jest.fn(),
}));

describe('Public Decorator', () => {
  it('should set isPublic metadata to true', () => {
    const mockSetMetadata = SetMetadata as jest.Mock;
    mockSetMetadata.mockReturnValue(jest.fn());

    Public();

    expect(mockSetMetadata).toHaveBeenCalledWith('isPublic', true);
  });
});
