import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ConsultationService } from '../services/consultation.service';
import { CreateConsultationLeadDto } from '../dto/consultation.dto';

const mockLead = {
    id: 'lead-1',
    fullName: 'Nguyen Van A',
    phone: '0901234567',
    status: 'NEW',
    preferredDate: new Date('2026-08-10T00:00:00.000Z'),
    preferredTime: '14:00',
};

/** Ngày tới có getUTCDay = targetDay (0=CN..6=T7), luôn ở tương lai — tránh hardcode. */
function nextWeekdayDate(targetDay: number): string {
    const now = new Date();
    const delta = (targetDay - now.getUTCDay() + 7) % 7;
    const next = new Date(now);
    next.setUTCDate(now.getUTCDate() + (delta === 0 ? 7 : delta));
    next.setUTCHours(12, 0, 0, 0); // trưa UTC: tránh lệch ngày theo timezone
    return next.toISOString().slice(0, 10);
}

describe('ConsultationService', () => {
    let service: ConsultationService;
    const prisma = {
        consultationLead: {
            create: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    };

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ConsultationService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();
        service = module.get(ConsultationService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getSlots', () => {
        it('returns empty slots for Sunday', async () => {
            const result = await service.getSlots(nextWeekdayDate(0));
            expect(result.preferredHours).toEqual([]);
        });

        it('returns 08:00..16:00 for Monday', async () => {
            const result = await service.getSlots(nextWeekdayDate(1));
            expect(result.preferredHours).toHaveLength(9);
            expect(result.preferredHours[0].label).toBe('08:00');
            expect(result.preferredHours[8].label).toBe('16:00');
        });

        it('returns 08:00..11:00 for Saturday', async () => {
            const result = await service.getSlots(nextWeekdayDate(6));
            expect(result.preferredHours.map((s) => s.label)).toEqual(['08:00', '09:00', '10:00', '11:00']);
        });

        it('throws for a past date', async () => {
            await expect(service.getSlots('2020-01-01')).rejects.toThrow(BadRequestException);
        });
    });

    describe('create', () => {
        const dto: CreateConsultationLeadDto = {
            fullName: 'Nguyen Van A',
            phone: '0901234567',
            email: 'a@test.vn',
            preferredDate: '2026-08-10',
            preferredTime: '14:00',
        };

        it('creates a NEW lead for a valid slot', async () => {
            prisma.consultationLead.create.mockResolvedValue(mockLead);
            const result = await service.create(dto);
            expect(result).toEqual(mockLead);
            expect(prisma.consultationLead.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ status: 'NEW', preferredTime: '14:00' }),
                }),
            );
        });

        it('rejects a slot outside working hours', async () => {
            await expect(service.create({ ...dto, preferredTime: '19:00' })).rejects.toThrow(
                BadRequestException,
            );
        });

        it('rejects Sunday booking', async () => {
            await expect(service.create({ ...dto, preferredDate: '2026-08-09' })).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('findAll', () => {
        it('filters by status and paginates', async () => {
            prisma.consultationLead.findMany.mockResolvedValue([mockLead]);
            prisma.consultationLead.count.mockResolvedValue(1);
            const result = await service.findAll({ status: 'NEW', page: 1, limit: 20 });
            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(prisma.consultationLead.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { status: 'NEW' }, skip: 0, take: 20 }),
            );
        });

        it('rejects an invalid status', async () => {
            await expect(service.findAll({ status: 'BOGUS', page: 1, limit: 20 })).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('updateStatus', () => {
        it('sets confirmedAt when status becomes CONFIRMED', async () => {
            prisma.consultationLead.findUnique.mockResolvedValue(mockLead);
            const updated = { ...mockLead, status: 'CONFIRMED', confirmedAt: new Date() };
            prisma.consultationLead.update.mockResolvedValue(updated);
            const result = await service.updateStatus('lead-1', 'CONFIRMED');
            expect(result.status).toBe('CONFIRMED');
            expect(prisma.consultationLead.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ status: 'CONFIRMED', confirmedAt: expect.any(Date) }),
                }),
            );
        });

        it('clears confirmedAt when moving to CANCELLED', async () => {
            prisma.consultationLead.findUnique.mockResolvedValue({ ...mockLead, confirmedAt: new Date() });
            prisma.consultationLead.update.mockResolvedValue({ ...mockLead, status: 'CANCELLED', confirmedAt: null });
            await service.updateStatus('lead-1', 'CANCELLED');
            expect(prisma.consultationLead.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ status: 'CANCELLED', confirmedAt: null }),
                }),
            );
        });

        it('throws NotFound for missing lead', async () => {
            prisma.consultationLead.findUnique.mockResolvedValue(null);
            await expect(service.updateStatus('nope', 'CONFIRMED')).rejects.toThrow(NotFoundException);
        });
    });
});