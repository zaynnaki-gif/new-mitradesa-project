import { bansosService } from './bansos.service';
import { ApiError } from '../utils/response';

// Auto-mock the Prisma module
jest.mock('./prisma');

// Import the mocked prisma instance
import { prisma } from './prisma';

// Cast to the jest mock type
const prismaMock = prisma as jest.Mocked<typeof prisma>;

describe('bansosService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    it('should return paginated bansos list', async () => {
      const fakeBansos = [
        { id: BigInt(1), nama: 'PKH', jenis: 'REGULER', tahun: 2024, _count: { penerima: 10 } },
      ];

      (prismaMock.bansos.findMany as jest.Mock).mockResolvedValue(fakeBansos);
      (prismaMock.bansos.count as jest.Mock).mockResolvedValue(1);

      const result = await bansosService.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(fakeBansos);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should filter by tahun if provided', async () => {
      (prismaMock.bansos.findMany as jest.Mock).mockResolvedValue([]);
      (prismaMock.bansos.count as jest.Mock).mockResolvedValue(0);

      await bansosService.findAll({ tahun: 2023, page: 1, limit: 10 });

      expect(prismaMock.bansos.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tahun: 2023 }),
        })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // findById
  // ---------------------------------------------------------------------------
  describe('findById', () => {
    it('should return bansos if found', async () => {
      const fakeData = { id: BigInt(1), nama: 'BPNT', jenis: 'REGULER', tahun: 2024, _count: { penerima: 5 } };
      (prismaMock.bansos.findUnique as jest.Mock).mockResolvedValue(fakeData);

      const result = await bansosService.findById('1');
      expect(result).toEqual(fakeData);
    });

    it('should throw NotFound if bansos does not exist', async () => {
      (prismaMock.bansos.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(bansosService.findById('999')).rejects.toBeInstanceOf(ApiError);
      await expect(bansosService.findById('999')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should create a new bansos record', async () => {
      const dto = { nama: 'BLT', jenis: 'REGULER' as const, tahun: 2024, jumlahPenerima: 50 };
      const fakeCreated = { id: BigInt(2), ...dto, jumlahDana: 0 };

      (prismaMock.bansos.create as jest.Mock).mockResolvedValue(fakeCreated);

      const result = await bansosService.create(dto);
      expect(result).toEqual(fakeCreated);
      expect(prismaMock.bansos.create).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should throw NotFound if bansos does not exist', async () => {
      (prismaMock.bansos.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        bansosService.update('999', { nama: 'Updated' })
      ).rejects.toBeInstanceOf(ApiError);
    });

    it('should update and return updated record', async () => {
      const existing = { id: BigInt(1), nama: 'PKH', jenis: 'REGULER', tahun: 2024 };
      const updated = { ...existing, nama: 'PKH Updated' };

      (prismaMock.bansos.findUnique as jest.Mock).mockResolvedValue(existing);
      (prismaMock.bansos.update as jest.Mock).mockResolvedValue(updated);

      const result = await bansosService.update('1', { nama: 'PKH Updated' });
      expect(result.nama).toBe('PKH Updated');
    });
  });

  // ---------------------------------------------------------------------------
  // delete
  // ---------------------------------------------------------------------------
  describe('delete', () => {
    it('should throw NotFound if bansos does not exist', async () => {
      (prismaMock.bansos.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(bansosService.delete('99')).rejects.toBeInstanceOf(ApiError);
    });

    it('should call prisma.bansos.delete when record exists', async () => {
      const existing = { id: BigInt(3), nama: 'BPNT' };
      (prismaMock.bansos.findUnique as jest.Mock).mockResolvedValue(existing);
      (prismaMock.bansos.delete as jest.Mock).mockResolvedValue(existing);

      await bansosService.delete('3');
      expect(prismaMock.bansos.delete).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // addPenerima
  // ---------------------------------------------------------------------------
  describe('addPenerima', () => {
    it('should throw NotFound if bansos does not exist', async () => {
      (prismaMock.bansos.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        bansosService.addPenerima('1', { pendudukId: '5', statusPenerimaan: 'AKTIF' })
      ).rejects.toBeInstanceOf(ApiError);
    });

    it('should throw BadRequest if penduduk already registered', async () => {
      (prismaMock.bansos.findUnique as jest.Mock).mockResolvedValue({ id: BigInt(1) });
      (prismaMock.bansosPenerima.findFirst as jest.Mock).mockResolvedValue({ id: BigInt(10) });

      await expect(
        bansosService.addPenerima('1', { pendudukId: '5', statusPenerimaan: 'AKTIF' })
      ).rejects.toBeInstanceOf(ApiError);
    });

    it('should create penerima if no duplicate exists', async () => {
      const fakePenerima = { id: BigInt(10), bansosId: BigInt(1), pendudukId: BigInt(5) };
      (prismaMock.bansos.findUnique as jest.Mock).mockResolvedValue({ id: BigInt(1) });
      (prismaMock.bansosPenerima.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaMock.bansosPenerima.create as jest.Mock).mockResolvedValue(fakePenerima);

      const result = await bansosService.addPenerima('1', { pendudukId: '5', statusPenerimaan: 'AKTIF' });
      expect(result).toEqual(fakePenerima);
    });
  });
});
