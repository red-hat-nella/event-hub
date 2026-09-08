import request from 'supertest';
import { randomUUID } from 'crypto';
import { INestApplication } from '@nestjs/common';
import { bootstrapTestApp, internalHeaders } from './utils/bootstrap-app';
import { PrismaService } from '../src/prisma/prisma.service';

const HOUR_MS = 60 * 60 * 1000;
const futureIso = (hoursFromNow: number) =>
  new Date(Date.now() + hoursFromNow * HOUR_MS).toISOString();
const pastIso = (hoursAgo: number) =>
  new Date(Date.now() - hoursAgo * HOUR_MS).toISOString();

describe('Events admin CRUD (e2e) — T101', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdIds: string[] = [];

  beforeAll(async () => {
    const boot = await bootstrapTestApp();
    app = boot.app;
    prisma = boot.prisma;
  });

  afterAll(async () => {
    await prisma.event.deleteMany({ where: { id: { in: createdIds } } });
    await app.close();
  });

  it('POST /internal/events crea un evento válido con availableSlots = maxCapacity', async () => {
    const response = await request(app.getHttpServer())
      .post('/internal/events')
      .set(internalHeaders())
      .send({
        name: 'Exposición de Arte Contemporáneo',
        description: 'Obras de artistas locales emergentes',
        startsAt: futureIso(72),
        location: 'Galería Municipal',
        maxCapacity: 40,
      });

    expect(response.status).toBe(201);
    expect(response.body.maxCapacity).toBe(40);
    expect(response.body.availableSlots).toBe(40);
    expect(response.body.category).toBe('OTHER');
    createdIds.push(response.body.id);
  });

  it('POST /internal/events responde 400 VALIDATION_ERROR con campos obligatorios vacíos', async () => {
    const response = await request(app.getHttpServer())
      .post('/internal/events')
      .set(internalHeaders())
      .send({
        name: '',
        description: '',
        startsAt: futureIso(10),
        location: '',
        maxCapacity: 10,
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.fields).toHaveProperty('name');
    expect(response.body.error.fields).toHaveProperty('description');
    expect(response.body.error.fields).toHaveProperty('location');
  });

  it('POST /internal/events responde 400 VALIDATION_ERROR con fecha pasada (BR-007)', async () => {
    const response = await request(app.getHttpServer())
      .post('/internal/events')
      .set(internalHeaders())
      .send({
        name: 'Evento en el pasado',
        description: 'No debería crearse',
        startsAt: pastIso(1),
        location: 'Algún lugar',
        maxCapacity: 10,
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.fields).toHaveProperty('startsAt');
  });

  it('POST /internal/events responde 400 VALIDATION_ERROR con maxCapacity <= 0', async () => {
    const response = await request(app.getHttpServer())
      .post('/internal/events')
      .set(internalHeaders())
      .send({
        name: 'Evento sin capacidad',
        description: 'Capacidad inválida',
        startsAt: futureIso(10),
        location: 'Algún lugar',
        maxCapacity: 0,
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.fields).toHaveProperty('maxCapacity');
  });

  it('PUT /internal/events/:id actualiza campos exitosamente', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/internal/events')
      .set(internalHeaders())
      .send({
        name: 'Encuentro Comunitario',
        description: 'Reunión vecinal mensual',
        startsAt: futureIso(24),
        location: 'Centro Comunitario',
        maxCapacity: 20,
      });

    const eventId = createResponse.body.id as string;
    createdIds.push(eventId);

    const updateResponse = await request(app.getHttpServer())
      .put(`/internal/events/${eventId}`)
      .set(internalHeaders())
      .send({ location: 'Nuevo Centro Comunitario', maxCapacity: 25 });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.location).toBe('Nuevo Centro Comunitario');
    expect(updateResponse.body.maxCapacity).toBe(25);
    expect(updateResponse.body.availableSlots).toBe(25);
  });

  it('PUT /internal/events/:id responde 409 CAPACITY_BELOW_ACTIVE_REGISTRATIONS al reducir bajo los inscritos activos simulados', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/internal/events')
      .set(internalHeaders())
      .send({
        name: 'Taller de Fotografía',
        description: 'Introducción a la fotografía urbana',
        startsAt: futureIso(50),
        location: 'Estudio Central',
        maxCapacity: 10,
      });

    const eventId = createResponse.body.id as string;
    createdIds.push(eventId);

    // Simula 6 inscripciones activas usando el mismo mecanismo que
    // registration-service usaría en producción: POST .../reserve.
    for (let i = 0; i < 6; i += 1) {
      const reserveResponse = await request(app.getHttpServer())
        .post(`/internal/events/${eventId}/reserve`)
        .set(internalHeaders());
      expect(reserveResponse.status).toBe(200);
    }

    const belowResponse = await request(app.getHttpServer())
      .put(`/internal/events/${eventId}`)
      .set(internalHeaders())
      .send({ maxCapacity: 5 });

    expect(belowResponse.status).toBe(409);
    expect(belowResponse.body.error.code).toBe(
      'CAPACITY_BELOW_ACTIVE_REGISTRATIONS',
    );

    const exactResponse = await request(app.getHttpServer())
      .put(`/internal/events/${eventId}`)
      .set(internalHeaders())
      .send({ maxCapacity: 6 });

    expect(exactResponse.status).toBe(200);
    expect(exactResponse.body.maxCapacity).toBe(6);
    expect(exactResponse.body.availableSlots).toBe(0);
  });

  it('PUT /internal/events/:id responde 404 NOT_FOUND si no existe', async () => {
    const response = await request(app.getHttpServer())
      .put(`/internal/events/${randomUUID()}`)
      .set(internalHeaders())
      .send({ location: 'No existe' });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('DELETE /internal/events/:id elimina el evento (borrado físico)', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/internal/events')
      .set(internalHeaders())
      .send({
        name: 'Evento a eliminar',
        description: 'Este evento será eliminado',
        startsAt: futureIso(5),
        location: 'Lugar temporal',
        maxCapacity: 5,
      });

    const eventId = createResponse.body.id as string;

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/internal/events/${eventId}`)
      .set(internalHeaders());

    expect(deleteResponse.status).toBe(204);

    const getResponse = await request(app.getHttpServer())
      .get(`/internal/events/${eventId}`)
      .set(internalHeaders());

    expect(getResponse.status).toBe(404);
  });

  it('DELETE /internal/events/:id responde 404 NOT_FOUND si no existe', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/internal/events/${randomUUID()}`)
      .set(internalHeaders());

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
