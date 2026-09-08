import request from 'supertest';
import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { EventCategory } from '@prisma/client';
import { bootstrapTestApp, internalHeaders } from './utils/bootstrap-app';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Events catalog (e2e) — T052', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const seedIds: string[] = [];
  let upcomingId: string;
  let ongoingId: string;
  let finishedId: string;

  beforeAll(async () => {
    const boot = await bootstrapTestApp();
    app = boot.app;
    prisma = boot.prisma;

    const now = Date.now();
    const hour = 60 * 60 * 1000;

    const upcoming = await prisma.event.create({
      data: {
        name: 'Concierto de Jazz al Atardecer',
        description: 'Una noche de jazz en el parque central',
        startsAt: new Date(now + 48 * hour),
        location: 'Parque Central',
        maxCapacity: 50,
        availableSlots: 50,
        category: EventCategory.MUSIC,
      },
    });

    const ongoing = await prisma.event.create({
      data: {
        name: 'Feria de Comida Callejera',
        description: 'Sabores locales en un solo lugar',
        startsAt: new Date(now - 1 * hour),
        location: 'Plaza Mayor',
        maxCapacity: 30,
        availableSlots: 5,
        category: EventCategory.FOOD,
      },
    });

    const finished = await prisma.event.create({
      data: {
        name: 'Taller de Cerámica',
        description: 'Aprende técnicas básicas de cerámica',
        startsAt: new Date(now - 5 * hour),
        location: 'Casa de la Cultura',
        maxCapacity: 20,
        availableSlots: 0,
        category: EventCategory.WORKSHOP,
      },
    });

    upcomingId = upcoming.id;
    ongoingId = ongoing.id;
    finishedId = finished.id;
    seedIds.push(upcomingId, ongoingId, finishedId);
  });

  afterAll(async () => {
    await prisma.event.deleteMany({ where: { id: { in: seedIds } } });
    await app.close();
  });

  it('rechaza peticiones sin X-Internal-Token', async () => {
    const response = await request(app.getHttpServer()).get('/internal/events');
    expect(response.status).toBe(401);
  });

  it('GET /internal/events lista eventos y calcula temporalStatus (research.md §21)', async () => {
    const response = await request(app.getHttpServer())
      .get('/internal/events')
      .set(internalHeaders())
      .query({ pageSize: 50 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('page', 1);
    expect(response.body).toHaveProperty('pageSize', 50);
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('totalPages');

    const byId = new Map(
      (
        response.body.items as Array<{ id: string; temporalStatus: string }>
      ).map((event) => [event.id, event]),
    );

    expect(byId.get(upcomingId)?.temporalStatus).toBe('upcoming');
    expect(byId.get(ongoingId)?.temporalStatus).toBe('ongoing');
    expect(byId.get(finishedId)?.temporalStatus).toBe('finished');
  });

  it('filtra por categoría', async () => {
    const response = await request(app.getHttpServer())
      .get('/internal/events')
      .set(internalHeaders())
      .query({ category: EventCategory.FOOD, pageSize: 50 });

    expect(response.status).toBe(200);
    const items = response.body.items as Array<{
      id: string;
      category: string;
    }>;
    expect(items.every((event) => event.category === 'FOOD')).toBe(true);
    expect(items.some((event) => event.id === ongoingId)).toBe(true);
  });

  it('filtra por búsqueda de texto (ILIKE en name/description)', async () => {
    const response = await request(app.getHttpServer())
      .get('/internal/events')
      .set(internalHeaders())
      .query({ search: 'jazz', pageSize: 50 });

    expect(response.status).toBe(200);
    const items = response.body.items as Array<{ id: string }>;
    expect(items.some((event) => event.id === upcomingId)).toBe(true);
    expect(items.some((event) => event.id === ongoingId)).toBe(false);
  });

  it('filtra por ubicación (ILIKE, insensible a mayúsculas)', async () => {
    const response = await request(app.getHttpServer())
      .get('/internal/events')
      .set(internalHeaders())
      .query({ location: 'PLAZA', pageSize: 50 });

    expect(response.status).toBe(200);
    const items = response.body.items as Array<{ id: string }>;
    expect(items.some((event) => event.id === ongoingId)).toBe(true);
  });

  it('filtra por rango de fechas (dateFrom)', async () => {
    const response = await request(app.getHttpServer())
      .get('/internal/events')
      .set(internalHeaders())
      .query({ dateFrom: new Date().toISOString(), pageSize: 50 });

    expect(response.status).toBe(200);
    const ids = (response.body.items as Array<{ id: string }>).map(
      (event) => event.id,
    );
    expect(ids).toContain(upcomingId);
    expect(ids).not.toContain(ongoingId);
    expect(ids).not.toContain(finishedId);
  });

  it('pagina resultados con page/pageSize', async () => {
    const response = await request(app.getHttpServer())
      .get('/internal/events')
      .set(internalHeaders())
      .query({ page: 1, pageSize: 1, sort: 'startsAt' });

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.pageSize).toBe(1);
    expect(response.body.totalPages).toBeGreaterThanOrEqual(3);
  });

  it('GET /internal/events/:id devuelve el detalle con temporalStatus', async () => {
    const response = await request(app.getHttpServer())
      .get(`/internal/events/${upcomingId}`)
      .set(internalHeaders());

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(upcomingId);
    expect(response.body.temporalStatus).toBe('upcoming');
  });

  it('GET /internal/events/:id responde 404 NOT_FOUND si no existe', async () => {
    const response = await request(app.getHttpServer())
      .get(`/internal/events/${randomUUID()}`)
      .set(internalHeaders());

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
